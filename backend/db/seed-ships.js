const { getDb, queryOne, runSql, closeDb } = require('./init');

async function seedShips() {
    await getDb();
    console.log('Seeding ships, skills, and upgrades...');

    // === SHIPS ===
    const ships = [
        // Tier X Destroyers
        { name: 'Shimakaze', tier: 10, type: 'Destroyer', nation: 'Japan' },
        { name: 'Gearing', tier: 10, type: 'Destroyer', nation: 'USA' },
        { name: 'Khabarovsk', tier: 10, type: 'Destroyer', nation: 'USSR' },
        { name: 'Grozovoi', tier: 10, type: 'Destroyer', nation: 'USSR' },
        { name: 'Daring', tier: 10, type: 'Destroyer', nation: 'UK' },
        { name: 'Kléber', tier: 10, type: 'Destroyer', nation: 'France' },
        { name: 'Halland', tier: 10, type: 'Destroyer', nation: 'Europe' },
        { name: 'Marceau', tier: 10, type: 'Destroyer', nation: 'France', is_premium: 1 },
        { name: 'Småland', tier: 10, type: 'Destroyer', nation: 'Europe', is_premium: 1 },
        { name: 'Ragnar', tier: 10, type: 'Destroyer', nation: 'Europe', is_premium: 1 },
        { name: 'Elbing', tier: 10, type: 'Destroyer', nation: 'Germany' },
        { name: 'Yolo Emilio', tier: 10, type: 'Destroyer', nation: 'Italy' },
        { name: 'Delny', tier: 10, type: 'Destroyer', nation: 'USSR' },
        // Tier IX Destroyers
        { name: 'Yūgumo', tier: 9, type: 'Destroyer', nation: 'Japan' },
        { name: 'Fletcher', tier: 9, type: 'Destroyer', nation: 'USA' },
        { name: 'Tashkent', tier: 9, type: 'Destroyer', nation: 'USSR' },
        { name: 'Jutland', tier: 9, type: 'Destroyer', nation: 'UK' },
        { name: 'Mogador', tier: 9, type: 'Destroyer', nation: 'France' },
        { name: 'Östergötland', tier: 9, type: 'Destroyer', nation: 'Europe' },
        { name: 'Black', tier: 9, type: 'Destroyer', nation: 'USA', is_premium: 1 },
        { name: 'Benham', tier: 9, type: 'Destroyer', nation: 'USA', is_premium: 1 },
        { name: 'Paolo Emilio', tier: 9, type: 'Destroyer', nation: 'Italy', is_premium: 1 },
        // Tier VIII Destroyers
        { name: 'Kagerō', tier: 8, type: 'Destroyer', nation: 'Japan' },
        { name: 'Benson', tier: 8, type: 'Destroyer', nation: 'USA' },
        { name: 'Lightning', tier: 8, type: 'Destroyer', nation: 'UK' },
        { name: 'Le Fantasque', tier: 8, type: 'Destroyer', nation: 'France' },
        { name: 'Öland', tier: 8, type: 'Destroyer', nation: 'Europe' },
        { name: 'Akizuki', tier: 8, type: 'Destroyer', nation: 'Japan' },
        { name: 'Cossack', tier: 8, type: 'Destroyer', nation: 'UK', is_premium: 1 },
        { name: 'Kidd', tier: 8, type: 'Destroyer', nation: 'USA', is_premium: 1 },
        { name: 'Loyang', tier: 8, type: 'Destroyer', nation: 'Pan-Asia', is_premium: 1 },

        // Tier X Cruisers
        { name: 'Zao', tier: 10, type: 'Cruiser', nation: 'Japan' },
        { name: 'Des Moines', tier: 10, type: 'Cruiser', nation: 'USA' },
        { name: 'Worcester', tier: 10, type: 'Cruiser', nation: 'USA' },
        { name: 'Moskva', tier: 10, type: 'Cruiser', nation: 'USSR', is_premium: 1 },
        { name: 'Petropavlovsk', tier: 10, type: 'Cruiser', nation: 'USSR' },
        { name: 'Hindenburg', tier: 10, type: 'Cruiser', nation: 'Germany' },
        { name: 'Minotaur', tier: 10, type: 'Cruiser', nation: 'UK' },
        { name: 'Henri IV', tier: 10, type: 'Cruiser', nation: 'France' },
        { name: 'Venezia', tier: 10, type: 'Cruiser', nation: 'Italy' },
        { name: 'Goliath', tier: 10, type: 'Cruiser', nation: 'UK' },
        { name: 'Nevsky', tier: 10, type: 'Cruiser', nation: 'USSR' },
        { name: 'Salem', tier: 10, type: 'Cruiser', nation: 'USA', is_premium: 1 },
        { name: 'Napoli', tier: 10, type: 'Cruiser', nation: 'Italy', is_premium: 1 },
        { name: 'Conde', tier: 10, type: 'Cruiser', nation: 'France' },
        // Tier IX Cruisers
        { name: 'Ibuki', tier: 9, type: 'Cruiser', nation: 'Japan' },
        { name: 'Buffalo', tier: 9, type: 'Cruiser', nation: 'USA' },
        { name: 'Seattle', tier: 9, type: 'Cruiser', nation: 'USA' },
        { name: 'Dmitri Donskoi', tier: 9, type: 'Cruiser', nation: 'USSR' },
        { name: 'Roon', tier: 9, type: 'Cruiser', nation: 'Germany' },
        { name: 'Neptune', tier: 9, type: 'Cruiser', nation: 'UK' },
        { name: 'Saint-Louis', tier: 9, type: 'Cruiser', nation: 'France' },
        { name: 'Brindisi', tier: 9, type: 'Cruiser', nation: 'Italy' },
        { name: 'Alaska', tier: 9, type: 'Cruiser', nation: 'USA', is_premium: 1 },
        { name: 'Kronshtadt', tier: 9, type: 'Cruiser', nation: 'USSR', is_premium: 1 },
        { name: 'Ägir', tier: 9, type: 'Cruiser', nation: 'Germany', is_premium: 1 },
        // Tier VIII Cruisers
        { name: 'Mogami', tier: 8, type: 'Cruiser', nation: 'Japan' },
        { name: 'Baltimore', tier: 8, type: 'Cruiser', nation: 'USA' },
        { name: 'Cleveland', tier: 8, type: 'Cruiser', nation: 'USA' },
        { name: 'Chapayev', tier: 8, type: 'Cruiser', nation: 'USSR' },
        { name: 'Hipper', tier: 8, type: 'Cruiser', nation: 'Germany' },
        { name: 'Edinburgh', tier: 8, type: 'Cruiser', nation: 'UK' },
        { name: 'Charles Martel', tier: 8, type: 'Cruiser', nation: 'France' },
        { name: 'Amalfi', tier: 8, type: 'Cruiser', nation: 'Italy' },
        { name: 'Atago', tier: 8, type: 'Cruiser', nation: 'Japan', is_premium: 1 },
        { name: 'Kutuzov', tier: 8, type: 'Cruiser', nation: 'USSR', is_premium: 1 },
        { name: 'Mainz', tier: 8, type: 'Cruiser', nation: 'Germany', is_premium: 1 },
        { name: 'Bayard', tier: 8, type: 'Cruiser', nation: 'France', is_premium: 1 },

        // Tier X Battleships
        { name: 'Yamato', tier: 10, type: 'Battleship', nation: 'Japan' },
        { name: 'Montana', tier: 10, type: 'Battleship', nation: 'USA' },
        { name: 'Großer Kurfürst', tier: 10, type: 'Battleship', nation: 'Germany' },
        { name: 'Kremlin', tier: 10, type: 'Battleship', nation: 'USSR' },
        { name: 'Conqueror', tier: 10, type: 'Battleship', nation: 'UK' },
        { name: 'République', tier: 10, type: 'Battleship', nation: 'France' },
        { name: 'Colombo', tier: 10, type: 'Battleship', nation: 'Italy' },
        { name: 'Vermont', tier: 10, type: 'Battleship', nation: 'USA' },
        { name: 'Schlieffen', tier: 10, type: 'Battleship', nation: 'Germany' },
        { name: 'Preussen', tier: 10, type: 'Battleship', nation: 'Germany' },
        { name: 'Ohio', tier: 10, type: 'Battleship', nation: 'USA', is_premium: 1 },
        { name: 'Thunderer', tier: 10, type: 'Battleship', nation: 'UK', is_premium: 1 },
        { name: 'Bourgogne', tier: 10, type: 'Battleship', nation: 'France', is_premium: 1 },
        { name: 'Shikishima', tier: 10, type: 'Battleship', nation: 'Japan', is_premium: 1 },
        // Tier IX Battleships
        { name: 'Izumo', tier: 9, type: 'Battleship', nation: 'Japan' },
        { name: 'Iowa', tier: 9, type: 'Battleship', nation: 'USA' },
        { name: 'Friedrich der Große', tier: 9, type: 'Battleship', nation: 'Germany' },
        { name: 'Sovetsky Soyuz', tier: 9, type: 'Battleship', nation: 'USSR' },
        { name: 'Lion', tier: 9, type: 'Battleship', nation: 'UK' },
        { name: 'Alsace', tier: 9, type: 'Battleship', nation: 'France' },
        { name: 'Lepanto', tier: 9, type: 'Battleship', nation: 'Italy' },
        { name: 'Minnesota', tier: 9, type: 'Battleship', nation: 'USA' },
        { name: 'Georgia', tier: 9, type: 'Battleship', nation: 'USA', is_premium: 1 },
        { name: 'Jean Bart', tier: 9, type: 'Battleship', nation: 'France', is_premium: 1 },
        { name: 'Musashi', tier: 9, type: 'Battleship', nation: 'Japan', is_premium: 1 },
        { name: 'Missouri', tier: 9, type: 'Battleship', nation: 'USA', is_premium: 1 },
        // Tier VIII Battleships
        { name: 'Amagi', tier: 8, type: 'Battleship', nation: 'Japan' },
        { name: 'North Carolina', tier: 8, type: 'Battleship', nation: 'USA' },
        { name: 'Bismarck', tier: 8, type: 'Battleship', nation: 'Germany' },
        { name: 'Vladivostok', tier: 8, type: 'Battleship', nation: 'USSR' },
        { name: 'Monarch', tier: 8, type: 'Battleship', nation: 'UK' },
        { name: 'Richelieu', tier: 8, type: 'Battleship', nation: 'France' },
        { name: 'Vittorio Veneto', tier: 8, type: 'Battleship', nation: 'Italy' },
        { name: 'Tirpitz', tier: 8, type: 'Battleship', nation: 'Germany', is_premium: 1 },
        { name: 'Massachusetts', tier: 8, type: 'Battleship', nation: 'USA', is_premium: 1 },
        { name: 'Alabama', tier: 8, type: 'Battleship', nation: 'USA', is_premium: 1 },

        // Tier X Aircraft Carriers
        { name: 'Hakuryū', tier: 10, type: 'AirCarrier', nation: 'Japan' },
        { name: 'Midway', tier: 10, type: 'AirCarrier', nation: 'USA' },
        { name: 'Audacious', tier: 10, type: 'AirCarrier', nation: 'UK' },
        { name: 'Manfred von Richthofen', tier: 10, type: 'AirCarrier', nation: 'Germany' },
        { name: 'Nakhimov', tier: 10, type: 'AirCarrier', nation: 'USSR' },
        { name: 'United States', tier: 10, type: 'AirCarrier', nation: 'USA' },
        { name: 'Franklin D. Roosevelt', tier: 10, type: 'AirCarrier', nation: 'USA', is_premium: 1 },
        // Tier VIII CVs
        { name: 'Shōkaku', tier: 8, type: 'AirCarrier', nation: 'Japan' },
        { name: 'Lexington', tier: 8, type: 'AirCarrier', nation: 'USA' },
        { name: 'Implacable', tier: 8, type: 'AirCarrier', nation: 'UK' },
        { name: 'August von Parseval', tier: 8, type: 'AirCarrier', nation: 'Germany' },
        { name: 'Enterprise', tier: 8, type: 'AirCarrier', nation: 'USA', is_premium: 1 },
        { name: 'Kaga', tier: 8, type: 'AirCarrier', nation: 'Japan', is_premium: 1 },

        // Tier X Submarines
        { name: 'U-4501', tier: 10, type: 'Submarine', nation: 'Germany' },
        { name: 'Gato', tier: 10, type: 'Submarine', nation: 'USA' },
        { name: 'I-56', tier: 8, type: 'Submarine', nation: 'Japan' },
        { name: 'U-2501', tier: 8, type: 'Submarine', nation: 'Germany' },
        { name: 'S-189', tier: 8, type: 'Submarine', nation: 'USSR' },

        // Lower tiers - popular ships
        { name: 'Fuso', tier: 6, type: 'Battleship', nation: 'Japan' },
        { name: 'New Mexico', tier: 6, type: 'Battleship', nation: 'USA' },
        { name: 'Bayern', tier: 6, type: 'Battleship', nation: 'Germany' },
        { name: 'Warspite', tier: 6, type: 'Battleship', nation: 'UK', is_premium: 1 },
        { name: 'Gneisenau', tier: 7, type: 'Battleship', nation: 'Germany' },
        { name: 'Sinop', tier: 7, type: 'Battleship', nation: 'USSR' },
        { name: 'King George V', tier: 7, type: 'Battleship', nation: 'UK' },
        { name: 'Nagato', tier: 7, type: 'Battleship', nation: 'Japan' },
        { name: 'Colorado', tier: 7, type: 'Battleship', nation: 'USA' },
        { name: 'Scharnhorst', tier: 7, type: 'Battleship', nation: 'Germany', is_premium: 1 },
        { name: 'Nelson', tier: 7, type: 'Battleship', nation: 'UK', is_premium: 1 },
        { name: 'Flandre', tier: 8, type: 'Battleship', nation: 'France', is_premium: 1 },
        { name: 'Aoba', tier: 6, type: 'Cruiser', nation: 'Japan' },
        { name: 'Dallas', tier: 6, type: 'Cruiser', nation: 'USA' },
        { name: 'Leander', tier: 6, type: 'Cruiser', nation: 'UK' },
        { name: 'Nürnberg', tier: 6, type: 'Cruiser', nation: 'Germany' },
        { name: 'Fiji', tier: 7, type: 'Cruiser', nation: 'UK' },
        { name: 'Helena', tier: 7, type: 'Cruiser', nation: 'USA' },
        { name: 'Myōkō', tier: 7, type: 'Cruiser', nation: 'Japan' },
        { name: 'Belfast', tier: 7, type: 'Cruiser', nation: 'UK', is_premium: 1 },
        { name: 'Atlanta', tier: 7, type: 'Cruiser', nation: 'USA', is_premium: 1 },
        { name: 'Fubuki', tier: 6, type: 'Destroyer', nation: 'Japan' },
        { name: 'Farragut', tier: 6, type: 'Destroyer', nation: 'USA' },
        { name: 'Mahan', tier: 7, type: 'Destroyer', nation: 'USA' },
        { name: 'Shiratsuyu', tier: 7, type: 'Destroyer', nation: 'Japan' },
        { name: 'Jervis', tier: 7, type: 'Destroyer', nation: 'UK' },
        { name: 'Haida', tier: 7, type: 'Destroyer', nation: 'Commonwealth', is_premium: 1 },
    ];

    const insertShip = 'INSERT OR IGNORE INTO ships (name, tier, type, nation, is_premium) VALUES (?, ?, ?, ?, ?)';
    for (const s of ships) {
        runSql(insertShip, [s.name, s.tier, s.type, s.nation, s.is_premium || 0]);
    }
    console.log(`  ${ships.length} ships seeded`);

    // === CAPTAIN SKILLS ===
    const skills = [
        // 1-point skills
        { name: 'Gun Feeder', cost: 1, description: 'Decreases the reload time when switching shell types.', ship_types: 'Battleship,Cruiser' },
        { name: 'Grease the Gears', cost: 1, description: 'Increases main battery turret traverse speed.', ship_types: 'all' },
        { name: 'Incoming Fire Alert', cost: 1, description: 'Warns of incoming long-range shells.', ship_types: 'all' },
        { name: 'Preventive Maintenance', cost: 1, description: 'Reduces risk of incapacitation of modules.', ship_types: 'all' },
        { name: 'Last Stand', cost: 1, description: 'Engine and steering still work at reduced capacity when incapacitated.', ship_types: 'Destroyer' },
        { name: 'Liquidator', cost: 1, description: 'Increases flooding chance.', ship_types: 'Destroyer,Submarine' },
        { name: 'Direction Center for Fighters', cost: 1, description: 'Catapult fighter consumable launches extra fighter.', ship_types: 'Battleship,Cruiser' },
        { name: 'Air Supremacy', cost: 1, description: 'Reduces aircraft restoration time.', ship_types: 'AirCarrier' },
        { name: 'Improved Engine Boost', cost: 1, description: 'Extends Engine Boost duration.', ship_types: 'Destroyer,AirCarrier' },

        // 2-point skills
        { name: 'Priority Target', cost: 2, description: 'Shows the number of opponents aiming at your ship.', ship_types: 'all' },
        { name: 'Adrenaline Rush', cost: 2, description: 'Reduces reload time as HP decreases.', ship_types: 'all' },
        { name: 'Expert Marksman', cost: 2, description: 'Increases traverse speed of main battery turrets.', ship_types: 'Battleship,Cruiser' },
        { name: 'Consumables Enhancements', cost: 2, description: 'Increases action time of consumables.', ship_types: 'all' },
        { name: 'Swift Fish', cost: 2, description: 'Increases torpedo speed.', ship_types: 'Destroyer,Submarine' },
        { name: 'Improved Engines', cost: 2, description: 'Increases ship speed.', ship_types: 'AirCarrier' },
        { name: 'Torpedo Bomber Armament Expert', cost: 2, description: 'Reduces torpedo bomber restoration time.', ship_types: 'AirCarrier' },

        // 3-point skills
        { name: 'Superintendent', cost: 3, description: 'Adds extra charge to all consumables.', ship_types: 'all' },
        { name: 'Basics of Survivability', cost: 3, description: 'Reduces fire and flooding duration.', ship_types: 'all' },
        { name: 'Demolition Expert', cost: 3, description: 'Increases fire chance of HE shells.', ship_types: 'all' },
        { name: 'Survivability Expert', cost: 3, description: 'Increases HP based on ship tier.', ship_types: 'all' },
        { name: 'Torpedo Armament Expertise', cost: 3, description: 'Reduces torpedo tube reload time.', ship_types: 'Destroyer,Cruiser' },
        { name: 'Basic Firing Training', cost: 3, description: 'Increases secondary and AA DPS.', ship_types: 'Battleship' },
        { name: 'Top Grade Gunner', cost: 3, description: 'Temporarily increases reload speed after kills.', ship_types: 'Destroyer,Cruiser' },
        { name: 'Concealment Expert', cost: 3, description: 'Reduces detectability range.', ship_types: 'all' },
        { name: 'Enhanced Armor Piercing Shells', cost: 3, description: 'Increases AP shell damage.', ship_types: 'AirCarrier' },

        // 4-point skills
        { name: 'Fire Prevention', cost: 4, description: 'Reduces maximum number of fires and fire chance.', ship_types: 'Battleship,Cruiser' },
        { name: 'Manual Fire Control for Secondary Armament', cost: 4, description: 'Significantly increases secondary battery accuracy.', ship_types: 'Battleship' },
        { name: 'Radio Location', cost: 4, description: 'Shows direction to nearest enemy ship.', ship_types: 'all' },
        { name: 'Inertia Fuse for HE Shells', cost: 4, description: 'Increases HE shell armor penetration.', ship_types: 'all' },
        { name: 'Close Quarters Combat', cost: 4, description: 'Improves secondary battery performance.', ship_types: 'Battleship,Cruiser' },
        { name: 'Fearless Brawler', cost: 4, description: 'Improves main battery reload when enemies are nearby.', ship_types: 'Battleship' },
        { name: 'Main Battery and AA Specialist', cost: 4, description: 'Increases continuous AA damage and main battery range.', ship_types: 'Cruiser,Destroyer' },
        { name: 'Swift in Silence', cost: 4, description: 'Increases speed when undetected.', ship_types: 'Destroyer,Submarine' },
        { name: 'Hidden Menace', cost: 4, description: 'Reduces detectability when submerged.', ship_types: 'Submarine' },
        { name: 'Sight Stabilization', cost: 4, description: 'Reduces aiming time for aircraft.', ship_types: 'AirCarrier' },
    ];

    const insertSkill = 'INSERT OR IGNORE INTO captain_skills (game_id, name, customization) VALUES (?, ?, ?)';
    for (const sk of skills) {
        const gameId = sk.name.toLowerCase().replace(/\s+/g, '_');
        const customization = JSON.stringify({ cost: sk.cost, description: sk.description, ship_types: sk.ship_types });
        runSql(insertSkill, [gameId, sk.name, customization]);
    }
    console.log(`  ${skills.length} captain skills seeded`);

    // === UPGRADES ===
    const upgrades = [
        // Slot 1
        { name: 'Main Armaments Modification 1', slot: 1, description: 'Reduces risk of main battery/torpedo incapacitation.' },
        { name: 'Auxiliary Armaments Modification 1', slot: 1, description: 'Reduces risk of AA/secondary incapacitation.' },
        { name: 'Magazine Modification 1', slot: 1, description: 'Reduces risk of magazine detonation.' },
        { name: 'Damage Control Party Modification 1', slot: 1, description: 'Increases DCP action time.' },
        // Slot 2
        { name: 'Damage Control System Modification 1', slot: 2, description: 'Reduces fire/flooding duration.' },
        { name: 'Engine Room Protection', slot: 2, description: 'Reduces risk of engine/steering incapacitation.' },
        { name: 'Defensive AA Fire Modification 1', slot: 2, description: 'Increases DFAA action time.' },
        { name: 'Hydroacoustic Search Modification 1', slot: 2, description: 'Increases Hydro action time.' },
        { name: 'Surveillance Radar Modification 1', slot: 2, description: 'Increases Radar action time.' },
        // Slot 3
        { name: 'Aiming Systems Modification 1', slot: 3, description: 'Improves main battery dispersion, torpedo speed, secondary accuracy.' },
        { name: 'Secondary Battery Modification 1', slot: 3, description: 'Increases secondary battery range and accuracy.' },
        { name: 'AA Guns Modification 1', slot: 3, description: 'Increases AA continuous damage.' },
        { name: 'Torpedo Tubes Modification 1', slot: 3, description: 'Increases torpedo tube traverse and reduces reload.' },
        // Slot 4
        { name: 'Damage Control System Modification 2', slot: 4, description: 'Further reduces fire/flooding duration.' },
        { name: 'Propulsion Modification 1', slot: 4, description: 'Improves acceleration.' },
        { name: 'Steering Gears Modification 1', slot: 4, description: 'Reduces rudder shift time.' },
        // Slot 5
        { name: 'Concealment System Modification 1', slot: 5, description: 'Reduces detectability range.' },
        { name: 'Ship Consumables Modification 1', slot: 5, description: 'Increases consumable action time.' },
        { name: 'Steering Gears Modification 2', slot: 5, description: 'Further reduces rudder shift time.' },
        // Slot 6
        { name: 'Main Battery Modification 3', slot: 6, description: 'Reduces main battery reload time.' },
        { name: 'Torpedo Tubes Modification 2', slot: 6, description: 'Reduces torpedo reload time.' },
        { name: 'Gun Fire Control System Modification 2', slot: 6, description: 'Increases main battery firing range.' },
        { name: 'Auxiliary Armaments Modification 2', slot: 6, description: 'Increases secondary range and AA damage.' },
    ];

    const insertUpgrade = 'INSERT OR IGNORE INTO upgrades (name, slot, description) VALUES (?, ?, ?)';
    for (const u of upgrades) {
        runSql(insertUpgrade, [u.name, u.slot, u.description]);
    }
    console.log(`  ${upgrades.length} upgrades seeded`);

    closeDb();
    console.log('Ship data seeded successfully!');
}

seedShips().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
