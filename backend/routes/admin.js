const express = require('express');
const { queryAll, queryOne, runSql } = require('../db/init');
const { authenticate, requireAdmin } = require('../middleware/auth');
const wowsData = require('../services/wowsData');

const router = express.Router();

router.use(authenticate, requireAdmin);

// GET /api/admin/stats
router.get('/stats', (req, res) => {
    try {
        const totalBuilds = queryOne('SELECT COUNT(*) as count FROM builds').count;
        const publishedBuilds = queryOne("SELECT COUNT(*) as count FROM builds WHERE status = 'published'").count;
        const draftBuilds = queryOne("SELECT COUNT(*) as count FROM builds WHERE status = 'draft'").count;
        const totalUsers = queryOne('SELECT COUNT(*) as count FROM users').count;
        const totalViews = queryOne('SELECT COALESCE(SUM(view_count), 0) as total FROM builds').total;

        const buildsByCategory = queryAll(`
            SELECT sc.name, sc.slug, COUNT(b.id) as count
            FROM ship_categories sc
            LEFT JOIN builds b ON b.category_id = sc.id AND b.status = 'published'
            GROUP BY sc.id ORDER BY sc.display_order
        `);

        const recentBuilds = queryAll(`
            SELECT b.id, b.title, b.ship_name, b.status, b.updated_at, u.display_name as author
            FROM builds b JOIN users u ON b.author_id = u.id
            ORDER BY b.updated_at DESC LIMIT 10
        `);

        res.json({ totalBuilds, publishedBuilds, draftBuilds, totalUsers, totalViews, buildsByCategory, recentBuilds });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/builds
router.get('/builds', (req, res) => {
    try {
        const { status, author_id, page = 1, limit = 50 } = req.query;

        let query = `SELECT b.*, u.display_name as author_name, sc.name as category_name
                      FROM builds b
                      JOIN users u ON b.author_id = u.id
                      JOIN ship_categories sc ON b.category_id = sc.id WHERE 1=1`;
        const params = [];

        if (status) { query += ' AND b.status = ?'; params.push(status); }
        if (author_id) { query += ' AND b.author_id = ?'; params.push(parseInt(author_id)); }

        query += ' ORDER BY b.updated_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

        const builds = queryAll(query, params);
        res.json(builds);
    } catch (err) {
        console.error('Admin builds error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/admin/builds/:id/feature
router.put('/builds/:id/feature', (req, res) => {
    try {
        const build = queryOne('SELECT * FROM builds WHERE id = ?', [parseInt(req.params.id)]);
        if (!build) return res.status(404).json({ error: 'Build not found' });

        runSql('UPDATE builds SET featured = ? WHERE id = ?', [build.featured ? 0 : 1, build.id]);
        res.json({ featured: !build.featured });
    } catch (err) {
        console.error('Feature toggle error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/audit
router.get('/audit', (req, res) => {
    try {
        const { limit = 100 } = req.query;
        const logs = queryAll(`
            SELECT al.*, u.display_name as user_name
            FROM audit_log al JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC LIMIT ?
        `, [parseInt(limit)]);
        res.json(logs);
    } catch (err) {
        console.error('Audit log error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/cache/clear
router.post('/cache/clear', (req, res) => {
    wowsData.clearCache();
    res.json({ message: 'Cache cleared' });
});

module.exports = router;
