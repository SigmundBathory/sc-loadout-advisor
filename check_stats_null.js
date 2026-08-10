const Database = require('better-sqlite3');
const db = new Database('data/sc-loadout.db', {readonly: true});

// Check for NULL stats in coolers and power plants
console.log('=== Coolers with NULL/empty stats ===');
const nullCoolers = db.prepare("SELECT name, size, class, stats FROM components WHERE type='Cooler' AND (stats IS NULL OR stats = '' OR stats = '{}')").all();
nullCoolers.forEach(c => console.log(`  ${c.name} (S${c.size}) [${c.class}]: stats='${c.stats}'`));

console.log('\n=== PowerPlants with NULL/empty stats ===');
const nullPps = db.prepare("SELECT name, size, class, stats FROM components WHERE type='PowerPlant' AND (stats IS NULL OR stats = '' OR stats = '{}')").all();
nullPps.forEach(p => console.log(`  ${p.name} (S${p.size}) [${p.class}]: stats='${p.stats}'`));

// Check a specific military cooler
console.log('\n=== Bracer (S1) Military Cooler stats ===');
const bracer = db.prepare("SELECT stats FROM components WHERE name = 'Bracer' AND size = 1").get();
if (bracer) {
  console.log('  Raw stats:', bracer.stats);
  const parsed = JSON.parse(bracer.stats || "{}");
  console.log('  Parsed:', parsed);
}

// Check a specific military power plant
console.log('\n=== Charger (S1) Military PowerPlant stats ===');
const charger = db.prepare("SELECT stats FROM components WHERE name = 'Charger' AND size = 1").get();
if (charger) {
  console.log('  Raw stats:', charger.stats);
  const parsed = JSON.parse(charger.stats || "{}");
  console.log('  Parsed:', parsed);
}

db.close();