const express = require('express');
const { queryAll, queryOne, runSql } = require('../db/init');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/changelog - Public: list changelog entries grouped by date
router.get('/', (req, res) => {
    try {
        const { limit = 30 } = req.query;
        const entries = queryAll(`
            SELECT c.*, u.display_name as author_name
            FROM changelog c
            LEFT JOIN users u ON c.user_id = u.id
            ORDER BY c.date DESC, c.created_at DESC
            LIMIT ?
        `, [parseInt(limit)]);

        // Group by date
        const grouped = {};
        for (const e of entries) {
            if (!grouped[e.date]) grouped[e.date] = [];
            grouped[e.date].push(e.entry);
        }

        // Convert to array format matching the existing static changelog
        const result = Object.entries(grouped).map(([date, items]) => ({
            date,
            items
        }));

        res.json(result);
    } catch (err) {
        console.error('Changelog error:', err);
        res.status(500).json({ error: 'Failed to fetch changelog' });
    }
});

// POST /api/changelog - Admin: manually add changelog entry
router.post('/', authenticate, requireAdmin, (req, res) => {
    try {
        const { date, entry } = req.body;
        if (!entry) return res.status(400).json({ error: 'entry is required' });

        const entryDate = date || new Date().toLocaleDateString('en-GB', {
            day: 'numeric', month: 'numeric', year: 'numeric'
        }).replace(/\//g, '.');

        runSql('INSERT INTO changelog (date, entry, user_id, action) VALUES (?, ?, ?, ?)',
            [entryDate, entry, req.user.id, 'manual']);

        res.status(201).json({ message: 'Changelog entry added' });
    } catch (err) {
        console.error('Changelog create error:', err);
        res.status(500).json({ error: 'Failed to add changelog entry' });
    }
});

// Helper: auto-log build changes (called from builds routes)
function logBuildChange(action, build, userId) {
    const today = formatDate(new Date());
    let entry = '';

    switch (action) {
        case 'create':
            entry = `Added ${build.ship_name} build: "${build.title}"`;
            break;
        case 'publish':
            entry = `Published ${build.ship_name} build: "${build.title}"`;
            break;
        case 'update':
            entry = `Updated ${build.ship_name} build: "${build.title}"`;
            break;
        case 'delete':
            entry = `Removed ${build.ship_name} build: "${build.title}"`;
            break;
        default:
            entry = `${action} ${build.ship_name} build: "${build.title}"`;
    }

    try {
        runSql('INSERT INTO changelog (date, entry, build_id, user_id, action) VALUES (?, ?, ?, ?, ?)',
            [today, entry, build.id || null, userId, action]);
    } catch (err) {
        console.error('Auto changelog error:', err);
    }
}

function formatDate(d) {
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

module.exports = router;
module.exports.logBuildChange = logBuildChange;
