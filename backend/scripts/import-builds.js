/**
 * Import builds from analyzed data into the database.
 * Usage: node import-builds.js [--category Submarine] [--dry-run]
 */
const path = require('path');
const fs = require('fs');

// Must run from the backend directory context
process.chdir(path.join(__dirname, '..'));
require('dotenv').config();

const { getDb, queryAll, queryOne, runSql, closeDb } = require(path.join(__dirname, '..', 'db', 'init'));

// Skill grids per class (fetched from WoWS API — hardcoded here for offline use)
const SKILL_GRIDS = {
    Submarine: [
        // Row 1 (tier 1)
        {tier:1,col:1,name:'Enhanced Sonar'},{tier:1,col:2,name:'Liquidator'},{tier:1,col:3,name:'Helmsman'},{tier:1,col:4,name:'Priority Target'},{tier:1,col:5,name:'Incoming Fire Alert'},
        // Row 2 (tier 2)
        {tier:2,col:1,name:'Improved Battery Capacity'},{tier:2,col:2,name:'Torpedo Crew Training'},{tier:2,col:3,name:'Consumable Enhancements'},{tier:2,col:4,name:'Preventive Maintenance'},{tier:2,col:5,name:'Last Stand'},
        // Row 3 (tier 3)
        {tier:3,col:1,name:'Enhanced Impulse Generator'},{tier:3,col:2,name:'Sonarman'},{tier:3,col:3,name:'Consumable Specialist'},{tier:3,col:4,name:'Watchful'},{tier:3,col:5,name:'Superintendent'},
        // Row 4 (tier 4)
        {tier:4,col:1,name:'Adrenaline Rush'},{tier:4,col:2,name:'Torpedo Aiming Master'},{tier:4,col:3,name:'Sonarman Expert'},{tier:4,col:4,name:'Improved Battery Efficiency'},{tier:4,col:5,name:'Enlarged Propeller Shaft'},
    ],
    Destroyer: [
        {tier:1,col:1,name:'Grease the Gears'},{tier:1,col:2,name:'Liquidator'},{tier:1,col:3,name:'Consumable Specialist'},{tier:1,col:4,name:'Gun Feeder'},{tier:1,col:5,name:'Incoming Fire Alert'},{tier:1,col:6,name:'Preventive Maintenance'},
        {tier:2,col:1,name:'Demolition Expert'},{tier:2,col:2,name:'Swift Fish'},{tier:2,col:3,name:'Consumable Enhancements'},{tier:2,col:4,name:'Extra-Heavy Ammunition'},{tier:2,col:5,name:'Priority Target'},{tier:2,col:6,name:'Last Stand'},
        {tier:3,col:1,name:'Main Battery and AA Specialist'},{tier:3,col:2,name:'Fill the Tubes'},{tier:3,col:3,name:'Adrenaline Rush'},{tier:3,col:4,name:'Inertia Fuse for HE Shells'},{tier:3,col:5,name:'Superintendent'},{tier:3,col:6,name:'Survivability Expert'},
        {tier:4,col:1,name:'Main Battery and AA Expert'},{tier:4,col:2,name:'Swift in Silence'},{tier:4,col:3,name:'Radio Location'},{tier:4,col:4,name:'Fearless Brawler'},{tier:4,col:5,name:'Concealment Expert'},{tier:4,col:6,name:'Dazzle'},
    ],
    Cruiser: [
        {tier:1,col:1,name:'Grease the Gears'},{tier:1,col:2,name:'Swift Fish'},{tier:1,col:3,name:'Consumable Specialist'},{tier:1,col:4,name:'Gun Feeder'},{tier:1,col:5,name:'Incoming Fire Alert'},{tier:1,col:6,name:'Last Stand'},
        {tier:2,col:1,name:'Demolition Expert'},{tier:2,col:2,name:'Fill the Tubes'},{tier:2,col:3,name:'Consumable Enhancements'},{tier:2,col:4,name:'Eye in the Sky'},{tier:2,col:5,name:'Priority Target'},{tier:2,col:6,name:'Focus Fire Training'},
        {tier:3,col:1,name:'Heavy HE and SAP Shells'},{tier:3,col:2,name:'Pack a Punch'},{tier:3,col:3,name:'Adrenaline Rush'},{tier:3,col:4,name:'Heavy AP Shells'},{tier:3,col:5,name:'Superintendent'},{tier:3,col:6,name:'Survivability Expert'},
        {tier:4,col:1,name:'Top Grade Gunner'},{tier:4,col:2,name:'Outnumbered'},{tier:4,col:3,name:'Radio Location'},{tier:4,col:4,name:'Inertia Fuse for HE Shells'},{tier:4,col:5,name:'Concealment Expert'},{tier:4,col:6,name:'AA Defense and ASW Expert'},
    ],
    Battleship: [
        {tier:1,col:1,name:'Gun Feeder'},{tier:1,col:2,name:'Demolition Expert'},{tier:1,col:3,name:'Consumable Specialist'},{tier:1,col:4,name:'Emergency Repair Specialist'},{tier:1,col:5,name:'Incoming Fire Alert'},{tier:1,col:6,name:'Preventive Maintenance'},
        {tier:2,col:1,name:'Grease the Gears'},{tier:2,col:2,name:'Inertia Fuse for HE Shells'},{tier:2,col:3,name:'Brisk'},{tier:2,col:4,name:'Vigilance'},{tier:2,col:5,name:'Priority Target'},{tier:2,col:6,name:'AA Defense and ASW Expert'},
        {tier:3,col:1,name:'Super-Heavy AP Shells'},{tier:3,col:2,name:'Long-Range Secondary Battery Shells'},{tier:3,col:3,name:'Adrenaline Rush'},{tier:3,col:4,name:'Basics of Survivability'},{tier:3,col:5,name:'Improved Repair Party Readiness'},{tier:3,col:6,name:'Focus Fire Training'},
        {tier:4,col:1,name:'Furious'},{tier:4,col:2,name:'Manual Secondary Battery Aiming'},{tier:4,col:3,name:'Close Quarters Combat'},{tier:4,col:4,name:'Emergency Repair Expert'},{tier:4,col:5,name:'Concealment Expert'},{tier:4,col:6,name:'Fire Prevention Expert'},
    ],
    AirCarrier: [
        {tier:1,col:1,name:'Last Gasp'},{tier:1,col:2,name:'Improved Engine Boost'},{tier:1,col:3,name:'Engine Techie'},{tier:1,col:4,name:'Air Supremacy'},{tier:1,col:5,name:'Direction Center for Fighters'},{tier:1,col:6,name:'Search and Destroy'},
        {tier:2,col:1,name:'Torpedo Bomber'},{tier:2,col:2,name:'Swift Flying Fish'},{tier:2,col:3,name:'Improved Engines'},{tier:2,col:4,name:'Combat Maneuver Specialist'},{tier:2,col:5,name:'Secondary Armament Expert'},{tier:2,col:6,name:'Patrol Group Leader'},
        {tier:3,col:1,name:'Sight Stabilization'},{tier:3,col:2,name:'Enhanced Armor-Piercing Ammunition'},{tier:3,col:3,name:'Pyrotechnician'},{tier:3,col:4,name:'Aircraft Armor'},{tier:3,col:5,name:'Survivability Expert'},{tier:3,col:6,name:'Interceptor'},
        {tier:4,col:1,name:'Bomber Flight Control'},{tier:4,col:2,name:'Proximity Fuze'},{tier:4,col:3,name:'Defensive Fire Expert'},{tier:4,col:4,name:'Enhanced Aircraft Armor'},{tier:4,col:5,name:'Hidden Menace'},{tier:4,col:6,name:'Enhanced Reactions'},
    ],
};

// Ship type to category slug mapping
const TYPE_TO_CATEGORY = {
    'Destroyer': 'destroyer',
    'Cruiser': 'cruiser',
    'Battleship': 'battleship',
    'AirCarrier': 'carrier',
    'Submarine': 'submarine',
};

function resolveSkills(shipType, skillPositions) {
    const grid = SKILL_GRIDS[shipType];
    if (!grid) return [];

    // Sort by pick order
    const sorted = [...skillPositions].sort((a, b) => a.order - b.order);

    return sorted.map(pos => {
        const skill = grid.find(s => s.tier === pos.row && s.col === pos.col);
        if (!skill) {
            console.warn(`  WARNING: No skill at row=${pos.row} col=${pos.col} for ${shipType}`);
            return null;
        }
        return { name: skill.name, tier: skill.tier };
    }).filter(Boolean);
}

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const categoryFilter = args.find(a => !a.startsWith('--'));

    await getDb();

    // Load analyzed builds data
    const dataPath = path.join(__dirname, 'builds-data.json');
    if (!fs.existsSync(dataPath)) {
        console.error('No builds data file found at:', dataPath);
        process.exit(1);
    }

    const builds = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`Loaded ${builds.length} builds to import`);

    let imported = 0, skipped = 0, errors = 0;

    for (const b of builds) {
        if (categoryFilter && b.ship_type !== categoryFilter) continue;

        const title = b.h3_title || b.title;

        // Skip if no skill data yet
        if (!b.skill_positions || !b.skill_positions.length) {
            console.log(`SKIP (no skills): ${title}`);
            skipped++;
            continue;
        }

        // Check for duplicates
        const existing = queryOne('SELECT id FROM builds WHERE ship_name = ? AND title = ?', [b.ship_name, title]);
        if (existing) {
            console.log(`SKIP (exists): ${b.ship_name} — ${title}`);
            skipped++;
            continue;
        }

        // Resolve skills from grid positions
        const captain_skills = resolveSkills(b.ship_type, b.skill_positions);
        if (!captain_skills.length) {
            console.log(`SKIP (no resolved skills): ${title}`);
            skipped++;
            continue;
        }

        // Get category
        const categorySlug = TYPE_TO_CATEGORY[b.ship_type];
        const category = queryOne('SELECT id FROM ship_categories WHERE slug = ?', [categorySlug]);
        if (!category) {
            console.error(`ERROR: No category for ${b.ship_type}`);
            errors++;
            continue;
        }

        // Structured notes (enriched by enrich-builds.js)
        const description = b.description || '';
        const play_style_notes = b.play_style_notes || '';
        const alternative_notes = b.alternative_notes || '';

        const totalPts = captain_skills.reduce((s, sk) => s + sk.tier, 0);

        if (dryRun) {
            console.log(`DRY RUN: ${b.ship_name} (T${b.ship_tier} ${b.ship_type}) — "${title}" — ${captain_skills.length} skills (${totalPts}pts) — ${(b.upgrade_names||[]).length} upgrades — ${(b.tags||[]).length} tags`);
            imported++;
            continue;
        }

        try {
            // Look up ship in DB for the ship_id
            const ship = queryOne('SELECT id FROM ships WHERE name = ?', [b.ship_name]);
            const shipId = ship ? String(ship.id) : b.ship_name;

            const result = runSql(`
                INSERT INTO builds (ship_id, ship_name, ship_tier, ship_nation, ship_type, category_id,
                    title, description, play_style_notes, alternative_notes, is_premium,
                    captain_skills, modules, upgrades, consumables, signals,
                    author_id, status, published_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', datetime('now'))
            `, [
                shipId, b.ship_name, b.ship_tier, b.ship_nation, b.ship_type, category.id,
                title, description, play_style_notes, alternative_notes,
                b.is_premium ? 1 : 0,
                JSON.stringify(captain_skills),
                JSON.stringify({}),
                JSON.stringify(b.upgrade_names || []),
                JSON.stringify([]),
                JSON.stringify([]),
                1  // admin1 user ID
            ]);

            // Insert tags
            const buildId = result.lastInsertRowid;
            for (const tag of (b.tags || [])) {
                runSql('INSERT INTO build_tags (build_id, tag) VALUES (?, ?)', [buildId, tag]);
            }

            console.log(`IMPORTED: ${b.ship_name} — "${b.title}" (${totalPts}pts, ${captain_skills.length} skills, ${(b.tags||[]).length} tags)`);
            imported++;
        } catch (err) {
            console.error(`ERROR importing ${b.ship_name}: ${err.message}`);
            errors++;
        }
    }

    console.log(`\nDone: ${imported} imported, ${skipped} skipped, ${errors} errors`);
    closeDb();
}

main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
