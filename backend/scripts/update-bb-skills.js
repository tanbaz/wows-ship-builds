/**
 * Update BB skill_positions in builds-data.json
 * Maps skill abbreviations to Battleship grid positions and populates entries.
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'builds-data.json');
const builds = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Battleship skill grid mapping: abbreviation -> {row, col}
const BB_SKILLS = {
  GF:    { row: 1, col: 1 },  // Gun Feeder
  DE:    { row: 1, col: 2 },  // Demolition Expert
  CS:    { row: 1, col: 3 },  // Consumable Specialist
  ERS:   { row: 1, col: 4 },  // Emergency Repair Specialist
  IFA:   { row: 1, col: 5 },  // Incoming Fire Alert
  PM:    { row: 1, col: 6 },  // Preventive Maintenance
  GtG:   { row: 2, col: 1 },  // Grease the Gears
  IFHE:  { row: 2, col: 2 },  // Inertia Fuse for HE Shells
  Brisk: { row: 2, col: 3 },  // Brisk
  Vig:   { row: 2, col: 4 },  // Vigilance
  PT:    { row: 2, col: 5 },  // Priority Target
  ADASW: { row: 2, col: 6 },  // AA Defense and ASW Expert
  SHAP:  { row: 3, col: 1 },  // Super-Heavy AP Shells
  LRSec: { row: 3, col: 2 },  // Long-Range Secondary Battery Shells
  AR:    { row: 3, col: 3 },  // Adrenaline Rush
  BoS:   { row: 3, col: 4 },  // Basics of Survivability
  IRPR:  { row: 3, col: 5 },  // Improved Repair Party Readiness
  FFT:   { row: 3, col: 6 },  // Focus Fire Training
  Fur:   { row: 4, col: 1 },  // Furious
  ManSec:{ row: 4, col: 2 },  // Manual Secondary Battery Aiming
  CQC:   { row: 4, col: 3 },  // Close Quarters Combat
  ERE:   { row: 4, col: 4 },  // Emergency Repair Expert
  CE:    { row: 4, col: 5 },  // Concealment Expert
  FPE:   { row: 4, col: 6 },  // Fire Prevention Expert
};

function makePositions(skillAbbrs) {
  return skillAbbrs.map((abbr, i) => {
    const s = BB_SKILLS[abbr];
    if (!s) throw new Error(`Unknown skill abbreviation: ${abbr}`);
    return { row: s.row, col: s.col, order: i + 1 };
  });
}

// Define all builds to update, keyed by image_file
const updates = {
  'image58.png':  { skills: ['PM','Brisk','AR','CE','FPE','LRSec','ManSec'] },
  'image247.png': { skills: ['PM','Brisk','GtG','AR','FPE','CE','ERE','IFA'] },
  'image120.png': { skills: ['DE','IFHE','LRSec','FPE','AR','ManSec','CQC'] },
  'image167.png': { skills: ['GF','GtG','AR','FPE','BoS','ERE','CE'] },
  'image45.png':  { skills: ['CS','Brisk','AR','CE','FPE','ERE','BoS'] },
  'image24.png':  { skills: ['GF','GtG','AR','FPE','FFT','ERE','CE'] },
  'image205.png': { skills: ['DE','GtG','AR','CE','LRSec','FPE','ERE'] },
  'image118.png': { skills: ['PM','GtG','AR','CE','FPE','ERE','BoS'] },
  'image26.png':  { skills: ['PM','GtG','AR','CE','FPE','ERE','BoS'] },
  'image19.png':  { skills: ['GF','GtG','AR','CE','FPE','ManSec','LRSec'] },
  'image105.png': { skills: ['DE','IFHE','AR','CE','FPE','LRSec','ManSec'] },
  'image109.png': { skills: ['GF','GtG','AR','CE','FPE','ERE','Brisk','PM'] },
  'image162.png': { skills: ['PM','Brisk','AR','CE','FPE','ERE','IRPR'] },
  'image35.png':  { skills: ['GF','Brisk','AR','CE','ERE','FPE','BoS'] },
  'image244.png': { skills: ['GF','Brisk','AR','CE','FPE','ERE','CS','GtG'] },
  'image66.png':  { skills: ['DE','Brisk','AR','CE','FPE','LRSec','ManSec'] },
  'image80.png':  { skills: ['PM','Brisk','AR','CE','FPE','LRSec','ManSec'] },
  'image59.png':  { skills: ['PM','Brisk','AR','CE','FPE','ERE','BoS'] },
  'image191.png': { skills: ['GF','Brisk','AR','CE','FPE','ERE','LRSec'] },
  'image218.png': { skills: ['GF','Brisk','AR','CE','FPE','ERE','PM','GtG'] },
  'image137.png': { skills: ['PM','Brisk','AR','CE','ERE','ManSec','LRSec'] },
  'image119.png': { skills: ['GF','Brisk','AR','CE','FPE','ERE','BoS'] },
  'image8.png':   { skills: ['ERS','Brisk','AR','CE','FPE','ERE','SHAP'] },
  'image161.png': { skills: ['CS','GtG','AR','CE','FPE','ERE','SHAP'] },
  'image108.png': { skills: ['ERS','Brisk','AR','FPE','CE','ERE','GtG','PM'] },
  'image251.png': { skills: ['PM','Brisk','AR','CE','LRSec','ManSec','ERE'] },
  'image28.png':  { skills: ['GF','Brisk','AR','CE','FPE','ERE','GtG','CS'] },
  'image89.png':  { skills: ['GF','Brisk','AR','FPE','CE','ERE','FFT'] },
  'image124.png': { skills: ['GF','Brisk','AR','CE','ERE','FPE','GtG','CS'] },
  'image181.png': { skills: ['PM','GtG','AR','FPE','LRSec','ManSec','BoS','DE'] },
  'image114.png': { skills: ['ERS','GtG','AR','FPE','CE','ERE','FFT'] },
};

// Update existing entries
let updated = 0;
for (const build of builds) {
  const upd = updates[build.image_file];
  if (upd) {
    build.skill_positions = makePositions(upd.skills);
    console.log(`Updated: ${build.h3_title} (${build.image_file}) — ${upd.skills.length} skills`);
    updated++;
  }
}

// Add new variant entries that don't exist yet
// Taihang damage/survivability alt (image158)
const taihangBase = builds.find(b => b.image_file === 'image108.png');
if (taihangBase && !builds.find(b => b.image_file === 'image158.png')) {
  builds.push({
    h3_id: 'taihang',
    h3_title: 'Taihang',
    build_variant: 'Damage/survivability alt',
    category_id: taihangBase.category_id,
    category_title: taihangBase.category_title,
    ship_type: 'Battleship',
    is_premium: taihangBase.is_premium,
    image_file: 'image158.png',
    notes: taihangBase.notes,
    ship_name: '',
    ship_tier: 0,
    ship_nation: '',
    skill_positions: makePositions(['PM','Brisk','AR','FPE','CE','ERE','SHAP']),
    upgrade_names: [],
  });
  console.log('Added: Taihang (Damage/survivability alt) — image158.png');
  updated++;
}

// Roussillion more damage alt (image252)
const roussBase = builds.find(b => b.image_file === 'image28.png');
if (roussBase && !builds.find(b => b.image_file === 'image252.png')) {
  builds.push({
    h3_id: 'roussillion',
    h3_title: 'Roussillion',
    build_variant: 'More damage',
    category_id: roussBase.category_id,
    category_title: roussBase.category_title,
    ship_type: 'Battleship',
    is_premium: roussBase.is_premium,
    image_file: 'image252.png',
    notes: roussBase.notes,
    ship_name: '',
    ship_tier: 0,
    ship_nation: '',
    skill_positions: makePositions(['CS','Brisk','AR','CE','FPE','ERE','SHAP']),
    upgrade_names: [],
  });
  console.log('Added: Roussillion (More damage) — image252.png');
  updated++;
}

// Write back
fs.writeFileSync(dataPath, JSON.stringify(builds, null, 2));
console.log(`\nDone. ${updated} entries updated/added.`);
