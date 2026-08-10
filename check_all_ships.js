const Database = require('better-sqlite3');
const db = new Database('data/sc-loadout.db', {readonly: true});

// Check all ships with max_size > 5 for weapon/turret slots
console.log('=== Ships with weapon/turret max_size >= 5 ===');
const ships = db.prepare(`
  SELECT DISTINCT s.id, s.name, hp.slot_type, hp.size, hp.max_size, hp.name as hp_name
  FROM ships s
  JOIN hardpoints hp ON hp.ship_id = s.id
  WHERE hp.slot_type IN ('weapon', 'turret') AND hp.max_size >= 5
  ORDER BY s.name, hp.slot_type
`).all();

ships.forEach(h => console.log(`  ${h.name}: ${h.slot_type} size=${h.size} max_size=${h.max_size} (${h.hp_name})`));

// Check ALL weapon/turret hardpoints grouped by ship
console.log('\n=== All weapon/turret hardpoints by ship ===');
const allHps = db.prepare(`
  SELECT s.name, hp.slot_type, hp.size, hp.max_size, hp.name as hp_name
  FROM ships s
  JOIN hardpoints hp ON hp.ship_id = s.id
  WHERE hp.slot_type IN ('weapon', 'turret')
  ORDER BY s.name, hp.max_size DESC
`).all();

let currentShip = '';
allHps.forEach(h => {
  if (h.name !== currentShip) {
    currentShip = h.name;
    console.log(`\n--- ${h.name} ---`);
  }
  console.log(`  ${h.slot_type}: size=${h.size} max=${h.max_size} (${h.hp_name})`);
});

db.close();