const Database = require('better-sqlite3');
const db = new Database('data/sc-loadout.db', {readonly: true});

// Check Gladiator more carefully
console.log('=== Gladiator ALL hardpoints ===');
const glad = db.prepare("SELECT id, name FROM ships WHERE name LIKE '%Gladiator%'").all();
glad.forEach(s => {
  console.log(`\n--- ${s.name} ---`);
  const hps = db.prepare("SELECT slot_type, size, max_size, name FROM hardpoints WHERE ship_id = ? ORDER BY slot_type, max_size DESC").all(s.id);
  hps.forEach(hp => console.log(`  ${hp.slot_type}: size=${hp.size} max=${hp.max_size} | ${hp.name}`));
});

// Check Arrow (should have nose gun?)
console.log('\n=== Arrow ALL hardpoints ===');
const arrow = db.prepare("SELECT id, name FROM ships WHERE name LIKE '%Arrow%' AND name NOT LIKE '%Peregrine%' AND name NOT LIKE '%Firebird%' AND name NOT LIKE '%Raven%' AND name NOT LIKE '%Comet%'").all();
arrow.forEach(s => {
  console.log(`\n--- ${s.name} ---`);
  const hps = db.prepare("SELECT slot_type, size, max_size, name FROM hardpoints WHERE ship_id = ? ORDER BY slot_type, max_size DESC").all(s.id);
  hps.forEach(hp => console.log(`  ${hp.slot_type}: size=${hp.size} max=${hp.max_size} | ${hp.name}`));
});

// Check F7A/F7C Mk I
console.log('\n=== Hornet Mk I variants ===');
const mk1 = db.prepare("SELECT id, name FROM ships WHERE name LIKE '%Mk I%' AND (name LIKE '%Hornet%' OR name LIKE '%F7A%' OR name LIKE '%F7C%')").all();
mk1.forEach(s => {
  console.log(`\n--- ${s.name} ---`);
  const hps = db.prepare("SELECT slot_type, size, max_size, name FROM hardpoints WHERE ship_id = ? ORDER BY slot_type, max_size DESC").all(s.id);
  if (hps.length === 0) console.log('  NO HARDPOINTS FOUND');
  hps.forEach(hp => console.log(`  ${hp.slot_type}: size=${hp.size} max=${hp.max_size} | ${hp.name}`));
});

// Check Buccaneer
console.log('\n=== Buccaneer ===');
const buc = db.prepare("SELECT id, name FROM ships WHERE name LIKE '%Buccaneer%'").all();
buc.forEach(s => {
  console.log(`\n--- ${s.name} ---`);
  const hps = db.prepare("SELECT slot_type, size, max_size, name FROM hardpoints WHERE ship_id = ? ORDER BY slot_type, max_size DESC").all(s.id);
  hps.forEach(hp => console.log(`  ${hp.slot_type}: size=${hp.size} max=${hp.max_size} | ${hp.name}`));
});

// Check M50/Herald more carefully
console.log('\n=== M50 Interceptor ===');
const m50 = db.prepare("SELECT id, name FROM ships WHERE name LIKE '%M50%'").all();
m50.forEach(s => {
  console.log(`\n--- ${s.name} ---`);
  const hps = db.prepare("SELECT slot_type, size, max_size, name FROM hardpoints WHERE ship_id = ? ORDER BY slot_type, max_size DESC").all(s.id);
  hps.forEach(hp => console.log(`  ${hp.slot_type}: size=${hp.size} max=${hp.max_size} | ${hp.name}`));
});

console.log('\n=== Herald ===');
const her = db.prepare("SELECT id, name FROM ships WHERE name LIKE '%Herald%'").all();
her.forEach(s => {
  console.log(`\n--- ${s.name} ---`);
  const hps = db.prepare("SELECT slot_type, size, max_size, name FROM hardpoints WHERE ship_id = ? ORDER BY slot_type, max_size DESC").all(s.id);
  hps.forEach(hp => console.log(`  ${hp.slot_type}: size=${hp.size} max=${hp.max_size} | ${hp.name}`));
});

// Check F7A Mk I
console.log('\n=== F7A Hornet Mk I ===');
const f7a = db.prepare("SELECT id, name FROM ships WHERE name = 'F7A Hornet Mk I'").get();
if (f7a) {
  const hps = db.prepare("SELECT slot_type, size, max_size, name FROM hardpoints WHERE ship_id = ? ORDER BY slot_type, max_size DESC").all(f7a.id);
  console.log(`Found ${hps.length} hardpoints`);
  hps.forEach(hp => console.log(`  ${hp.slot_type}: size=${hp.size} max=${hp.max_size} | ${hp.name}`));
} else {
  console.log('NOT FOUND');
}

// Check F7C Mk I
console.log('\n=== F7C Hornet Mk I ===');
const f7c = db.prepare("SELECT id, name FROM ships WHERE name = 'F7C Hornet Mk I'").get();
if (f7c) {
  const hps = db.prepare("SELECT slot_type, size, max_size, name FROM hardpoints WHERE ship_id = ? ORDER BY slot_type, max_size DESC").all(f7c.id);
  console.log(`Found ${hps.length} hardpoints`);
  hps.forEach(hp => console.log(`  ${hp.slot_type}: size=${hp.size} max=${hp.max_size} | ${hp.name}`));
} else {
  console.log('NOT FOUND');
}

db.close();