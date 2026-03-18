/**
 * Seed modernizations (upgrades) from the WoWS API
 * Fetches all 118 modernizations and assigns slots based on price.
 * Also fetches each ship's available upgrade IDs.
 */
const { getDb, runSql, queryAll, closeDb, saveDb } = require('./init');

const API_BASE = 'https://api.worldofwarships.eu/wows/encyclopedia';
const APP_ID = 'bf9056d37ea85f3cb737b7e12300aab8';

async function apiFetch(endpoint, params = {}) {
    const url = new URL(`${API_BASE}/${endpoint}/`);
    url.searchParams.set('application_id', APP_ID);
    for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
    }
    const res = await fetch(url.toString());
    const json = await res.json();
    if (json.status !== 'ok') {
        throw new Error(`API error for ${endpoint}: ${JSON.stringify(json.error)}`);
    }
    return json;
}

// Price → Slot mapping (verified against Yamato's upgrade list)
function getSlotFromPrice(price) {
    if (price <= 125000) return 1;
    if (price <= 250000) return 2;
    if (price <= 500000) return 3;
    if (price <= 1000000) return 4;
    if (price <= 2000000) return 5;
    if (price <= 3000000) return 6;
    // 5M = unique upgrades, default to slot 5
    return 5;
}

async function seedModernizations() {
    await getDb();
    console.log('Fetching modernizations from WoWS API...');

    // Migrate upgrades table to new schema
    const cols = getDb().then ? null : null; // getDb already ran
    try {
        const db = await getDb();
        const info = db.exec("PRAGMA table_info(upgrades)")[0];
        const colNames = info ? info.values.map(r => r[1]) : [];
        if (!colNames.includes('image_url')) {
            // Need to recreate with new columns
            db.run('DROP TABLE IF EXISTS upgrades');
            db.run(`CREATE TABLE upgrades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id TEXT UNIQUE,
                name TEXT NOT NULL,
                slot INTEGER NOT NULL,
                description TEXT,
                image_url TEXT,
                price_credit INTEGER DEFAULT 0,
                effects JSON DEFAULT '{}',
                tag TEXT
            )`);
            console.log('  Recreated upgrades table with new schema');
        }
    } catch (e) {
        console.warn('Table check warning:', e.message);
    }

    // Fetch all modernizations (2 pages)
    let allMods = {};
    for (let page = 1; page <= 3; page++) {
        const json = await apiFetch('consumables', {
            type: 'Modernization',
            page_no: page,
            limit: 100
        });
        Object.assign(allMods, json.data);
        console.log(`  Page ${page}: ${Object.keys(json.data).length} items (total so far: ${Object.keys(allMods).length})`);
        if (page >= json.meta.page_total) break;
    }

    console.log(`  Total modernizations fetched: ${Object.keys(allMods).length}`);

    // Insert into DB
    let count = 0;
    for (const [id, mod] of Object.entries(allMods)) {
        const slot = getSlotFromPrice(mod.price_credit);

        // Extract PCM tag from image URL
        const tagMatch = mod.image ? mod.image.match(/icon_modernization_(PCM\d+)/) : null;
        const tag = tagMatch ? tagMatch[1] : null;

        // Build effects summary from profile
        const effects = {};
        if (mod.profile) {
            for (const [key, val] of Object.entries(mod.profile)) {
                effects[key] = {
                    description: val.description,
                    value: val.value
                };
            }
        }

        runSql(
            `INSERT OR REPLACE INTO upgrades (game_id, name, slot, description, image_url, price_credit, effects, tag)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, mod.name, slot, mod.description || '', mod.image || '', mod.price_credit, JSON.stringify(effects), tag]
        );
        count++;
    }
    console.log(`  ${count} modernizations seeded into DB`);

    // Now add upgrade_ids to ships table
    console.log('\nAdding upgrade_ids column to ships...');
    try {
        const db = await getDb();
        const shipCols = db.exec("PRAGMA table_info(ships)")[0];
        const shipColNames = shipCols ? shipCols.values.map(r => r[1]) : [];
        if (!shipColNames.includes('upgrade_ids')) {
            db.run("ALTER TABLE ships ADD COLUMN upgrade_ids TEXT DEFAULT '[]'");
            console.log('  Added upgrade_ids column');
        }
        if (!shipColNames.includes('game_id')) {
            // Already exists per schema, just ensure it
        }
    } catch (e) {
        console.warn('  Column already exists or error:', e.message);
    }

    // Fetch ships from API and match to our DB by name
    console.log('\nFetching ship upgrade lists from WoWS API...');
    const ourShips = queryAll('SELECT id, name, tier, type FROM ships');
    console.log(`  ${ourShips.length} ships in our DB`);

    const usedGameIds = new Set();
    const usedDbIds = new Set();
    let matched = 0;

    for (let page = 1; page <= 15; page++) {
        const json = await apiFetch('ships', {
            page_no: page,
            fields: 'name,tier,type,upgrades,ship_id_str',
            limit: 100
        });

        for (const [gameId, ship] of Object.entries(json.data)) {
            if (!ship || !ship.upgrades || usedGameIds.has(gameId)) continue;
            // Match by name + tier to avoid duplicates
            const match = ourShips.find(s =>
                !usedDbIds.has(s.id) &&
                s.tier === ship.tier &&
                (s.name === ship.name || s.name === ship.name.replace(/\[|\]/g, ''))
            );
            if (match) {
                usedGameIds.add(gameId);
                usedDbIds.add(match.id);
                try {
                    runSql(
                        'UPDATE ships SET game_id = ?, upgrade_ids = ? WHERE id = ? AND (game_id IS NULL OR game_id = ?)',
                        [gameId, JSON.stringify(ship.upgrades), match.id, gameId]
                    );
                    matched++;
                } catch (e) {
                    // Skip duplicates
                }
            }
        }

        if (page >= json.meta.page_total) break;
    }
    console.log(`  Matched ${matched} ships with upgrade data`);

    saveDb();
    closeDb();
    console.log('\nModernization seed complete!');
}

seedModernizations().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
