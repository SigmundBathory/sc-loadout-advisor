const Database = require('better-sqlite3');
const db = new Database('data/sc-loadout.db', {readonly: true});

// Check specific popular ships for accuracy
const shipsToCheck = [
  'Arrow', 'Gladius', 'Hornet', 'Sabre', 'Vanguard', 'Cutlass', 
  'Constellation', 'Freelancer', 'Razor', 'Fury', 'Hawk', 
  'Gladiator', 'Hurricane', 'Meteor', 'Nova', 'Scorpius',
  'Redeemer', 'Retaliator', 'Prowler', 'Valkyrie', 'Corsair',
  'M50', 'Herald', 'Nomad', 'Glaive', 'Khartu-al', 'Talon',
  'Scorpius', 'Perseus', 'Paladin', 'Polaris', 'Idris'
];

shipsToCheck.forEach(partialName => {
  const ships = db.prepare("SELECT id, name FROM ships WHERE name LIKE ?").all(`%${partialName}%`);
  ships.forEach(s => {
    console.log(`\n--- ${s.name} ---`);
    const hps = db.prepare("SELECT slot_type, size, max_size, name FROM hardpoints WHERE ship_id = ? AND slot_type IN ('weapon', 'turret') ORDER BY max_size DESC, slot_type").all(s.id);
    hps.forEach(hp => {
      const isMount = hp.size < hp.max_size && /turret|base|manned|remote/i.test(hp.name);
      console.log(`  ${hp.slot_type}: size=${hp.size} max=${hp.max_size} ${isMount ? '[MOUNT]' : ''} | ${hp.name}`);
    });
  });
});

db.close();