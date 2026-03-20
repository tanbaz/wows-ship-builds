/**
 * Merge all skill data from dd-skills.json, skill-extractions.json,
 * and submarine-builds.json into builds-data.json.
 * This consolidates all previously extracted skill data.
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'builds-data.json');
const builds = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// ── 1. DD skills from dd-skills.json ───────────────────────
// Format: { img, pos: [[row, col, order], ...] }
const ddSkills = JSON.parse(fs.readFileSync(path.join(__dirname, 'dd-skills.json'), 'utf-8'));

let ddUpdated = 0;
for (const dd of ddSkills) {
  const entry = builds.find(b => b.image_file === dd.img);
  if (!entry) {
    console.log(`DD SKIP (not found): ${dd.img}`);
    continue;
  }
  if (entry.skill_positions && entry.skill_positions.length > 0) {
    // Already has skills, skip
    continue;
  }
  entry.skill_positions = dd.pos.map(([row, col, order]) => ({ row, col, order }));
  ddUpdated++;
}
console.log(`DD skills: ${ddUpdated} entries updated from dd-skills.json`);

// ── 2. DD skills from skill-extractions.json ───────────────
// Format: { image, h3_title, ship_type, skills: [{order, row, col, name, tier}] }
const extractions = JSON.parse(fs.readFileSync(path.join(__dirname, 'skill-extractions.json'), 'utf-8'));

let extUpdated = 0;
for (const ext of extractions) {
  const entry = builds.find(b => b.image_file === ext.image);
  if (!entry) {
    console.log(`EXTRACTION SKIP (not found): ${ext.image} — ${ext.h3_title}`);
    continue;
  }
  if (entry.skill_positions && entry.skill_positions.length > 0) {
    // Already has skills (e.g. from dd-skills.json), skip
    continue;
  }
  entry.skill_positions = ext.skills.map(s => ({ row: s.row, col: s.col, order: s.order }));
  extUpdated++;
}
console.log(`Skill extractions: ${extUpdated} entries updated from skill-extractions.json`);

// ── 3. Submarine builds from submarine-builds.json ─────────
// Format: { ship_name, ship_tier, ship_nation, ship_type, title, notes, skill_positions, upgrade_names }
const subBuilds = JSON.parse(fs.readFileSync(path.join(__dirname, 'submarine-builds.json'), 'utf-8'));

let subUpdated = 0;
for (const sub of subBuilds) {
  // Match by title in builds-data.json
  const entry = builds.find(b =>
    b.ship_type === 'Submarine' &&
    (b.h3_title === sub.title ||
     b.h3_title.toLowerCase().includes(sub.title.toLowerCase()) ||
     sub.title.toLowerCase().includes(b.h3_title.toLowerCase()))
  );
  if (!entry) {
    console.log(`SUB SKIP (not found): "${sub.title}"`);
    continue;
  }
  if (entry.skill_positions && entry.skill_positions.length > 0) {
    continue;
  }
  entry.skill_positions = sub.skill_positions;
  subUpdated++;
}
console.log(`Submarine builds: ${subUpdated} entries updated from submarine-builds.json`);

// ── Summary ────────────────────────────────────────────────
const withSkills = builds.filter(b => b.skill_positions && b.skill_positions.length > 0);
const without = builds.filter(b => !b.skill_positions || b.skill_positions.length === 0);

console.log(`\n=== FINAL STATUS ===`);
console.log(`Total entries: ${builds.length}`);
console.log(`With skills: ${withSkills.length}`);
console.log(`Without skills: ${without.length}`);

// By type
const byType = {};
for (const b of builds) {
  if (!byType[b.ship_type]) byType[b.ship_type] = { total: 0, done: 0 };
  byType[b.ship_type].total++;
  if (b.skill_positions && b.skill_positions.length > 0) byType[b.ship_type].done++;
}
for (const [type, c] of Object.entries(byType)) {
  console.log(`  ${type}: ${c.done}/${c.total}`);
}

// List remaining missing
if (without.length > 0) {
  console.log(`\n=== STILL MISSING SKILLS ===`);
  for (const b of without) {
    console.log(`  ${b.ship_type} | ${b.h3_title} (${b.image_file})`);
  }
}

// Write
fs.writeFileSync(dataPath, JSON.stringify(builds, null, 2));
console.log(`\nSaved to builds-data.json`);
