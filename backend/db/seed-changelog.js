const { getDb, queryOne, runSql, closeDb } = require('./init');

async function seedChangelog() {
    await getDb();
    console.log('Seeding changelog...');

    const entries = [
        { date: '20.3.2026', entry: 'Initial import of 228 captain builds across all ship classes', action: 'import' },
        { date: '20.3.2026', entry: 'Site migrated to fully dynamic API-driven frontend', action: 'update' },
        { date: '20.3.2026', entry: 'Added structured build descriptions, play style notes, and alternative suggestions', action: 'update' },
        { date: '20.3.2026', entry: 'Added skill grid visualization with pick order indicators', action: 'update' },
        { date: '20.3.2026', entry: 'Added Premium/Special ship category sections', action: 'update' },
    ];

    for (const e of entries) {
        const existing = queryOne(
            'SELECT id FROM changelog WHERE date = ? AND entry = ?',
            [e.date, e.entry]
        );
        if (!existing) {
            runSql(
                'INSERT INTO changelog (date, entry, user_id, action) VALUES (?, ?, 1, ?)',
                [e.date, e.entry, e.action]
            );
            console.log(`  Seeded: ${e.entry.substring(0, 60)}...`);
        } else {
            console.log(`  Exists: ${e.entry.substring(0, 60)}...`);
        }
    }

    closeDb();
    console.log('Changelog seeded!');
}

seedChangelog().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
