const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_PATH = path.resolve(__dirname, '..', process.env.DB_PATH || './db/wows_builds.db');

let db = null;
let SQL = null;

// Save database to disk
function saveDb() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
    }
}

// Auto-save every 30 seconds
let saveInterval = null;

async function getDb() {
    if (db) return db;

    SQL = await initSqlJs();

    // Ensure db directory exists
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    // Load existing database or create new one
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    db.run('PRAGMA journal_mode = WAL');
    db.run('PRAGMA foreign_keys = ON');

    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    db.run(schema);

    // Migrate captain_skills table to new schema if needed.
    // Old schema: id, game_id, name, cost NOT NULL, description, ship_types
    // New schema: id, game_id, name, icon_url, customization JSON
    try {
        const cols = db.exec("PRAGMA table_info(captain_skills)")[0];
        if (cols) {
            const colNames = cols.values.map(row => row[1]);
            if (colNames.includes('cost')) {
                // Legacy schema — drop and recreate with new structure
                db.run('DROP TABLE IF EXISTS captain_skills');
                db.run(`CREATE TABLE captain_skills (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    game_id TEXT UNIQUE,
                    name TEXT NOT NULL,
                    icon_url TEXT,
                    customization JSON NOT NULL DEFAULT '{}'
                )`);
                console.log('[DB] Migrated captain_skills to new schema');
            } else {
                // New schema present — just ensure columns exist
                if (!colNames.includes('icon_url')) {
                    db.run('ALTER TABLE captain_skills ADD COLUMN icon_url TEXT');
                }
                if (!colNames.includes('customization')) {
                    db.run("ALTER TABLE captain_skills ADD COLUMN customization JSON NOT NULL DEFAULT '{}'");
                }
            }
        }
    } catch (e) {
        console.warn('Migration warning:', e.message);
    }

    // Start auto-save
    if (!saveInterval) {
        saveInterval = setInterval(saveDb, 30000);
    }

    return db;
}

function closeDb() {
    if (saveInterval) {
        clearInterval(saveInterval);
        saveInterval = null;
    }
    if (db) {
        saveDb();
        db.close();
        db = null;
    }
}

// Helper: run a query and return all results as array of objects
function queryAll(sql, params = []) {
    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

// Helper: run a query and return first result as object
function queryOne(sql, params = []) {
    const results = queryAll(sql, params);
    return results.length > 0 ? results[0] : null;
}

// Helper: run an INSERT/UPDATE/DELETE and return changes info
function runSql(sql, params = []) {
    db.run(sql, params);
    const lastId = db.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0] || 0;
    const changes = db.getRowsModified();
    saveDb(); // Save after writes
    return { lastInsertRowid: lastId, changes };
}

module.exports = { getDb, closeDb, queryAll, queryOne, runSql, saveDb };
