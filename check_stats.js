const Database = require('better-sqlite3');
const db = new Database('data/sc-loadout.db', {readonly: true});

console.log('=== Max DPS per weapon size ===');
for (let s = 1; s <= 10; s++) {
  const row = db.prepare("SELECT MAX(json_extract(stats, '$.dps')) as maxDps FROM components WHERE type='Weapon' AND size=?").get(s);
  if (row.maxDps) console.log('  Size ' + s + ': max DPS=' + row.maxDps);
}

console.log('\n=== Max Shield HP per size ===');
for (let s = 1; s <= 4; s++) {
  const row = db.prepare("SELECT MAX(json_extract(stats, '$.hp')) as maxHp, MAX(json_extract(stats, '$.regen_rate')) as maxRegen FROM components WHERE type='Shield' AND size=?").get(s);
  if (row.maxHp) console.log('  Size ' + s + ': max HP=' + row.maxHp + ' maxRegen=' + row.maxRegen);
}

console.log('\n=== Max PowerPlant output per size ===');
for (let s = 1; s <= 4; s++) {
  const row = db.prepare("SELECT MAX(json_extract(stats, '$.output')) as maxOut FROM components WHERE type='PowerPlant' AND size=?").get(s);
  if (row.maxOut) console.log('  Size ' + s + ': max output=' + row.maxOut);
}

console.log('\n=== PowerPlant: output vs power_segment_generation ===');
const pp = db.prepare("SELECT name, size, json_extract(stats, '$.output') as output, json_extract(stats, '$.power_segment_generation') as psg FROM components WHERE type='PowerPlant' ORDER BY output DESC LIMIT 10").all();
pp.forEach(p => console.log('  ' + p.name + ' (S' + p.size + '): output=' + p.output + ' psg=' + p.psg));

console.log('\n=== What Constellation can equip (weapon slots) ===');
const ship = db.prepare("SELECT hardpoints FROM ships WHERE name LIKE '%Andromeda%'").get();
const hps = JSON.parse(ship.hardpoints);
hps.forEach(hp => console.log('  ' + hp.slot_type + ' size=' + hp.size + ' max=' + hp.max_size));

db.close();
