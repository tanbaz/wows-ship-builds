/**
 * Extracts build metadata from the static index.html
 * Outputs a JSON file with all builds, ready for skill data to be added.
 */
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', '..', 'index.html');
const outputPath = path.join(__dirname, 'builds-data.json');
const html = fs.readFileSync(htmlPath, 'utf-8');

// Category mapping from h2 IDs
const CATEGORY_MAP = {
    'destroyers': { ship_type: 'Destroyer', is_premium: false },
    'cruisers': { ship_type: 'Cruiser', is_premium: false },
    'battleships': { ship_type: 'Battleship', is_premium: false },
    'aircraft-carriers': { ship_type: 'AirCarrier', is_premium: false },
    'submarines': { ship_type: 'Submarine', is_premium: false },
    'destroyers-2': { ship_type: 'Destroyer', is_premium: true },
    'cruisers-2': { ship_type: 'Cruiser', is_premium: true },
    'battleships-2': { ship_type: 'Battleship', is_premium: true },
    'aircraft-carriers-2': { ship_type: 'AirCarrier', is_premium: true },
    'submarines-2': { ship_type: 'Submarine', is_premium: true },
};

// Extract all h2 sections with their IDs
const h2Regex = /<h2\s+id="([^"]+)"[^>]*>(.*?)<\/h2>/gi;
const h3Regex = /<h3\s+id="([^"]+)"[^>]*>(.*?)<\/h3>/gi;
const imgRegex = /<img[^>]+src="assets\/images\/(image\d+\.png)"[^>]*>/gi;
const liRegex = /<li[^>]*>(.*?)<\/li>/gis;

// Split HTML by h2 sections
const h2Positions = [];
let match;
while ((match = h2Regex.exec(html)) !== null) {
    h2Positions.push({
        id: match[1],
        title: match[2].replace(/<[^>]+>/g, '').trim(),
        index: match.index,
        category: CATEGORY_MAP[match[1]] || null
    });
}

const builds = [];

for (let i = 0; i < h2Positions.length; i++) {
    const section = h2Positions[i];
    if (!section.category) continue;

    const sectionStart = section.index;
    const sectionEnd = (i + 1 < h2Positions.length) ? h2Positions[i + 1].index : html.length;
    const sectionHtml = html.substring(sectionStart, sectionEnd);

    // Find all h3 entries in this section
    const h3s = [];
    const h3Re = /<h3\s+id="([^"]+)"[^>]*>(.*?)<\/h3>/gi;
    while ((match = h3Re.exec(sectionHtml)) !== null) {
        h3s.push({
            id: match[1],
            title: match[2].replace(/<[^>]+>/g, '').trim(),
            index: match.index
        });
    }

    for (let j = 0; j < h3s.length; j++) {
        const h3 = h3s[j];
        if (h3.id === 'change-log') continue;

        const entryStart = h3.index;
        const entryEnd = (j + 1 < h3s.length) ? h3s[j + 1].index : sectionHtml.length;
        const entryHtml = sectionHtml.substring(entryStart, entryEnd);

        // Extract image
        const imgMatch = /<img[^>]+src="assets\/images\/(image\d+\.png)"[^>]*>/i.exec(entryHtml);
        const imageFile = imgMatch ? imgMatch[1] : null;

        // Extract notes (li items)
        const notes = [];
        const liRe = /<li[^>]*>(.*?)<\/li>/gis;
        let liMatch;
        while ((liMatch = liRe.exec(entryHtml)) !== null) {
            const text = liMatch[1].replace(/<[^>]+>/g, '').trim();
            if (text) notes.push(text);
        }

        // Extract sub-headings (h4 for build variants like "Standard build")
        const h4Match = /<h4[^>]*>(.*?)<\/h4>/i.exec(entryHtml);
        const buildVariant = h4Match ? h4Match[1].replace(/<[^>]+>/g, '').trim() : '';

        builds.push({
            h3_id: h3.id,
            h3_title: h3.title,
            build_variant: buildVariant,
            category_id: section.id,
            category_title: section.title,
            ship_type: section.category.ship_type,
            is_premium: section.category.is_premium,
            image_file: imageFile,
            notes: notes,
            // To be filled in during image analysis:
            ship_name: '',
            ship_tier: 0,
            ship_nation: '',
            skill_positions: [],  // [{row, col, order}]
            upgrade_names: []     // ["Main Armaments Modification 1", ...]
        });
    }
}

// Write output
fs.writeFileSync(outputPath, JSON.stringify(builds, null, 2), 'utf-8');
console.log(`Extracted ${builds.length} builds to ${outputPath}`);

// Stats
const stats = {};
for (const b of builds) {
    const key = `${b.category_title} (${b.is_premium ? 'Premium' : 'Tech Tree'})`;
    stats[key] = (stats[key] || 0) + 1;
}
console.log('\nBreakdown:');
for (const [k, v] of Object.entries(stats)) {
    console.log(`  ${k}: ${v}`);
}
