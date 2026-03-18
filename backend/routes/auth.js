const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne, queryAll, runSql } = require('../db/init');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '24h';

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const user = queryOne('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        runSql('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, display_name: user.display_name },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                display_name: user.display_name,
                email: user.email
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
    const user = queryOne('SELECT id, username, email, role, display_name, created_at, last_login FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
});

// PUT /api/auth/password
router.put('/password', authenticate, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password) {
            return res.status(400).json({ error: 'Current and new password required' });
        }
        if (new_password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const user = queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
        const valid = await bcrypt.compare(current_password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const hash = await bcrypt.hash(new_password, 12);
        runSql('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hash, req.user.id]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Password change error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/auth/users - List all users (admin only)
router.get('/users', authenticate, requireAdmin, (req, res) => {
    const users = queryAll('SELECT id, username, email, role, display_name, created_at, last_login FROM users ORDER BY role, username');
    res.json(users);
});

// PUT /api/auth/users/:id - Update user (admin only)
router.put('/users/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { display_name, email, role, password } = req.body;
        const user = queryOne('SELECT * FROM users WHERE id = ?', [parseInt(req.params.id)]);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (display_name) runSql('UPDATE users SET display_name = ? WHERE id = ?', [display_name, user.id]);
        if (email) runSql('UPDATE users SET email = ? WHERE id = ?', [email, user.id]);
        if (role && ['admin', 'editor'].includes(role)) runSql('UPDATE users SET role = ? WHERE id = ?', [role, user.id]);
        if (password) {
            const hash = await bcrypt.hash(password, 12);
            runSql('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);
        }
        runSql('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        res.json({ message: 'User updated' });
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
