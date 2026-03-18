/**
 * WoWs Ship Data Service
 * Serves ship/skill data from local database (populated via fetch-api-data.js)
 */

const { queryAll, queryOne } = require('../db/init');

// Map ship type string to our category slugs
function shipTypeToCategory(shipType) {
    const mapping = {
        'Destroyer':  'destroyer',
        'Cruiser':    'cruiser',
        'Battleship': 'battleship',
        'AirCarrier': 'carrier',
        'Submarine':  'submarine'
    };
    return mapping[shipType] || 'destroyer';
}

// Get all ships from local database
function getShips(filters = {}) {
    let query = 'SELECT * FROM ships WHERE 1=1';
    const params = [];

    if (filters.type)   { query += ' AND type = ?';       params.push(filters.type); }
    if (filters.tier)   { query += ' AND tier = ?';        params.push(parseInt(filters.tier)); }
    if (filters.nation) { query += ' AND nation = ?';      params.push(filters.nation); }
    if (filters.search) { query += ' AND name LIKE ?';     params.push(`%${filters.search}%`); }

    query += ' ORDER BY tier DESC, type, name';
    return queryAll(query, params);
}

// Get single ship
function getShip(id) {
    return queryOne('SELECT * FROM ships WHERE id = ?', [parseInt(id)]);
}

/**
 * Get captain skills, optionally filtered to a specific ship type.
 * Returns each skill with:
 *   id, game_id, name, icon_url, tier (1-4), cost (= tier), perks (array), column
 *
 * The WoWS API uses per-class tiers stored in the `customization` JSON column:
 *   customization = { "Destroyer": { tier, column, perks[] }, "Cruiser": { ... }, ... }
 */
function getSkills(shipType) {
    const rows = queryAll('SELECT * FROM captain_skills ORDER BY name');
    const result = [];

    for (const row of rows) {
        let customization = {};
        try {
            customization = JSON.parse(row.customization || '{}');
        } catch (e) {
            customization = {};
        }

        if (shipType) {
            // Only return skills that apply to this ship type
            if (!customization[shipType]) continue;
            const cls = customization[shipType];
            result.push({
                id:        row.id,
                game_id:   row.game_id,
                name:      row.name,
                icon_url:  row.icon_url || null,
                tier:      cls.tier,          // 1-4
                cost:      cls.tier,          // same value — kept for compatibility
                column:    cls.column,
                perks:     cls.perks || [],
                description: (cls.perks || []).map(p => p.description).join(' | ')
            });
        } else {
            // No filter — return all ship types this skill applies to
            // Derive a representative tier (min across classes) for display
            const classes = Object.keys(customization);
            if (classes.length === 0) continue;
            const minTier = Math.min(...classes.map(c => customization[c].tier));
            result.push({
                id:           row.id,
                game_id:      row.game_id,
                name:         row.name,
                icon_url:     row.icon_url || null,
                tier:         minTier,
                cost:         minTier,
                customization: customization,
                ship_types:   classes.join(',')
            });
        }
    }

    // Sort by tier then name
    result.sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
    return result;
}

// Get all upgrades/modernizations
function getUpgrades() {
    return queryAll('SELECT * FROM upgrades ORDER BY slot, name');
}

// Get upgrades available for a specific ship, grouped by slot
// Uses GameParams data: real slot numbers (0-5) displayed as 1-6
function getUpgradesForShip(shipId) {
    const ship = queryOne('SELECT upgrade_ids, index_name, tier, type, nation FROM ships WHERE id = ?', [parseInt(shipId)]);
    if (!ship || !ship.upgrade_ids) return { slots: {} };

    let upgradeIds;
    try {
        upgradeIds = JSON.parse(ship.upgrade_ids);
    } catch (e) {
        return { slots: {} };
    }

    if (!upgradeIds.length) return { slots: {} };

    // Fetch all matching upgrades from our table
    const placeholders = upgradeIds.map(() => '?').join(',');
    const upgrades = queryAll(
        `SELECT * FROM upgrades WHERE game_id IN (${placeholders}) ORDER BY slot, name`,
        upgradeIds.map(String)
    );

    // Group by display slot (game slot 0 → display slot 1, etc.)
    const slots = {};
    for (const u of upgrades) {
        const displaySlot = u.slot + 1;  // 0-indexed → 1-indexed for display
        if (!slots[displaySlot]) slots[displaySlot] = [];
        let effects = {};
        try { effects = JSON.parse(u.effects || '{}'); } catch (e) {}
        slots[displaySlot].push({
            id: u.id,
            game_id: u.game_id,
            name: u.name,
            slot: displaySlot,
            description: u.description,
            image_url: u.image_url,
            price_credit: u.price_credit,
            effects
        });
    }

    return { slots };
}

// Get nations list
function getNations() {
    return queryAll('SELECT DISTINCT nation FROM ships ORDER BY nation');
}

module.exports = {
    shipTypeToCategory,
    getShips,
    getShip,
    getSkills,
    getUpgrades,
    getUpgradesForShip,
    getNations
};
