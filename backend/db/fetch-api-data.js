/**
 * Fetch real WoWS game data from the official API and seed the database.
 * Run: node backend/db/fetch-api-data.js
 *
 * API docs: https://developers.wargaming.net/reference/all/wows/encyclopedia/
 */

const { getDb, queryOne, runSql, closeDb } = require('./init');

const APP_ID = 'bf9056d37ea85f3cb737b7e12300aab8';
const BASE_URL = 'https://api.worldofwarships.eu/wows/encyclopedia';

// Valid ship types for builds
const VALID_TYPES = ['Destroyer', 'Cruiser', 'Battleship', 'AirCarrier', 'Submarine'];
const MIN_TIER = 5;  // Include T5+ ships

async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    const json = await res.json();
    if (json.status !== 'ok') throw new Error(`API error: ${JSON.stringify(json.error)}`);
    return json;
}

// ---- CAPTAIN SKILLS ----
async function fetchAndSeedSkills(db) {
    console.log('\n[Skills] Fetching from WoWS API...');
    const json = await fetchJson(`${BASE_URL}/crewskills/?application_id=${APP_ID}`);
    const skillsMap = json.data;
    const skillIds = Object.keys(skillsMap);
    console.log(`[Skills] Got ${skillIds.length} skills`);

    let inserted = 0, updated = 0;
    for (const gameId of skillIds) {
        const sk = skillsMap[gameId];
        // Only keep skills that have at least one valid ship type
        const hasValidType = Object.keys(sk.customization || {}).some(t => VALID_TYPES.includes(t));
        if (!hasValidType) continue;

        const customizationJson = JSON.stringify(sk.customization || {});
        const existing = queryOne('SELECT id FROM captain_skills WHERE game_id = ?', [gameId]);
        if (existing) {
            runSql(
                `UPDATE captain_skills SET name=?, icon_url=?, customization=? WHERE game_id=?`,
                [sk.name, sk.icon || null, customizationJson, gameId]
            );
            updated++;
        } else {
            runSql(
                `INSERT INTO captain_skills (game_id, name, icon_url, customization) VALUES (?,?,?,?)`,
                [gameId, sk.name, sk.icon || null, customizationJson]
            );
            inserted++;
        }
    }
    console.log(`[Skills] Done — ${inserted} inserted, ${updated} updated`);
}

// ---- SHIPS ----
async function fetchAndSeedShips(db) {
    console.log('\n[Ships] Fetching from WoWS API (all pages)...');

    // First request to get total pages
    const firstPage = await fetchJson(
        `${BASE_URL}/ships/?application_id=${APP_ID}&fields=ship_id,name,nation,type,tier,is_premium&page_no=1`
    );
    const totalPages = firstPage.meta.page_total || firstPage.meta.pages_total || firstPage.meta.pages || 1;
    console.log(`[Ships] ${firstPage.meta.total} total ships across ${totalPages} pages`);

    let allShips = Object.values(firstPage.data);

    // Fetch remaining pages in parallel batches of 5
    const pageNums = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const batchSize = 5;
    for (let i = 0; i < pageNums.length; i += batchSize) {
        const batch = pageNums.slice(i, i + batchSize);
        const results = await Promise.all(batch.map(p =>
            fetchJson(`${BASE_URL}/ships/?application_id=${APP_ID}&fields=ship_id,name,nation,type,tier,is_premium&page_no=${p}`)
        ));
        results.forEach(r => allShips = allShips.concat(Object.values(r.data)));
        process.stdout.write(`  Pages ${batch[0]}-${batch[batch.length - 1]} done...\n`);
    }

    // Filter: valid types only, T5+
    const filtered = allShips.filter(s =>
        VALID_TYPES.includes(s.type) && s.tier >= MIN_TIER
    );
    console.log(`[Ships] ${filtered.length} ships after filtering (T${MIN_TIER}+, valid types)`);

    // Normalize nation string (API returns lowercase with underscores)
    const NATION_MAP = {
        'usa': 'USA', 'ussr': 'USSR', 'uk': 'UK', 'japan': 'Japan',
        'germany': 'Germany', 'france': 'France', 'italy': 'Italy',
        'pan_asia': 'Pan Asia', 'pan_america': 'Pan America',
        'europe': 'Europe', 'netherlands': 'Netherlands',
        'commonwealth': 'Commonwealth', 'spain': 'Spain'
    };
    function formatNation(n) {
        if (!n) return 'Unknown';
        const key = n.toLowerCase();
        return NATION_MAP[key] || n.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    // Remove old manually-seeded ships that have no game_id (legacy data)
    const oldCount = queryOne('SELECT COUNT(*) as n FROM ships WHERE game_id IS NULL');
    if (oldCount && oldCount.n > 0) {
        runSql('DELETE FROM ships WHERE game_id IS NULL');
        console.log(`[Ships] Removed ${oldCount.n} legacy manually-seeded ships`);
    }

    let inserted = 0, updated = 0;
    for (const ship of filtered) {
        const nation = formatNation(ship.nation);
        const isPremium = ship.is_premium ? 1 : 0;
        const existing = queryOne('SELECT id FROM ships WHERE game_id = ?', [String(ship.ship_id)]);
        if (existing) {
            runSql(
                `UPDATE ships SET name=?, tier=?, type=?, nation=?, is_premium=? WHERE game_id=?`,
                [ship.name, ship.tier, ship.type, nation, isPremium, String(ship.ship_id)]
            );
            updated++;
        } else {
            runSql(
                `INSERT INTO ships (game_id, name, tier, type, nation, is_premium) VALUES (?,?,?,?,?,?)`,
                [String(ship.ship_id), ship.name, ship.tier, ship.type, nation, isPremium]
            );
            inserted++;
        }
    }
    console.log(`[Ships] Done — ${inserted} inserted, ${updated} updated`);
}

// ---- MAIN ----
async function main() {
    console.log('=== WoWS API Data Fetcher ===');
    try {
        const db = await getDb();
        await fetchAndSeedSkills(db);
        await fetchAndSeedShips(db);
        console.log('\n✓ All done! Database updated with real WoWS data.');
    } catch (err) {
        console.error('\n✗ Error:', err.message);
        process.exit(1);
    } finally {
        closeDb();
    }
}

main();
