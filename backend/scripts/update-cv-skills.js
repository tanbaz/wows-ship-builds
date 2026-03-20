/**
 * Update CV skill_positions in builds-data.json
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'builds-data.json');
const builds = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// CV builds keyed by image_file, values are [row, col, order] arrays
const updates = {
  // IJN CVs (Sekiryu)
  'image172.png': [[1,4,1],[2,3,2],[3,5,3],[3,4,4],[4,3,5],[4,1,6],[2,1,7],[2,4,8]],
  // Shinano
  'image63.png':  [[1,4,1],[2,3,2],[3,5,3],[3,4,4],[4,2,5],[4,1,6],[3,2,7],[1,1,8]],
  // USN CVs (Midway)
  'image171.png': [[1,4,1],[2,3,2],[3,4,3],[3,5,4],[4,1,5],[4,2,6],[1,2,7],[3,1,8]],
  // United States (9 skills)
  'image104.png': [[1,3,1],[2,3,2],[3,4,3],[3,5,4],[4,2,5],[2,1,6],[4,1,7],[1,2,8],[1,1,9]],
  // USN alt CVs (Essex) (9 skills)
  'image169.png': [[1,4,1],[2,3,2],[3,4,3],[3,5,4],[4,2,5],[2,1,6],[2,2,7],[3,1,8],[1,2,9]],
  // FDR
  'image88.png':  [[1,4,1],[2,3,2],[3,4,3],[3,5,4],[4,3,5],[4,2,6],[4,1,7]],
  // KM CVs (Richthofen) (9 skills)
  'image213.png': [[1,4,1],[2,3,2],[3,4,3],[3,5,4],[4,2,5],[4,1,6],[1,2,7],[1,1,8],[2,4,9]],
  // Max Immelmann (9 skills)
  'image231.png': [[1,3,1],[2,3,2],[3,4,3],[3,5,4],[4,1,5],[4,2,6],[2,1,7],[1,2,8],[1,1,9]],
};

let updated = 0;
for (const build of builds) {
  const positions = updates[build.image_file];
  if (positions) {
    if (build.skill_positions && build.skill_positions.length > 0) {
      console.log(`SKIP (already set): ${build.h3_title} (${build.image_file})`);
      continue;
    }
    build.skill_positions = positions.map(([row, col, order]) => ({ row, col, order }));
    const pts = build.skill_positions.reduce((s, p) => s + p.row, 0);
    console.log(`Updated: ${build.h3_title} (${build.image_file}) — ${positions.length} skills, ${pts}pts`);
    updated++;
  }
}

fs.writeFileSync(dataPath, JSON.stringify(builds, null, 2));
console.log(`\nDone. ${updated} CV entries updated.`);

// Final status
const byType = {};
for (const b of builds) {
  if (!byType[b.ship_type]) byType[b.ship_type] = { total: 0, done: 0 };
  byType[b.ship_type].total++;
  if (b.skill_positions && b.skill_positions.length > 0) byType[b.ship_type].done++;
}
const total = builds.filter(b => b.skill_positions && b.skill_positions.length > 0).length;
console.log(`\nTotal: ${total}/${builds.length} with skills`);
for (const [type, c] of Object.entries(byType)) {
  console.log(`  ${type}: ${c.done}/${c.total}`);
}
