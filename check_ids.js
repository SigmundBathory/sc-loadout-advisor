const Database = require('better-sqlite3');
const db = new Database('data/sc-loadout.db', {readonly: true});

const ships = db.prepare("SELECT id, name FROM ships WHERE name LIKE '%Hornet%Mk I%' OR name LIKE '%Gladiator%' OR name LIKE '%Buccaneer%' OR name LIKE '%M50%' OR name LIKE '%Herald%'").all();
ships.forEach(s => console.log(s.id, s.name));

db.close();