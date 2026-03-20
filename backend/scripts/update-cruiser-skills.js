/**
 * Update Cruiser skill_positions in builds-data.json
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'builds-data.json');
const builds = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Cruiser skill grid: abbreviation -> {row, col}
const CL_SKILLS = {
  GtG:      { row: 1, col: 1 },
  SwFish:   { row: 1, col: 2 },
  CS:       { row: 1, col: 3 },
  GF:       { row: 1, col: 4 },
  IFA:      { row: 1, col: 5 },
  LS:       { row: 1, col: 6 },
  DE:       { row: 2, col: 1 },
  FtT:      { row: 2, col: 2 },
  ConsEnh:  { row: 2, col: 3 },
  EitS:     { row: 2, col: 4 },
  PT:       { row: 2, col: 5 },
  FFT:      { row: 2, col: 6 },
  HvyHESAP: { row: 3, col: 1 },
  PaP:      { row: 3, col: 2 },
  AR:       { row: 3, col: 3 },
  HvyAP:    { row: 3, col: 4 },
  Super:    { row: 3, col: 5 },
  SE:       { row: 3, col: 6 },
  TGG:      { row: 4, col: 1 },
  Outnumbered: { row: 4, col: 2 },
  RL:       { row: 4, col: 3 },
  IFHE:     { row: 4, col: 4 },
  CE:       { row: 4, col: 5 },
  AADefASW: { row: 4, col: 6 },
};

function makePositions(skillAbbrs) {
  return skillAbbrs.map((abbr, i) => {
    const s = CL_SKILLS[abbr];
    if (!s) throw new Error(`Unknown cruiser skill: ${abbr}`);
    return { row: s.row, col: s.col, order: i + 1 };
  });
}

const updates = {
  'image226.png': ['GF','PT','Super','CE','AR','SE','FtT','EitS','CS'],
  'image95.png':  ['CS','FtT','AR','CE','Super','SE','HvyHESAP','PT'],
  'image223.png': ['GF','EitS','Super','CE','AR','TGG','SE','GtG'],
  'image73.png':  ['SwFish','FtT','AR','CE','SE','HvyHESAP','ConsEnh','CS','LS','IFA'],
  'image179.png': ['GF','ConsEnh','Super','CE','AR','SE','TGG','CS'],
  'image53.png':  ['GF','PT','Super','CE','AR','HvyHESAP','TGG','GtG'],
  'image211.png': ['CS','ConsEnh','Super','CE','AR','SE','TGG','GF'],
  'image242.png': ['CS','ConsEnh','SE','CE','AR','Super','AADefASW','IFA'],
  'image62.png':  ['CS','PT','Super','CE','AR','SE','HvyHESAP','ConsEnh'],
  'image112.png': ['GF','ConsEnh','AR','CE','Super','TGG','SE','GtG'],
  'image116.png': ['GF','ConsEnh','AR','CE','Super','HvyAP','GtG','TGG'],
  'image215.png': ['GF','PT','Super','CE','AR','GtG','TGG','ConsEnh','CS'],
  'image23.png':  ['GF','PT','Super','CE','AR','TGG','SE','CS'],
  'image55.png':  ['LS','ConsEnh','Super','CE','AR','HvyHESAP','SE','DE'],
  'image198.png': ['GtG','FFT','SE','CE','AR','Super','PT','ConsEnh','GF'],
  'image92.png':  ['GF','EitS','Super','CE','AR','SE','TGG','CS'],
  'image83.png':  ['GtG','DE','PaP','CE','AR','Super','TGG','GF'],
  'image201.png': ['GF','FFT','Super','CE','AR','PaP','SE','SwFish','CS'],
  'image148.png': ['CS','ConsEnh','AR','CE','SE','Super','TGG','LS'],
  'image87.png':  ['CS','ConsEnh','AR','CE','SE','Super','TGG','LS'],
  'image207.png': ['CS','ConsEnh','Super','CE','AR','SE','PaP','FtT'],
  'image48.png':  ['GtG','PT','Super','CE','AR','SE','ConsEnh','CS','FFT'],
  'image177.png': ['GF','PT','Super','CE','AR','SE','TGG','CS'],
  'image51.png':  ['CS','PT','Super','CE','AR','HvyAP','SE','ConsEnh'],
  'image240.png': ['CS','ConsEnh','AR','CE','Super','SE','Outnumbered','GtG'],
  'image36.png':  ['IFA','ConsEnh','Super','CE','AR','SE','PaP','FtT'],
  'image239.png': ['GF','PT','Super','CE','AR','TGG','ConsEnh','CS','GtG'],
  'image157.png': ['IFA','ConsEnh','SE','CE','HvyHESAP','AR','Super','CS','LS'],
  'image61.png':  ['GF','PT','Super','CE','AR','SE','Outnumbered','GtG'],
  'image67.png':  ['GF','EitS','Super','CE','AR','SE','TGG','GtG'],
  'image110.png': ['GF','EitS','Super','CE','AR','HvyHESAP','TGG','CS'],
  'image98.png':  ['CS','ConsEnh','AR','CE','TGG','GF','PaP','Super'],
  'image9.png':   ['GF','PT','SE','CE','PaP','AR','TGG','GtG'],
  'image129.png': ['SwFish','PT','Super','CE','AR','SE','HvyHESAP','FtT'],
  'image1.png':   ['CS','ConsEnh','Super','CE','AR','SE','PaP','FtT'],
  'image234.png': ['CS','FFT','AR','CE','Super','SE','Outnumbered','GF'],
  'image225.png': ['GF','FFT','Super','CE','AR','SE','TGG','IFA'],
  'image206.png': ['CS','FFT','HvyHESAP','CE','AR','PT','SE','Super'],
  'image103.png': ['CS','ConsEnh','SE','CE','AR','Super','TGG','IFA'],
  'image93.png':  ['GF','EitS','Super','CE','AR','SE','TGG','GtG'],
  // Premium/Special Cruisers
  'image202.png': ['LS','DE','SE','CE','AR','TGG','IFA','HvyHESAP'],
  'image60.png':  ['LS','PT','Super','CE','HvyHESAP','AR','SE','DE'],
  'image253.png': ['GtG','PT','AR','CE','SE','Super','HvyHESAP','ConsEnh'],
  'image52.png':  ['LS','PT','HvyAP','CE','AR','SE','RL','GtG'],
  'image85.png':  ['GF','PT','AR','CE','SE','DE','IFHE','LS','GtG'],
  'image178.png': ['LS','PT','AR','CE','SE','HvyHESAP','ConsEnh','DE','CS'],
  'image233.png': ['LS','PT','Super','CE','AR','SE','HvyHESAP','FtT'],
  'image173.png': ['LS','PT','SE','CE','AR','HvyHESAP','PaP','FtT'],
  'image208.png': ['CS','PT','AR','CE','SE','ConsEnh','TGG','GF','GtG'],
  'image101.png': ['CS','PT','SE','CE','LS','AR','Super','Outnumbered'],
  'image204.png': ['GF','PT','SE','CE','AR','HvyHESAP','Super','ConsEnh'],
  'image164.png': ['CS','ConsEnh','Super','CE','AR','SE','TGG','GF'],
  'image141.png': ['LS','PT','SE','CE','AR','TGG','EitS','GF','CS'],
  'image155.png': ['LS','ConsEnh','SE','CE','HvyHESAP','AR','Super','CS','IFA'],
  'image203.png': ['GF','PT','Super','CE','AR','SE','HvyHESAP','DE'],
  'image41.png':  ['GF','PT','Super','CE','AR','SE','HvyHESAP','DE'],
  'image144.png': ['LS','PT','AR','CE','Super','HvyHESAP','CS','ConsEnh','DE'],
  'image220.png': ['GF','PT','AR','CE','SE','TGG','DE','ConsEnh'],
  'image183.png': ['LS','PT','SE','CE','AR','HvyHESAP','Super','DE'],
  'image20.png':  ['GtG','PT','SE','CE','AR','HvyAP','TGG','IFA'],
  'image182.png': ['GF','PT','SE','CE','AR','TGG','GtG','LS','EitS'],
  'image69.png':  ['IFA','PT','Super','CE','AR','HvyHESAP','SE','FFT'],
  'image187.png': ['GF','FFT','SE','CE','AR','RL','Super','CS'],
  'image74.png':  ['CS','DE','SE','CE','AR','Super','TGG','LS'],
  'image166.png': ['GtG','PT','SE','CE','AR','HvyHESAP','FFT','PaP'],
  'image154.png': ['CS','PT','SE','CE','Super','AR','HvyHESAP','ConsEnh'],
  'image70.png':  ['GF','ConsEnh','Super','CE','AR','SE','TGG','CS'],
  'image170.png': ['GF','ConsEnh','Super','CE','AR','HvyHESAP','TGG','GtG'],
  'image142.png': ['GF','PT','Super','CE','AR','HvyHESAP','GtG','HvyAP','IFA'],
  'image229.png': ['GtG','DE','AR','CE','Super','PaP','TGG','CS'],
  'image133.png': ['LS','PT','SE','CE','HvyHESAP','AR','PaP','DE'],
  'image79.png':  ['GF','PT','Super','CE','AR','SE','HvyAP','EitS'],
  'image18.png':  ['LS','PT','Super','CE','AR','HvyHESAP','SE','ConsEnh'],
  'image237.png': ['GF','DE','Super','CE','AR','SE','TGG','GtG'],
  'image254.png': ['LS','PT','HvyHESAP','CE','SE','AR','Super','ConsEnh'],
  'image230.png': ['GtG','PT','Super','CE','AR','SE','TGG','CS'],
  'image152.png': ['LS','DE','SE','CE','GtG','Super','AR','TGG'],
  'image192.png': ['LS','EitS','SE','CE','AR','TGG','HvyAP','GtG'],
  'image236.png': ['IFA','DE','SE','CE','Super','AR','TGG','GtG'],
  'image131.png': ['GF','PT','AR','CE','Super','SE','TGG','CS'],
  'image194.png': ['GtG','GF','PT','Super','CE','SE','AR','TGG'],
  'image209.png': ['CS','ConsEnh','AR','CE','Super','HvyHESAP','TGG','GF'],
  'image180.png': ['CS','EitS','SE','CE','Super','AR','TGG','IFA'],
};

let updated = 0;
for (const build of builds) {
  const skills = updates[build.image_file];
  if (skills) {
    build.skill_positions = makePositions(skills);
    const pts = build.skill_positions.reduce((s, p) => s + p.row, 0);
    console.log(`Updated: ${build.h3_title} (${build.image_file}) — ${skills.length} skills, ${pts}pts`);
    if (pts !== 21) console.log(`  *** WARNING: ${pts} != 21 ***`);
    updated++;
  }
}

fs.writeFileSync(dataPath, JSON.stringify(builds, null, 2));
console.log(`\nDone. ${updated} cruiser entries updated.`);

// Final status
const withSkills = builds.filter(b => b.skill_positions && b.skill_positions.length > 0);
const without = builds.filter(b => !b.skill_positions || b.skill_positions.length === 0);
const byType = {};
for (const b of builds) {
  if (!byType[b.ship_type]) byType[b.ship_type] = { total: 0, done: 0 };
  byType[b.ship_type].total++;
  if (b.skill_positions && b.skill_positions.length > 0) byType[b.ship_type].done++;
}
console.log(`\nTotal: ${withSkills.length}/${builds.length} with skills`);
for (const [type, c] of Object.entries(byType)) {
  console.log(`  ${type}: ${c.done}/${c.total}`);
}
