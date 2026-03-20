/**
 * Update remaining 11 CV skill_positions in builds-data.json
 *
 * CV Grid:
 * R1: Last Gasp(LG) | Improved Engine Boost(IEB) | Engine Techie(ET) | Air Supremacy(AS) | Direction Center for Fighters(DCF) | Search and Destroy(SaD)
 * R2: Torpedo Bomber(TB) | Swift Flying Fish(SFF) | Improved Engines(IE) | Combat Maneuver Specialist(CMS) | Secondary Armament Expert(SAE) | Patrol Group Leader(PGL)
 * R3: Sight Stabilization(SS) | Enhanced AP Ammo(EAPA) | Pyrotechnician(Pyro) | Aircraft Armor(AA) | Survivability Expert(SE) | Interceptor(Int)
 * R4: Bomber Flight Control(BFC) | Proximity Fuze(PF) | Defensive Fire Expert(DFE) | Enhanced Aircraft Armor(EAA) | Hidden Menace(HM) | Enhanced Reactions(ER)
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'builds-data.json');
const builds = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const CV_SKILLS = {
  LG:   { row: 1, col: 1 },
  IEB:  { row: 1, col: 2 },
  ET:   { row: 1, col: 3 },
  AS:   { row: 1, col: 4 },
  DCF:  { row: 1, col: 5 },
  SaD:  { row: 1, col: 6 },
  TB:   { row: 2, col: 1 },
  SFF:  { row: 2, col: 2 },
  IE:   { row: 2, col: 3 },
  CMS:  { row: 2, col: 4 },
  SAE:  { row: 2, col: 5 },
  PGL:  { row: 2, col: 6 },
  SS:   { row: 3, col: 1 },
  EAPA: { row: 3, col: 2 },
  Pyro: { row: 3, col: 3 },
  AA:   { row: 3, col: 4 },
  SE:   { row: 3, col: 5 },
  Int:  { row: 3, col: 6 },
  BFC:  { row: 4, col: 1 },
  PF:   { row: 4, col: 2 },
  DFE:  { row: 4, col: 3 },
  EAA:  { row: 4, col: 4 },
  HM:   { row: 4, col: 5 },
  ER:   { row: 4, col: 6 },
};

function makePositions(skillAbbrs) {
  return skillAbbrs.map((abbr, i) => {
    const s = CV_SKILLS[abbr];
    if (!s) throw new Error(`Unknown CV skill: ${abbr}`);
    return { row: s.row, col: s.col, order: i + 1 };
  });
}

const updates = {
  'image241.png': ['AS','IE','AA','SE','PF','TB','IEB','Pyro','CMS'],
  'image57.png':  ['AS','IE','AA','SE','PF','SS','TB','CMS','LG'],
  'image238.png': ['AS','IE','AA','SE','PF','TB','BFC','IEB','LG'],
  'image216.png': ['AS','IE','SE','AA','BFC','EAA','PF'],
  'image15.png':  ['AS','IE','AA','SE','BFC','TB','SS','ET','IEB','LG'],
  'image146.png': ['AS','IE','AA','SE','BFC','SaD','ER','Int'],
  'image5.png':   ['AS','IE','SE','AA','PF','BFC','TB','LG','IEB'],
  'image82.png':  ['AS','IE','SE','AA','EAA','TB','IEB','LG','PF'],
  'image91.png':  ['AS','IE','AA','SE','BFC','SS','IEB','LG','Pyro'],
  'image130.png': ['AS','IE','AA','SE','BFC','SS','LG','IEB'],
  'image153.png': ['AS','IE','SE','AA','PF','SS','TB','CMS','IEB'],
};

let updated = 0;
for (const build of builds) {
  const skills = updates[build.image_file];
  if (skills) {
    if (build.skill_positions && build.skill_positions.length > 0) {
      console.log(`SKIP (already set): ${build.h3_title} (${build.image_file})`);
      continue;
    }
    build.skill_positions = makePositions(skills);
    const pts = build.skill_positions.reduce((s, p) => s + p.row, 0);
    console.log(`Updated: ${build.h3_title} (${build.image_file}) — ${skills.length} skills, ${pts}pts`);
    if (pts !== 21) console.log(`  NOTE: ${pts}pts (not 21 — may be intentional for lower tier)`);
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
