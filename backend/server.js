require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { getDb, closeDb } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests, please try again later' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many login attempts, please try again later' }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

// Health check (no db needed)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/ships', require('./routes/ships'));
app.use('/api/builds', require('./routes/builds'));
app.use('/api/changelog', require('./routes/changelog'));
app.use('/api/admin', require('./routes/admin'));

// Serve static admin dashboard
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    closeDb();
    process.exit(0);
});

// Initialize DB then start server
async function start() {
    await getDb();
    console.log('Database initialized');

    app.listen(PORT, () => {
        console.log(`WoWS Builds API running on http://localhost:${PORT}`);
        console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
        console.log(`API health: http://localhost:${PORT}/api/health`);
    });
}

start().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
