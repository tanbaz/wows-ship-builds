const { getDb, queryOne, runSql, closeDb } = require('./init');

async function seedContent() {
    await getDb();
    console.log('Seeding page content...');

    const sections = [
        {
            page_slug: 'index',
            section_key: 'introduction',
            title: 'Captain Builds',
            display_order: 1,
            body: `Please read the notes below the builds to avoid confusion. If you are looking for a specific ship, ctrl+F it. If you can't find it, look harder or contact one of the authors.

The numbers on the skills indicate the recommended pick order. We strongly recommend that you strictly stick to the pick order of at least the first 5 skills.

If you are levelling a cruiser captain from the bottom of the branch upwards and the build includes both AR and SI, you should pick AR as your 3rd skill instead of 5th as marked in the priority order. Exceptions being any cruiser branch that gets access to Repair at the lower tiers.

Skill names, if changed, are sometimes still referred to by their old(er) names because we are lazy and many players refer to skills by their old names/abbreviations.

These builds are intended for random battles. Ranked and competitive builds may differ depending on the map pool and meta.`
        },
        {
            page_slug: 'index',
            section_key: 'credits',
            title: 'Credits & Contributors',
            display_order: 2,
            body: `Document updated and maintained by the Gameplay Helpers team.

Contributors: Yurra (creator), Yuzorah, Seraphice, REEEdamel, dmc531, Takru, Bazinga_Flux, Quaggers, SriverFX, USS_Juneau, Gitaristing, Trackpad, xSolitude, LeAzur, p0int, Angelstone, Your_SAT_Score, mjester, mcboernester and Iustusian`
        },
        {
            page_slug: 'index',
            section_key: 'links',
            title: 'Links',
            display_order: 3,
            body: `The screenshots used for the builds are from the WoWs ShipBuilder app: https://github.com/WoWs-Builder-Team/WoWs-ShipBuilder#wows-shipbuilder

You can come talk to the team responsible for creation and updating this document on the Global WoWS discord server, in the #general-game-help channel here: https://discord.gg/wows`
        }
    ];

    for (const s of sections) {
        const existing = queryOne(
            'SELECT id FROM page_content WHERE page_slug = ? AND section_key = ?',
            [s.page_slug, s.section_key]
        );
        if (!existing) {
            runSql(
                'INSERT INTO page_content (page_slug, section_key, title, body, display_order) VALUES (?, ?, ?, ?, ?)',
                [s.page_slug, s.section_key, s.title, s.body, s.display_order]
            );
            console.log(`  Seeded: ${s.page_slug}/${s.section_key}`);
        } else {
            console.log(`  Exists: ${s.page_slug}/${s.section_key}`);
        }
    }

    closeDb();
    console.log('Page content seeded!');
}

seedContent().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
