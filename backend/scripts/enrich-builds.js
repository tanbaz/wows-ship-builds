/**
 * Enrich builds-data.json — classify notes[] into structured fields
 * and generate tags for each build entry.
 *
 * Adds: description, play_style_notes, alternative_notes, tags[]
 * Preserves: original notes[] array unchanged
 *
 * Usage: node enrich-builds.js [--dry-run]
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'builds-data.json');
const builds = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const dryRun = process.argv.includes('--dry-run');

// ── Note classification ─────────────────────────────────────────────

function normalizeQuotes(s) {
  return s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}

function classifyNote(note) {
  const n = normalizeQuotes(note);
  const lower = n.toLowerCase();

  // Rule 1: Applies-to lists
  if (lower.includes('applies to ') || lower.includes('also applies to') || /^applies to:/i.test(n)) return 'applies_to';

  // Rule 2: Alternatives / swap suggestions
  if (/\b(swap|trade|switch|instead of|at the expense of|alternative)\b/i.test(n)) return 'alternative';
  if (/\b(option for|you can use|you can go for|viable alternative)\b/i.test(n)) return 'alternative';

  // Rule 5: Captain recommendations
  if (/\b(captain|Yamamoto|Suzuki|L[uü]tjens|Kuznetsov|Halsey|Cunningham|purchased in the armory|doubloons|coal)\b/i.test(n)) return 'captain';

  // Rule 6: Upgrade/mod advice
  if (/\b(legmod|legendary upgrade|unique upgrade|\bUU\b)\b/i.test(n)) return 'upgrade';
  if (/if you don't have the .* mod/i.test(n)) return 'upgrade';
  if (/\b(mod,|mod\.|mod |upgrade mod|use MAM|use ERP|use ASM|use DCSM)\b/i.test(n)) return 'upgrade';

  // Rule 4: Build philosophy
  if (/\b(this build|this is a|build that|centred around|centered around|allows .* to|general.purpose|focused on)\b/i.test(n)) return 'philosophy';

  // Rule 7: Gameplay tips
  if (/\b(make sure|use the \d|avoid |when dodging|Note:|works best|keep in mind|be careful|be aware)\b/i.test(n)) return 'gameplay';

  // If it looks like a ship/line overview (longer descriptive text, often first note)
  // This will be handled by position logic, not pattern — return null
  return null;
}

function enrichBuild(build) {
  const notes = build.notes || [];
  const descParts = [];
  const playStyleParts = [];
  const altParts = [];
  const appliesToParts = [];

  let firstUnclassified = true;

  for (const note of notes) {
    const cls = classifyNote(note);

    switch (cls) {
      case 'applies_to':
        appliesToParts.push(note);
        break;
      case 'alternative':
        altParts.push(note);
        break;
      case 'captain':
      case 'upgrade':
      case 'gameplay':
        playStyleParts.push(note);
        break;
      case 'philosophy':
        descParts.push(note);
        break;
      default:
        // Unclassified — first one becomes description, rest go to play_style
        if (firstUnclassified) {
          descParts.unshift(note); // ship overview goes first in description
          firstUnclassified = false;
        } else {
          playStyleParts.push(note);
        }
        break;
    }
  }

  // Append all applies_to notes to description
  for (const at of appliesToParts) {
    descParts.push(at);
  }

  // Deduplicate within each field
  const dedup = arr => [...new Set(arr)];

  const description = dedup(descParts).join('\n');
  const play_style_notes = dedup(playStyleParts).join('\n');
  const alternative_notes = dedup(altParts).join('\n');

  // ── Tag generation ──────────────────────────────────────────────
  const tags = generateTags(build, notes);

  return { description, play_style_notes, alternative_notes, tags };
}

// ── Tag generation ────────────────────────────────────────────────

function generateTags(build, notes) {
  const tags = new Set();
  const allText = notes.join(' ').toLowerCase();

  // Ship type tag
  const typeMap = {
    Destroyer: 'destroyer',
    Cruiser: 'cruiser',
    Battleship: 'battleship',
    AirCarrier: 'carrier',
    Submarine: 'submarine',
  };
  if (typeMap[build.ship_type]) tags.add(typeMap[build.ship_type]);

  // Premium / Special
  if (build.is_premium) {
    tags.add(build.ship_tier >= 10 ? 'special' : 'premium');
  }

  // Legendary upgrade variant
  if (/\b(legmod|legendary upgrade|unique upgrade|\bUU\b)\b/i.test(allText) ||
      (build.build_variant && /leg|uu/i.test(build.build_variant))) {
    tags.add('legendary-upgrade');
  }

  // Playstyle keywords from notes
  if (/\bsecondary|secondaries|ManSec|LRSec|manual sec/i.test(allText)) tags.add('secondary-build');
  if (/\btorpedo|torp boat|torp focused|torpedo.?boat/i.test(allText)) tags.add('torpedo-build');
  if (/\bgunboat|gun.?focused|gun.?heavy|HE DPM/i.test(allText)) tags.add('gunboat');
  if (/\btank|survivability|tanky/i.test(allText)) tags.add('tanky');
  if (/\bbrawl|close.?quarter|close.?range|brawler/i.test(allText)) tags.add('brawler');
  if (/\bkit(?:e|ing)|kiting cruiser|long.?range.*farm/i.test(allText)) tags.add('kiter');
  if (/\bsupport|team.?play|spotting/i.test(allText)) tags.add('support');
  if (/\bstealth|stealthy|concealment/i.test(allText)) tags.add('stealth');
  if (/\bAA.focused|AA build|anti.?air/i.test(allText)) tags.add('AA-focused');
  if (/\bhybrid/i.test(allText)) tags.add('hybrid');
  if (/\bsniper|long.?range.*accuracy|pinpoint/i.test(allText)) tags.add('sniper');

  return [...tags];
}

// ── Main ──────────────────────────────────────────────────────────

const stats = { total: 0, empty: 0, enriched: 0 };
const classificationCounts = { applies_to: 0, alternative: 0, captain: 0, upgrade: 0, philosophy: 0, gameplay: 0, unclassified: 0 };

for (const build of builds) {
  stats.total++;
  const notes = build.notes || [];

  if (notes.length === 0) {
    build.description = '';
    build.play_style_notes = '';
    build.alternative_notes = '';
    build.tags = generateTags(build, []);
    stats.empty++;
    continue;
  }

  // Count classifications for stats
  for (const note of notes) {
    const cls = classifyNote(note) || 'unclassified';
    classificationCounts[cls]++;
  }

  const enriched = enrichBuild(build);
  build.description = enriched.description;
  build.play_style_notes = enriched.play_style_notes;
  build.alternative_notes = enriched.alternative_notes;
  build.tags = enriched.tags;
  stats.enriched++;
}

// ── Output ────────────────────────────────────────────────────────

console.log('\n=== Enrichment Stats ===');
console.log(`Total: ${stats.total} builds`);
console.log(`Empty notes: ${stats.empty}`);
console.log(`Enriched: ${stats.enriched}`);
console.log('\nNote classifications:');
for (const [cls, count] of Object.entries(classificationCounts)) {
  console.log(`  ${cls}: ${count}`);
}

// Tag frequency
const tagFreq = {};
for (const b of builds) {
  for (const t of (b.tags || [])) {
    tagFreq[t] = (tagFreq[t] || 0) + 1;
  }
}
console.log('\nTag frequencies:');
for (const [tag, count] of Object.entries(tagFreq).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${tag}: ${count}`);
}

// Spot-check: show 5 diverse samples
console.log('\n=== Spot Check (5 samples) ===');
const samples = [
  builds.find(b => b.ship_type === 'Destroyer' && b.notes && b.notes.length > 5),
  builds.find(b => b.ship_type === 'Cruiser' && b.alternative_notes),
  builds.find(b => b.ship_type === 'Battleship' && b.description.length > 50),
  builds.find(b => b.ship_type === 'AirCarrier' && b.notes && b.notes.length > 0),
  builds.find(b => b.ship_type === 'Submarine' && b.notes && b.notes.length > 0),
];
for (const b of samples) {
  if (!b) continue;
  console.log(`\n--- ${b.h3_title} (${b.ship_type}, ${(b.notes||[]).length} notes) ---`);
  console.log(`  description: ${(b.description || '').substring(0, 200)}...`);
  console.log(`  play_style: ${(b.play_style_notes || '').substring(0, 200)}...`);
  console.log(`  alternatives: ${(b.alternative_notes || '').substring(0, 200)}...`);
  console.log(`  tags: [${b.tags.join(', ')}]`);
}

// Data loss check
let lostNotes = 0;
for (const b of builds) {
  for (const note of (b.notes || [])) {
    const inDesc = (b.description || '').includes(note);
    const inPlay = (b.play_style_notes || '').includes(note);
    const inAlt = (b.alternative_notes || '').includes(note);
    if (!inDesc && !inPlay && !inAlt) {
      lostNotes++;
      console.log(`\nLOST NOTE in ${b.h3_title}: ${note.substring(0, 100)}`);
    }
  }
}
console.log(`\nData loss check: ${lostNotes} lost notes`);

if (!dryRun) {
  fs.writeFileSync(dataPath, JSON.stringify(builds, null, 2));
  console.log('\nWrote enriched data to builds-data.json');
} else {
  console.log('\nDRY RUN — no files written');
}
