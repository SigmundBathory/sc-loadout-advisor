/**
 * Enlaza ship_buy_locations.ship_id con ships.id usando un match difuso
 * conservador (subconjunto de tokens normalizados) cuando el nombre exacto
 * no coincide. El JOIN en queries.ts ya prioriza sbl.ship_id = s.id, así que
 * poblar ship_id arregla el precio/ubicación de compra en el grid y la ficha
 * para todas las naves cuyos nombres difieren (p.ej. Crusader "A2 Hercules
 * Starlifter" vs ubicación "A2 Starlifter").
 *
 * Uso:
 *   node scripts/build-ship-aliases.js           # dry-run (solo cuenta)
 *   node scripts/build-ship-aliases.js --apply     # escribe ship_id
 */
const db = require("better-sqlite3")("data/sc-loadout.db");
const APPLY = process.argv.includes("--apply");

function normalize(name) {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/wikelo\s+\w+(\s+\w+)?/g, " ")
    .replace(/special|war|sneak|work|unique/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function tokens(s) {
  return new Set(s.split(" ").filter(Boolean));
}

const ships = db.prepare("SELECT id, name FROM ships").all();
const locRows = db
  .prepare("SELECT rowid, ship_name FROM ship_buy_locations WHERE ship_id IS NULL OR ship_id = ''")
  .all();

// Index de ubicaciones por primera palabra normalizada
const byFirst = {};
for (const r of locRows) {
  const t = tokens(normalize(r.ship_name));
  const first = [...t][0];
  if (!first) continue;
  if (!byFirst[first]) byFirst[first] = [];
  byFirst[first].push({ rowid: r.rowid, name: r.ship_name, toks: t });
}

const seen = new Set();
const matched = [];
const failed = [];

for (const s of ships) {
  const st = tokens(normalize(s.name));
  const first = [...st][0];
  const candidates = byFirst[first] || [];
  for (const c of candidates) {
    if (seen.has(c.rowid)) continue;
    let subset = true;
    for (const tk of c.toks) if (!st.has(tk)) { subset = false; break; }
    let common = 0;
    for (const tk of c.toks) if (st.has(tk)) common++;
    if (subset && common >= Math.min(2, c.toks.size)) {
      seen.add(c.rowid);
      matched.push({ ship: s.name, loc: c.name, shipId: s.id });
      if (APPLY) {
        db.prepare("UPDATE ship_buy_locations SET ship_id = ? WHERE rowid = ?").run(s.id, c.rowid);
      }
      break; // una ubicación por nave
    }
  }
}

console.log(APPLY ? "=== APPLY: enlazando ship_id ===" : "=== DRY-RUN (no se escribe) ===");
console.log("Ubicaciones sin ship_id:", locRows.length);
console.log("Naves enlazadas:", matched.length);
console.log("Ejemplos:");
matched.slice(0, 20).forEach((m) => console.log(`  [${m.shipId}] "${m.ship}" <=> "${m.loc}"`));

if (!APPLY) {
  const stillMissing = db
    .prepare("SELECT COUNT(*) c FROM ship_buy_locations WHERE ship_id IS NULL OR ship_id = ''")
    .get().c;
  console.log("\nUbicaciones que SEGUIRAN sin ship_id tras apply:", stillMissing - matched.length);
}
