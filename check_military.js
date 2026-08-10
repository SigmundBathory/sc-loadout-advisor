const Database = require('better-sqlite3');
const db = new Database('data/sc-loadout.db', {readonly: true});

// Check military coolers
console.log('=== Military Coolers ===');
const coolers = db.prepare("SELECT name, size, type, class, stats FROM components WHERE type='Cooler' AND class='Military' ORDER BY size, name LIMIT 10").all();
coolers.forEach(c => {
  const s = JSON.parse(c.stats);
  console.log(`  ${c.name} (S${c.size}): cooling_rate=${s.cooling_rate} output=${s.output} power_segment_generation=${s.power_segment_generation}`);
});

// Check military power plants
console.log('\n=== Military Power Plants ===');
const pps = db.prepare("SELECT name, size, type, class, stats FROM components WHERE type='PowerPlant' AND class='Military' ORDER BY size, name LIMIT 10").all();
pps.forEach(p => {
  const s = JSON.parse(p.stats);
  console.log(`  ${p.name} (S${p.size}): output=${s.output} power_segment_generation=${s.power_segment_generation} cooling_rate=${s.cooling_rate}`);
});

// Check all coolers
console.log('\n=== All Coolers (sample) ===');
const allCoolers = db.prepare("SELECT name, size, class, stats FROM components WHERE type='Cooler' ORDER BY size, name LIMIT 15").all();
allCoolers.forEach(c => {
  const s = JSON.parse(c.stats);
  console.log(`  ${c.name} (S${c.size}) [${c.class}]: cooling_rate=${s.cooling_rate}`);
});

// Check all power plants
console.log('\n=== All Power Plants (sample) ===');
const allPps = db.prepare("SELECT name, size, class, stats FROM components WHERE type='PowerPlant' ORDER BY size, name LIMIT 15").all();
allPps.forEach(p => {
  const s = JSON.parse(p.stats);
  console.log(`  ${p.name} (S${p.size}) [${p.class}]: output=${s.output} psg=${s.power_segment_generation}`);
});

db.close();