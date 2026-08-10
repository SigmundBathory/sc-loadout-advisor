const Database = require('better-sqlite3');
const db = new Database('data/sc-loadout.db', {readonly: true});

// Get all ships with their weapon/turret hardpoints
console.log('=== ALL SHIPS: Weapon/Turret Hardpoints ===');
const ships = db.prepare(`
  SELECT s.id, s.name, s.classification,
         hp.slot_type, hp.size, hp.max_size, hp.name as hp_name
  FROM ships s
  JOIN hardpoints hp ON hp.ship_id = s.id
  WHERE hp.slot_type IN ('weapon', 'turret')
  ORDER BY s.name, hp.slot_type, hp.max_size DESC
`).all();

let currentShip = '';
ships.forEach(h => {
  if (h.name !== currentShip) {
    currentShip = h.name;
    console.log(`\n--- ${h.name} (${h.classification}) ---`);
  }
  console.log(`  ${h.slot_type}: size=${h.size} max=${h.max_size} | ${h.hp_name}`);
});

db.close();