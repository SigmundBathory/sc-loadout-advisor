const Database = require('better-sqlite3');
const db = new Database('data/sc-loadout.db', {readonly: true});

// Check Cutlass Black hardpoints
console.log('=== Cutlass Black hardpoints ===');
const cutlass = db.prepare("SELECT id FROM ships WHERE name LIKE '%Cutlass%'").all();
cutlass.forEach(s => {
  console.log(`\n--- ${s.name} (${s.id}) ---`);
  const hps = db.prepare("SELECT * FROM hardpoints WHERE ship_id = ?").all(s.id);
  hps.forEach(h => console.log(`  ${h.slot_type} size=${h.size} max_size=${h.max_size} id=${h.id}`));
});

// Check weapon components available for size 6
console.log('\n=== Size 6 Weapons ===');
const weapons6 = db.prepare("SELECT name, size, class, stats FROM components WHERE type='Weapon' AND size = 6 ORDER BY name LIMIT 10").all();
weapons6.forEach(w => {
  const s = JSON.parse(w.stats);
  console.log(`  ${w.name} (S${w.size}) [${w.class}]: dps=${s.dps} range=${s.range}`);
});

// Check weapon components for size 5
console.log('\n=== Size 5 Weapons ===');
const weapons5 = db.prepare("SELECT name, size, class, stats FROM components WHERE type='Weapon' AND size = 5 ORDER BY name LIMIT 10").all();
weapons5.forEach(w => {
  const s = JSON.parse(w.stats);
  console.log(`  ${w.name} (S${w.size}) [${w.class}]: dps=${s.dps} range=${s.range}`);
});

db.close();