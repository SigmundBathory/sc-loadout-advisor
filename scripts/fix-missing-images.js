const Database = require('better-sqlite3');

const db = new Database('data/sc-loadout.db', { readonly: false });

const missing = db.prepare("SELECT id, name, class_name FROM ships WHERE image_url IS NULL OR image_url = ''").all();
console.log(`Found ${missing.length} ships without image in DB`);

if (missing.length === 0) {
  console.log("All ships have images. Nothing to fix.");
  db.close();
  process.exit(0);
}

const SUFFIXES = [
  [/_Collector_\w+$/i], [/_Exec_\w+$/i], [/_BTALA$/i], [/_Showdown$/i],
  [/_Military$/i], [/_Industrial$/i], [/_Stealth$/i], [/_Medic$/i], [/_Mod$/i],
  [/_Competition$/i], [/_Grad02$/i], [/_Indust$/i], [/_Milt$/i], [/_Civet$/i],
  [/_Civilian$/i], [/_IKTI_ARGOS$/i], [/_IKTI$/i], [/_Argos$/i],
  [/CitizenCon\d+$/i],
];

const EXTRA_BASES = {
  'ANVL_Lightning_F8C': 'ANVL_Lightning_F8C_Exec',
  'AEGS_Hammerhead': 'AEGS_Hammerhead_GS',
  'AEGS_Idris_P': 'AEGS_Idris_P_TSG',
};

function resolveBase(cn) {
  let base = cn;
  for (const [pat] of SUFFIXES) {
    base = base.replace(pat, '');
  }
  if (base !== cn && base.length > 3) return base;
  for (const [key, val] of Object.entries(EXTRA_BASES)) {
    if (cn.startsWith(key)) return val;
  }
  return null;
}

const baseStmt = db.prepare("SELECT image_url FROM ships WHERE class_name = ? AND image_url IS NOT NULL AND image_url != '' LIMIT 1");
const updateStmt = db.prepare("UPDATE ships SET image_url = ? WHERE id = ?");

let fixed = 0;
for (const ship of missing) {
  const base = resolveBase(ship.class_name);
  if (base) {
    const row = baseStmt.get(base);
    if (row && row.image_url) {
      updateStmt.run(row.image_url, ship.id);
      fixed++;
      console.log(`  FIXED: ${ship.name} (${ship.class_name}) <- ${base}`);
      continue;
    }
  }
  console.log(`  SKIP: ${ship.name} (${ship.class_name})`);
}

console.log(`\nFixed: ${fixed}/${missing.length}`);
db.close();
