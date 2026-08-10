const Database = require('better-sqlite3');
const db = new Database('data/sc-loadout.db', {readonly: true});

// Test the getCompatibleComponents query directly
console.log('=== Cooler components for Gladius (size 1) ===');
const coolers = db.prepare("SELECT c.name, c.size, c.class, c.stats FROM components c WHERE c.type = 'Cooler' AND c.size <= 1 ORDER BY c.name LIMIT 5").all();
coolers.forEach(c => {
  const s = JSON.parse(c.stats);
  console.log(`  ${c.name} (S${c.size}) [${c.class}]: cooling_rate=${s.cooling_rate}`);
});

console.log('\n=== PowerPlant components for Gladius (size 1) ===');
const pps = db.prepare("SELECT c.name, c.size, c.class, c.stats FROM components c WHERE c.type = 'PowerPlant' AND c.size <= 1 ORDER BY c.name LIMIT 5").all();
pps.forEach(p => {
  const s = JSON.parse(p.stats);
  console.log(`  ${p.name} (S${p.size}) [${p.class}]: output=${s.output} psg=${s.power_segment_generation}`);
});

console.log('\n=== Cooler components for Constellation (size 2) ===');
const coolers2 = db.prepare("SELECT c.name, c.size, c.class, c.stats FROM components c WHERE c.type = 'Cooler' AND c.size <= 2 ORDER BY c.name LIMIT 5").all();
coolers2.forEach(c => {
  const s = JSON.parse(c.stats);
  console.log(`  ${c.name} (S${c.size}) [${c.class}]: cooling_rate=${s.cooling_rate}`);
});

console.log('\n=== PowerPlant components for Constellation (size 2) ===');
const pps2 = db.prepare("SELECT c.name, c.size, c.class, c.stats FROM components c WHERE c.type = 'PowerPlant' AND c.size <= 2 ORDER BY c.name LIMIT 5").all();
pps2.forEach(p => {
  const s = JSON.parse(p.stats);
  console.log(`  ${p.name} (S${p.size}) [${p.class}]: output=${s.output} psg=${s.power_segment_generation}`);
});

db.close();