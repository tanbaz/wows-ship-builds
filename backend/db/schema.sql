-- Users table: 3 admins + 7 editors
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'editor')),
    display_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- Ship categories (Destroyer, Cruiser, Battleship, Carrier, Submarine)
CREATE TABLE IF NOT EXISTS ship_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0
);

-- Published builds
CREATE TABLE IF NOT EXISTS builds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ship_id TEXT NOT NULL,
    ship_name TEXT NOT NULL,
    ship_tier INTEGER NOT NULL,
    ship_nation TEXT NOT NULL,
    ship_type TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    play_style_notes TEXT,
    alternative_notes TEXT,

    -- Build data (JSON)
    captain_skills JSON NOT NULL DEFAULT '[]',
    modules JSON NOT NULL DEFAULT '{}',
    upgrades JSON NOT NULL DEFAULT '[]',
    consumables JSON NOT NULL DEFAULT '[]',
    signals JSON NOT NULL DEFAULT '[]',

    -- Metadata
    author_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
    featured INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME,

    FOREIGN KEY (author_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES ship_categories(id)
);

-- Build tags for additional categorization
CREATE TABLE IF NOT EXISTS build_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    build_id INTEGER NOT NULL,
    tag TEXT NOT NULL,
    FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE
);

-- Audit log for tracking changes
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Ships database (populated from game data)
CREATE TABLE IF NOT EXISTS ships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT UNIQUE,
    name TEXT NOT NULL,
    tier INTEGER NOT NULL,
    type TEXT NOT NULL,
    nation TEXT NOT NULL,
    is_premium INTEGER DEFAULT 0,
    image_url TEXT
);

-- Captain skills (per-class tier data from WoWS API)
CREATE TABLE IF NOT EXISTS captain_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT UNIQUE,
    name TEXT NOT NULL,
    icon_url TEXT,
    customization JSON NOT NULL DEFAULT '{}'
);

-- Upgrades / Modernizations
CREATE TABLE IF NOT EXISTS upgrades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT UNIQUE,
    name TEXT NOT NULL,
    slot INTEGER NOT NULL,
    description TEXT
);

-- Changelog entries (auto-generated when builds change)
CREATE TABLE IF NOT EXISTS changelog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    entry TEXT NOT NULL,
    build_id INTEGER,
    user_id INTEGER,
    action TEXT NOT NULL DEFAULT 'update',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_changelog_date ON changelog(date DESC);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_builds_ship_type ON builds(ship_type);
CREATE INDEX IF NOT EXISTS idx_builds_status ON builds(status);
CREATE INDEX IF NOT EXISTS idx_builds_category ON builds(category_id);
CREATE INDEX IF NOT EXISTS idx_builds_author ON builds(author_id);
CREATE INDEX IF NOT EXISTS idx_builds_ship_id ON builds(ship_id);
CREATE INDEX IF NOT EXISTS idx_build_tags_build ON build_tags(build_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
