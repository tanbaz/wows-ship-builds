const bcrypt = require('bcryptjs');
const { getDb, queryOne, runSql, closeDb } = require('./init');

async function seed() {
    await getDb();
    console.log('Seeding database...');

    // Seed ship categories
    const categories = [
        { name: 'Destroyer', slug: 'destroyer', display_order: 1 },
        { name: 'Cruiser', slug: 'cruiser', display_order: 2 },
        { name: 'Battleship', slug: 'battleship', display_order: 3 },
        { name: 'Aircraft Carrier', slug: 'carrier', display_order: 4 },
        { name: 'Submarine', slug: 'submarine', display_order: 5 }
    ];

    for (const cat of categories) {
        const exists = queryOne('SELECT id FROM ship_categories WHERE slug = ?', [cat.slug]);
        if (!exists) {
            runSql('INSERT INTO ship_categories (name, slug, display_order) VALUES (?, ?, ?)',
                [cat.name, cat.slug, cat.display_order]);
        }
    }
    console.log('  Ship categories seeded');

    // Seed users: 3 admins + 7 editors
    const salt = await bcrypt.genSalt(12);

    const users = [
        { username: 'admin1', email: 'admin1@wowsbuilds.com', password: 'Admin@123', role: 'admin', display_name: 'Admin One' },
        { username: 'admin2', email: 'admin2@wowsbuilds.com', password: 'Admin@123', role: 'admin', display_name: 'Admin Two' },
        { username: 'admin3', email: 'admin3@wowsbuilds.com', password: 'Admin@123', role: 'admin', display_name: 'Admin Three' },
        { username: 'editor1', email: 'editor1@wowsbuilds.com', password: 'Editor@123', role: 'editor', display_name: 'Editor One' },
        { username: 'editor2', email: 'editor2@wowsbuilds.com', password: 'Editor@123', role: 'editor', display_name: 'Editor Two' },
        { username: 'editor3', email: 'editor3@wowsbuilds.com', password: 'Editor@123', role: 'editor', display_name: 'Editor Three' },
        { username: 'editor4', email: 'editor4@wowsbuilds.com', password: 'Editor@123', role: 'editor', display_name: 'Editor Four' },
        { username: 'editor5', email: 'editor5@wowsbuilds.com', password: 'Editor@123', role: 'editor', display_name: 'Editor Five' },
        { username: 'editor6', email: 'editor6@wowsbuilds.com', password: 'Editor@123', role: 'editor', display_name: 'Editor Six' },
        { username: 'editor7', email: 'editor7@wowsbuilds.com', password: 'Editor@123', role: 'editor', display_name: 'Editor Seven' }
    ];

    for (const user of users) {
        const exists = queryOne('SELECT id FROM users WHERE username = ?', [user.username]);
        if (!exists) {
            const hash = await bcrypt.hash(user.password, salt);
            runSql('INSERT INTO users (username, email, password_hash, role, display_name) VALUES (?, ?, ?, ?, ?)',
                [user.username, user.email, hash, user.role, user.display_name]);
        }
    }
    console.log('  Users seeded (3 admins, 7 editors)');

    closeDb();
    console.log('Database seeded successfully!');
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
