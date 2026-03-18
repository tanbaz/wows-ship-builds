const express = require('express');
const { queryAll, queryOne, runSql } = require('../db/init');
const { authenticate, requireEditor } = require('../middleware/auth');
const wowsData = require('../services/wowsData');
const { logBuildChange } = require('./changelog');

const router = express.Router();

// GET /api/builds/my/all - must be before /:id route
router.get('/my/all', authenticate, requireEditor, (req, res) => {
    try {
        const builds = queryAll(`
            SELECT b.*, sc.name as category_name, sc.slug as category_slug
            FROM builds b
            JOIN ship_categories sc ON b.category_id = sc.id
            WHERE b.author_id = ?
            ORDER BY b.updated_at DESC
        `, [req.user.id]);
        res.json(builds);
    } catch (err) {
        console.error('My builds error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/builds - List published builds (public)
router.get('/', (req, res) => {
    try {
        const { category, ship_type, tier, nation, search, page = 1, limit = 50 } = req.query;

        let query = `SELECT b.*, u.display_name as author_name, sc.name as category_name, sc.slug as category_slug
                      FROM builds b
                      JOIN users u ON b.author_id = u.id
                      JOIN ship_categories sc ON b.category_id = sc.id
                      WHERE b.status = 'published'`;
        const params = [];

        if (category) { query += ' AND sc.slug = ?'; params.push(category); }
        if (ship_type) { query += ' AND b.ship_type = ?'; params.push(ship_type); }
        if (tier) { query += ' AND b.ship_tier = ?'; params.push(parseInt(tier)); }
        if (nation) { query += ' AND b.ship_nation = ?'; params.push(nation); }
        if (search) { query += ' AND (b.ship_name LIKE ? OR b.title LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

        query += ' ORDER BY b.featured DESC, b.published_at DESC';

        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const builds = queryAll(query, params);

        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM builds b
                          JOIN ship_categories sc ON b.category_id = sc.id
                          WHERE b.status = 'published'`;
        const countParams = [];
        if (category) { countQuery += ' AND sc.slug = ?'; countParams.push(category); }
        if (ship_type) { countQuery += ' AND b.ship_type = ?'; countParams.push(ship_type); }
        if (tier) { countQuery += ' AND b.ship_tier = ?'; countParams.push(parseInt(tier)); }
        if (nation) { countQuery += ' AND b.ship_nation = ?'; countParams.push(nation); }
        if (search) { countQuery += ' AND (b.ship_name LIKE ? OR b.title LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`); }

        const countResult = queryOne(countQuery, countParams);
        const total = countResult ? countResult.total : 0;

        res.json({ builds, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        console.error('List builds error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/builds/:id - Get single build (public)
router.get('/:id', (req, res) => {
    try {
        const build = queryOne(`
            SELECT b.*, u.display_name as author_name, sc.name as category_name, sc.slug as category_slug
            FROM builds b
            JOIN users u ON b.author_id = u.id
            JOIN ship_categories sc ON b.category_id = sc.id
            WHERE b.id = ?
        `, [parseInt(req.params.id)]);

        if (!build) return res.status(404).json({ error: 'Build not found' });
        if (build.status !== 'published') {
            const authHeader = req.headers.authorization;
            if (!authHeader) return res.status(404).json({ error: 'Build not found' });
        }

        runSql('UPDATE builds SET view_count = view_count + 1 WHERE id = ?', [build.id]);

        const tags = queryAll('SELECT tag FROM build_tags WHERE build_id = ?', [build.id]).map(t => t.tag);
        build.tags = tags;

        res.json(build);
    } catch (err) {
        console.error('Get build error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/builds - Create a new build (editor+)
router.post('/', authenticate, requireEditor, (req, res) => {
    try {
        const {
            ship_id, ship_name, ship_tier, ship_nation, ship_type,
            title, description, play_style_notes, alternative_notes,
            captain_skills, modules, upgrades, consumables, signals,
            tags, status = 'draft'
        } = req.body;

        if (!ship_id || !ship_name || !ship_type || !title) {
            return res.status(400).json({ error: 'ship_id, ship_name, ship_type, and title are required' });
        }

        const categorySlug = wowsData.shipTypeToCategory(ship_type);
        const category = queryOne('SELECT id FROM ship_categories WHERE slug = ?', [categorySlug]);
        if (!category) return res.status(400).json({ error: 'Invalid ship type' });

        const publishStatus = status === 'published' ? 'published' : 'draft';
        const publishedAt = status === 'published' ? new Date().toISOString() : null;

        const result = runSql(`
            INSERT INTO builds (ship_id, ship_name, ship_tier, ship_nation, ship_type, category_id,
                title, description, play_style_notes, alternative_notes,
                captain_skills, modules, upgrades, consumables, signals,
                author_id, status, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            ship_id, ship_name, ship_tier || 1, ship_nation || '', ship_type, category.id,
            title, description || '', play_style_notes || '', alternative_notes || '',
            JSON.stringify(captain_skills || []),
            JSON.stringify(modules || {}),
            JSON.stringify(upgrades || []),
            JSON.stringify(consumables || []),
            JSON.stringify(signals || []),
            req.user.id,
            publishStatus,
            publishedAt
        ]);

        if (tags && tags.length) {
            for (const tag of tags) {
                runSql('INSERT INTO build_tags (build_id, tag) VALUES (?, ?)', [result.lastInsertRowid, tag]);
            }
        }

        runSql('INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'create', 'build', result.lastInsertRowid, `Created build: ${title}`]);

        // Auto-log to changelog if published
        if (publishStatus === 'published') {
            logBuildChange('publish', { id: result.lastInsertRowid, ship_name, title }, req.user.id);
        }

        res.status(201).json({ id: result.lastInsertRowid, message: 'Build created' });
    } catch (err) {
        console.error('Create build error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/builds/:id - Update a build (author or admin)
router.put('/:id', authenticate, requireEditor, (req, res) => {
    try {
        const build = queryOne('SELECT * FROM builds WHERE id = ?', [parseInt(req.params.id)]);
        if (!build) return res.status(404).json({ error: 'Build not found' });

        if (build.author_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to edit this build' });
        }

        const {
            title, description, play_style_notes, alternative_notes,
            captain_skills, modules, upgrades, consumables, signals,
            tags, status
        } = req.body;

        const updates = [];
        const params = [];

        if (title !== undefined) { updates.push('title = ?'); params.push(title); }
        if (description !== undefined) { updates.push('description = ?'); params.push(description); }
        if (play_style_notes !== undefined) { updates.push('play_style_notes = ?'); params.push(play_style_notes); }
        if (alternative_notes !== undefined) { updates.push('alternative_notes = ?'); params.push(alternative_notes); }
        if (captain_skills !== undefined) { updates.push('captain_skills = ?'); params.push(JSON.stringify(captain_skills)); }
        if (modules !== undefined) { updates.push('modules = ?'); params.push(JSON.stringify(modules)); }
        if (upgrades !== undefined) { updates.push('upgrades = ?'); params.push(JSON.stringify(upgrades)); }
        if (consumables !== undefined) { updates.push('consumables = ?'); params.push(JSON.stringify(consumables)); }
        if (signals !== undefined) { updates.push('signals = ?'); params.push(JSON.stringify(signals)); }
        if (status !== undefined) {
            updates.push('status = ?'); params.push(status);
            if (status === 'published' && !build.published_at) {
                updates.push("published_at = datetime('now')");
            }
        }

        updates.push("updated_at = datetime('now')");
        params.push(parseInt(req.params.id));

        if (updates.length > 1) {
            runSql(`UPDATE builds SET ${updates.join(', ')} WHERE id = ?`, params);
        }

        if (tags !== undefined) {
            runSql('DELETE FROM build_tags WHERE build_id = ?', [parseInt(req.params.id)]);
            for (const tag of tags) {
                runSql('INSERT INTO build_tags (build_id, tag) VALUES (?, ?)', [parseInt(req.params.id), tag]);
            }
        }

        runSql('INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'update', 'build', parseInt(req.params.id), `Updated build: ${title || build.title}`]);

        // Auto-log to changelog
        const updatedBuild = queryOne('SELECT * FROM builds WHERE id = ?', [parseInt(req.params.id)]);
        if (updatedBuild && updatedBuild.status === 'published') {
            const action = (status === 'published' && build.status !== 'published') ? 'publish' : 'update';
            logBuildChange(action, { id: updatedBuild.id, ship_name: updatedBuild.ship_name, title: updatedBuild.title }, req.user.id);
        }

        res.json({ message: 'Build updated' });
    } catch (err) {
        console.error('Update build error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/builds/:id
router.delete('/:id', authenticate, requireEditor, (req, res) => {
    try {
        const build = queryOne('SELECT * FROM builds WHERE id = ?', [parseInt(req.params.id)]);
        if (!build) return res.status(404).json({ error: 'Build not found' });

        if (build.author_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this build' });
        }

        runSql('DELETE FROM build_tags WHERE build_id = ?', [parseInt(req.params.id)]);
        runSql('DELETE FROM builds WHERE id = ?', [parseInt(req.params.id)]);

        runSql('INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'delete', 'build', parseInt(req.params.id), `Deleted build: ${build.title}`]);

        // Auto-log to changelog if was published
        if (build.status === 'published') {
            logBuildChange('delete', { id: build.id, ship_name: build.ship_name, title: build.title }, req.user.id);
        }

        res.json({ message: 'Build deleted' });
    } catch (err) {
        console.error('Delete build error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
