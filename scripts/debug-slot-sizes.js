const Database = require('better-sqlite3');
const db = new Database('data/sc-loadout.db');

// 1. Check hardpoints for small ships
console.log('=== HARDPOINT SIZES FOR SMALL SHIPS ===\n');
const smallShips = db.prepare(
  "SELECT id, name, class_name FROM ships WHERE name IN ('RSI Aurora MR', 'Origin 100i', 'Anvil Pisces', 'Mustang Alpha', 'Drake Cutter')"
).all();

for (const ship of smallShips) {
  const hps = db.prepare(
    'SELECT name, slot_type, size, max_size FROM hardpoints WHERE ship_id = ?'
  ).all(ship.id);
  console.log(`${ship.name} (${ship.class_name}):`);
  for (const hp of hps) {
    console.log(`  ${hp.slot_type}: size=${hp.size} max_size=${hp.max_size} name=${hp.name}`);
  }
  console.log();
}

// 2. Check weapon sizes in components
console.log('=== WEAPON SIZE DISTRIBUTION ===\n');
const sizes = db.prepare(
  "SELECT size, COUNT(*) as cnt FROM components WHERE type = 'Weapon' GROUP BY size ORDER BY size"
).all();
for (const s of sizes) {
  console.log(`  Size ${s.size}: ${s.cnt} weapons`);
  // Show top 3 by DPS for each size
  const top = db.prepare(
    `SELECT name, size FROM components WHERE type = 'Weapon' AND size = ? ORDER BY json_extract(stats, '$.dps') DESC LIMIT 3`
  ).all(s.size);
  for (const t of top) {
    console.log(`    - ${t.name} (size ${t.size})`);
  }
}

// 3. Check max_size values for hardpoints
console.log('\n=== MAX_SIZE DISTRIBUTION IN HARDPOINTS ===\n');
const maxSizes = db.prepare(
  "SELECT max_size, COUNT(*) as cnt FROM hardpoints WHERE slot_type = 'weapon' GROUP BY max_size ORDER BY max_size"
).all();
for (const ms of maxSizes) {
  console.log(`  max_size=${ms.max_size}: ${ms.cnt} weapon slots`);
}

// 4. Check what getCompatibleComponents would return for a size-1 slot
console.log('\n=== WHAT SIZE<=1 WEAPONS LOOK LIKE ===\n');
const s1 = db.prepare(
  "SELECT name, size FROM components WHERE type = 'Weapon' AND size <= 1 LIMIT 5"
).all();
console.log(JSON.stringify(s1));

// 5. Check what getCompatibleComponents would return for a size-5 slot
console.log('\n=== WHAT SIZE<=5 WEAPONS LOOK LIKE (first 10) ===\n');
const s5 = db.prepare(
  "SELECT name, size FROM components WHERE type = 'Weapon' AND size <= 5 ORDER BY size, name LIMIT 10"
).all();
console.log(JSON.stringify(s5));

db.close();
