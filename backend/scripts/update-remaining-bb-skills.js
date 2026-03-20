/**
 * Update remaining 20 BB skill_positions in builds-data.json
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'builds-data.json');
const builds = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// BB skill grid
const BB_SKILLS = {
  GF:    { row: 1, col: 1 }, DE:    { row: 1, col: 2 }, CS:    { row: 1, col: 3 },
  ERS:   { row: 1, col: 4 }, IFA:   { row: 1, col: 5 }, PM:    { row: 1, col: 6 },
  GtG:   { row: 2, col: 1 }, IFHE:  { row: 2, col: 2 }, Brisk: { row: 2, col: 3 },
  Vig:   { row: 2, col: 4 }, PT:    { row: 2, col: 5 }, ADASW: { row: 2, col: 6 },
  SHAP:  { row: 3, col: 1 }, LRSec: { row: 3, col: 2 }, AR:    { row: 3, col: 3 },
  BoS:   { row: 3, col: 4 }, IRPR:  { row: 3, col: 5 }, FFT:   { row: 3, col: 6 },
  Fur:   { row: 4, col: 1 }, ManSec:{ row: 4, col: 2 }, CQC:   { row: 4, col: 3 },
  ERE:   { row: 4, col: 4 }, CE:    { row: 4, col: 5 }, FPE:   { row: 4, col: 6 },
};

function makePositions(skillAbbrs) {
  return skillAbbrs.map((abbr, i) => {
    const s = BB_SKILLS[abbr];
    if (!s) throw new Error(`Unknown BB skill: ${abbr}`);
    return { row: s.row, col: s.col, order: i + 1 };
  });
}

const updates = {
  'image165.png': ['PM','GtG','AR','FPE','CE','CQC','IRPR'],
  'image245.png': ['PM','Brisk','AR','CE','FPE','CQC','SHAP'],
  'image3.png':   ['GF','GtG','AR','CE','FPE','CQC','IRPR'],
  'image188.png': ['GF','GtG','AR','CE','FPE','CQC','IRPR'],
  'image107.png': ['PM','Brisk','AR','CE','FPE','CQC','GtG','ERS'],
  'image189.png': ['GF','GtG','AR','CE','FPE','CQC','FFT'],
  'image217.png': ['GF','GtG','AR','FPE','CQC','LRSec','ManSec'],
  'image40.png':  ['GF','Brisk','AR','CE','FPE','CQC','SHAP'],
  'image32.png':  ['GF','Brisk','AR','CE','FPE','CQC','SHAP'],
  'image81.png':  ['GF','GtG','AR','CE','FPE','CQC','SHAP'],
  'image38.png':  ['GF','GtG','AR','CE','CQC','IRPR','FPE'],
  'image34.png':  ['PM','Brisk','AR','CE','FPE','IRPR','CQC'],
  'image44.png':  ['ERS','GtG','AR','CE','FPE','CQC','SHAP'],
  'image190.png': ['ERS','GtG','AR','IRPR','CQC','CE','FPE'],
  'image246.png': ['PM','Brisk','AR','CE','FPE','CQC','IRPR'],
  'image13.png':  ['DE','GtG','AR','CE','CQC','LRSec','ManSec'],
  'image186.png': ['GF','Brisk','AR','CE','FPE','CQC','GtG','DE'],
  'image54.png':  ['GF','GtG','AR','CE','FPE','CQC','Brisk','CS'],
  'image140.png': ['GF','GtG','AR','CE','FPE','CQC','IRPR'],
  'image49.png':  ['GF','Brisk','AR','CE','FPE','CQC','SHAP'],
};

let updated = 0;
for (const build of builds) {
  const skills = updates[build.image_file];
  if (skills) {
    // Only update if not already set (don't overwrite earlier data)
    if (build.skill_positions && build.skill_positions.length > 0) {
      console.log(`SKIP (already set): ${build.h3_title} (${build.image_file})`);
      continue;
    }
    build.skill_positions = makePositions(skills);
    const pts = build.skill_positions.reduce((s, p) => s + p.row, 0);
    console.log(`Updated: ${build.h3_title} (${build.image_file}) — ${skills.length} skills, ${pts}pts`);
    if (pts !== 21) console.log(`  *** WARNING: ${pts} != 21 ***`);
    updated++;
  }
}

fs.writeFileSync(dataPath, JSON.stringify(builds, null, 2));
console.log(`\nDone. ${updated} BB entries updated.`);

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
