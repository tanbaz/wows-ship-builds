const express = require('express');
const { queryAll, queryOne, runSql } = require('../db/init');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/content/:pageSlug - Public: get all sections for a page
router.get('/:pageSlug', (req, res) => {
    try {
        const sections = queryAll(
            `SELECT section_key, title, body, display_order, updated_at
             FROM page_content
             WHERE page_slug = ?
             ORDER BY display_order ASC`,
            [req.params.pageSlug]
        );
        res.json(sections);
    } catch (err) {
        console.error('Content fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch content' });
    }
});

// PUT /api/content/:pageSlug/:sectionKey - Admin: update or create section
router.put('/:pageSlug/:sectionKey', authenticate, requireAdmin, (req, res) => {
    try {
        const { title, body, display_order } = req.body;
        if (!body) return res.status(400).json({ error: 'body is required' });

        const existing = queryOne(
            'SELECT id FROM page_content WHERE page_slug = ? AND section_key = ?',
            [req.params.pageSlug, req.params.sectionKey]
        );

        if (existing) {
            runSql(
                `UPDATE page_content SET title = ?, body = ?, display_order = ?,
                 updated_at = datetime('now'), updated_by = ?
                 WHERE page_slug = ? AND section_key = ?`,
                [title || '', body, display_order || 0, req.user.id,
                 req.params.pageSlug, req.params.sectionKey]
            );
        } else {
            runSql(
                `INSERT INTO page_content (page_slug, section_key, title, body, display_order, updated_by)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [req.params.pageSlug, req.params.sectionKey, title || '', body,
                 display_order || 0, req.user.id]
            );
        }

        res.json({ message: 'Content updated' });
    } catch (err) {
        console.error('Content update error:', err);
        res.status(500).json({ error: 'Failed to update content' });
    }
});

module.exports = router;
