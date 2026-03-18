/**
 * Seed modernizations from extracted GameParams.data
 * Uses the actual game data for accurate slot assignments and ship filtering.
 *
 * Prerequisites:
 *   1. Extract GameParams.data from WoWS install using wowsunpack
 *   2. Decode with WoWS-GameParams/OneFileToSplitThemAll.py
 *   3. Resulting JSON files in split/root/Modernization/
 */
const fs = require('fs');
const path = require('path');
const { getDb, runSql, queryAll, queryOne, closeDb, saveDb } = require('./init');

const MOD_DIR = path.resolve(__dirname, '../../../../WoWS-GameParams/split/root/Modernization');
const API_BASE = 'https://api.worldofwarships.eu/wows/encyclopedia';
const APP_ID = 'bf9056d37ea85f3cb737b7e12300aab8';

async function apiFetch(endpoint, params = {}) {
    const url = new URL(`${API_BASE}/${endpoint}/`);
    url.searchParams.set('application_id', APP_ID);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString());
    const json = await res.json();
    if (json.status !== 'ok') throw new Error(`API error: ${JSON.stringify(json.error)}`);
    return json;
}

async function run() {
    await getDb();

    // 1. Recreate upgrades table with filtering columns
    console.log('Recreating upgrades table with GameParams schema...');
    const db = await getDb();
    db.run('DROP TABLE IF EXISTS upgrades');
    db.run(`CREATE TABLE upgrades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id TEXT UNIQUE,
        name TEXT NOT NULL,
        index_name TEXT,
        slot INTEGER NOT NULL,
        type INTEGER DEFAULT 0,
        description TEXT,
        image_url TEXT,
        price_credit INTEGER DEFAULT 0,
        effects JSON DEFAULT '{}',
        tag TEXT,
        nations JSON DEFAULT '[]',
        ship_levels JSON DEFAULT '[]',
        ship_types JSON DEFAULT '[]',
        ships JSON DEFAULT '[]',
        excludes JSON DEFAULT '[]'
    )`);

    // 2. Read all GameParams modernization JSONs
    const files = fs.readdirSync(MOD_DIR).filter(f => f.endsWith('.json'));
    console.log(`Found ${files.length} modernization files in GameParams`);

    let inserted = 0, skipped = 0;
    const modsByIndex = {};

    for (const file of files) {
        const raw = JSON.parse(fs.readFileSync(path.join(MOD_DIR, file), 'utf8'));
        // The JSON is either { "key": value, ... } flat or nested
        const mod = raw;

        if (mod.slot === undefined || mod.slot === -1) {
            skipped++;
            continue; // removed/deprecated modernization
        }

        const indexName = mod.name || file.replace('.json', '');
        const tag = indexName.match(/^(PCM\d+)/) ? indexName.match(/^(PCM\d+)/)[1] : null;

        modsByIndex[indexName] = {
            game_id: String(mod.id),
            name: indexName,
            index_name: indexName,
            slot: mod.slot,        // 0-indexed from game data
            type: mod.type || 0,
            nations: mod.nation || [],
            ship_levels: mod.shiplevel || [],
            ship_types: mod.shiptype || [],
            ships: mod.ships || [],
            excludes: mod.excludes || [],
            tag,
            price_credit: mod.costCR || 0,
            modifiers: mod.modifiers || {}
        };
    }

    console.log(`Parsed ${Object.keys(modsByIndex).length} valid mods (${skipped} deprecated with slot=-1)`);

    // 3. Fetch names and images from WoWS API (consumables endpoint)
    console.log('Fetching display names and images from WoWS API...');
    const apiMods = {};
    for (let page = 1; page <= 5; page++) {
        const json = await apiFetch('consumables', { type: 'Modernization', page_no: page, limit: 100 });
        for (const [id, m] of Object.entries(json.data)) {
            apiMods[String(id)] = { name: m.name, image: m.image, description: m.description };
        }
        if (page >= json.meta.page_total) break;
    }
    console.log(`  ${Object.keys(apiMods).length} mods from API`);

    // 4. Merge and insert
    for (const [indexName, mod] of Object.entries(modsByIndex)) {
        const apiData = apiMods[mod.game_id] || {};
        const displayName = apiData.name || indexName;
        const imageUrl = apiData.image || '';
        const description = apiData.description || '';

        // Build effects from modifiers
        const effects = {};
        for (const [key, val] of Object.entries(mod.modifiers)) {
            effects[key] = { value: val };
        }

        runSql(
            `INSERT OR REPLACE INTO upgrades
             (game_id, name, index_name, slot, type, description, image_url, price_credit, effects, tag, nations, ship_levels, ship_types, ships, excludes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                mod.game_id,
                displayName,
                mod.index_name,
                mod.slot,           // actual game slot (0-indexed)
                mod.type,
                description,
                imageUrl,
                mod.price_credit,
                JSON.stringify(effects),
                mod.tag,
                JSON.stringify(mod.nations),
                JSON.stringify(mod.ship_levels),
                JSON.stringify(mod.ship_types),
                JSON.stringify(mod.ships),
                JSON.stringify(mod.excludes)
            ]
        );
        inserted++;
    }

    console.log(`Inserted ${inserted} modernizations with real slot data`);

    // 5. Also ensure ships have upgrade_ids and index names
    // Fetch ship index names from API for matching with excludes/ships lists
    console.log('\nUpdating ships with index names from API...');
    const shipCols = db.exec("PRAGMA table_info(ships)")[0];
    const colNames = shipCols ? shipCols.values.map(r => r[1]) : [];
    if (!colNames.includes('index_name')) {
        db.run("ALTER TABLE ships ADD COLUMN index_name TEXT");
        console.log('  Added index_name column to ships');
    }

    let shipMatched = 0;
    for (let page = 1; page <= 15; page++) {
        const json = await apiFetch('ships', {
            page_no: page,
            fields: 'name,tier,type,ship_id_str,upgrades',
            limit: 100
        });

        for (const [gameId, ship] of Object.entries(json.data)) {
            if (!ship) continue;
            const indexStr = ship.ship_id_str || '';
            // Update our ship with the index_name and upgrade_ids
            const result = runSql(
                'UPDATE ships SET index_name = ?, upgrade_ids = ? WHERE game_id = ?',
                [indexStr, JSON.stringify(ship.upgrades || []), gameId]
            );
            if (result.changes > 0) shipMatched++;
        }

        if (page >= json.meta.page_total) break;
    }
    console.log(`  Updated ${shipMatched} ships with index names`);

    // 6. Summary by slot
    console.log('\n=== SLOT SUMMARY ===');
    for (let slot = 0; slot <= 5; slot++) {
        const count = queryAll('SELECT COUNT(*) as cnt FROM upgrades WHERE slot = ?', [slot]);
        console.log(`  Slot ${slot}: ${count[0].cnt} modernizations`);
    }

    saveDb();
    closeDb();
    console.log('\nGameParams modernization seed complete!');
}

run().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
