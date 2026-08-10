/**
 * Enlaza ship_buy_locations.ship_id con ships.id usando normalización de nombres
 *
 * Uso:
 *   node scripts/build-ship-aliases.js           # dry-run
 *   node scripts/build-ship-aliases.js --apply   # escribe ship_id
 */
const Database = require("better-sqlite3");
const db = new Database(process.env.DATABASE_PATH || "data/sc-loadout.db");
const APPLY = process.argv.includes("--apply");

const MANUFACTURER_PREFIXES = [
  "origin", "rsi", "misc", "aegis", "anvil", "crusader", "drake", "argo",
  "krig", "mirai", "cnou", "tumbril", "greycat", "esperia", "vanduul",
  "banu", "gatac", "xian", "aopoa", "roberts space industries", "consolidated",
];

const VARIANT_SUFFIX_RE =
  /( wikelo[\s\S]*| teach's special| pyam exec| executive edition| collector[\s\S]*| best in show edition| citizencon[\s\S]*| 2949 best in show edition)$/i;

function normalizeShipName(name) {
  let n = String(name || "").toLowerCase().trim();
  n = n.replace(VARIANT_SUFFIX_RE, "");
  for (const prefix of MANUFACTURER_PREFIXES) {
    if (n.startsWith(prefix + " ")) {
      n = n.slice(prefix.length + 1);
      break;
    }
  }
  n = n.replace(/\bmk\s*(i{1,3}|iv|v|1|2)\b/g, (m) => m.toLowerCase());

  const aliases = [
    [/^c2 starlifter$/, "c2 hercules starlifter"],
    [/^a2 starlifter$/, "a2 hercules starlifter"],
    [/^m2 starlifter$/, "m2 hercules starlifter"],
    [/^starlifter$/, "hercules starlifter"],
    [/^star fighter inferno$/, "ares star fighter inferno"],
    [/^star fighter ion$/, "ares star fighter ion"],
    [/^star fighter /, "ares star fighter "],
    [/^pisces c8 rescue$/, "c8r pisces rescue"],
    [/^pisces rescue c8r$/, "c8r pisces rescue"],
    [/^pisces c8r$/, "c8r pisces rescue"],
    [/^pisces expedition c8x$/, "c8x pisces expedition"],
    [/^pisces c8x$/, "c8x pisces expedition"],
    [/^pisces c8$/, "c8 pisces"],
    [/^aurora es mk 1$/, "aurora mk i es"],
    [/^aurora lx mk 1$/, "aurora mk i lx"],
    [/^aurora ln mk 1$/, "aurora mk i ln"],
    [/^aurora mr mk 1$/, "aurora mk i mr"],
    [/^aurora es$/, "aurora mk i es"],
    [/^aurora cl$/, "aurora mk i cl"],
    [/^aurora lx$/, "aurora mk i lx"],
    [/^aurora ln$/, "aurora mk i ln"],
    [/^aurora mr$/, "aurora mk i mr"],
    [/^hornet f7c mk 1$/, "f7c hornet mk i"],
    [/^hornet f7c mk 2$/, "f7c hornet mk ii"],
    [/^hornet f7c-r tracker mk 2$/, "f7c-r hornet tracker mk ii"],
    [/^hornet f7c-s ghost mk 1$/, "f7c-s hornet ghost mk i"],
    [/^hornet f7c-s ghost mk 2$/, "f7c-s hornet ghost mk ii"],
    [/^hornet tracker f7c-r mk 1$/, "f7c-r hornet tracker mk i"],
    [/^hornet wildfire f7c mk 1$/, "f7c hornet wildfire mk i"],
    [/^super hornet f7c-m mk 1$/, "f7c-m super hornet mk i"],
    [/^san'tok\.yai$/, "san'tok.yāi"],
    [/^san'tok\.yai/, "san'tok.yāi"],
    [/^idris p$/, "idris-p"],
    [/^idris m$/, "idris-m"],
    [/^f8c hornet mk 2$/, "f8c lightning"],
    [/^f8c lightning military$/, "f8c lightning"],
    [/^f8c lightning stealth$/, "f8c lightning"],
    [/^zeus cl$/, "zeus mk ii cl"],
    [/^zeus ex$/, "zeus mk ii es"],
    [/^zeus es$/, "zeus mk ii es"],
    [/^taurus$/, "constellation taurus"],
    [/^cyclone$/, "tumbril cyclone"],
    [/^l-21 wolf miliatary$/, "l-21 wolf"],
    [/^l-21 wolf military$/, "l-21 wolf"],
    [/^l-21 wolf stealth$/, "l-21 wolf"],
    [/^guadrian mx$/, "mirai guardian mx"],
    [/^guardian mx$/, "mirai guardian mx"],
    [/^golem teach's special$/, "golem"],
    [/^fortune teach's special$/, "misc fortune"],
    [/^mole teach's special$/, "mole"],
    [/^vulture teach's special$/, "vulture"],
    [/^nomad teach's special$/, "nomad"],
    [/^reclaimer teach's special$/, "reclaimer"],
    [/^starlancer max$/, "misc starlancer max"],
    [/^starlancer tac$/, "misc starlancer tac"],
    [/^freelancer$/, "misc freelancer"],
    [/^freelancer dur$/, "misc freelancer dur"],
    [/^freelancer max$/, "misc freelancer max"],
    [/^freelancer mis$/, "misc freelancer mis"],
    [/^prospector$/, "misc prospector"],
    [/^hull a$/, "misc hull a"],
    [/^hull c$/, "misc hull c"],
    [/^reliant kore$/, "misc reliant kore"],
    [/^reliant mako$/, "misc reliant mako"],
    [/^reliant sen$/, "misc reliant sen"],
    [/^reliant tana$/, "misc reliant tana"],
    [/^starfarer$/, "misc starfarer"],
    [/^starfarer gemini$/, "misc starfarer gemini"],
    [/^m50$/, "m50 interceptor"],
    [/^85x$/, "85x limited"],
    [/^100i$/, "origin 100i"],
    [/^600i$/, "origin 600i"],
    [/^atls itki$/, "argo atls ikti"],
    [/^atls ikti$/, "argo atls ikti"],
    [/^alts itki$/, "argo atls ikti"],
    [/^alts ikti$/, "argo atls ikti"],
    [/^atls$/, "atls geo"],
    [/^stv$/, "stv"],
    [/^aurora es mk i$/, "aurora mk i es"],
    [/^aurora mr mk i$/, "aurora mk i mr"],
    [/^aurora lx mk i$/, "aurora mk i lx"],
    [/^aurora ln mk i$/, "aurora mk i ln"],
    [/^hornet f7c mk i$/, "f7c hornet mk i"],
    [/^hornet f7c mk ii$/, "f7c hornet mk ii"],
    [/^hornet f7c-r tracker mk ii$/, "f7c-r hornet tracker mk ii"],
    [/^hornet f7c-s ghost mk i$/, "f7c-s hornet ghost mk i"],
    [/^hornet f7c-s ghost mk ii$/, "f7c-s hornet ghost mk ii"],
    [/^hornet tracker f7c-r mk i$/, "f7c-r hornet tracker mk i"],
    [/^hornet wildfire f7c mk i$/, "f7c hornet wildfire mk i"],
    [/^super hornet f7c-m mk i$/, "f7c-m super hornet mk i"],
    [/^f8c hornet mk ii$/, "f8c lightning"],
    [/^a2 hercules$/, "a2 hercules starlifter"],
    [/^c2 hercules$/, "c2 hercules starlifter"],
    [/^m2 hercules$/, "m2 hercules starlifter"],
    [/^pisces c8r rescue$/, "c8r pisces rescue"],
    [/^cvs-sm$/, "cvs-sm"],
  ];

  for (const [re, rep] of aliases) {
    n = n.replace(re, rep);
  }
  return n.replace(/\s+/g, " ").trim();
}

const ships = db.prepare("SELECT id, name FROM ships").all();
const locRows = db
  .prepare("SELECT id, ship_name, ship_id FROM ship_buy_locations WHERE ship_id IS NULL OR ship_id = ''")
  .all();

const byNormalized = new Map();
for (const s of ships) {
  const key = normalizeShipName(s.name);
  if (!key) continue;
  if (!byNormalized.has(key)) byNormalized.set(key, []);
  byNormalized.get(key).push(s.id);
}

const matched = [];
const failed = [];

for (const loc of locRows) {
  const key = normalizeShipName(loc.ship_name);
  if (!key) {
    failed.push({ loc: loc.ship_name, reason: "empty normalized key" });
    continue;
  }
  const ids = byNormalized.get(key);
  if (ids && ids.length === 1) {
    matched.push({ loc: loc.ship_name, ship: ids[0], key });
    if (APPLY) {
      db.prepare("UPDATE ship_buy_locations SET ship_id = ? WHERE id = ?").run(ids[0], loc.id);
    }
  } else if (ids && ids.length > 1) {
    const allShips = db.prepare(`SELECT id, class_name FROM ships WHERE id IN (${ids.map(() => "?").join(",")})`).all(...ids);
    const base = allShips.find((s) => !/collector|wikelo|special/i.test(s.class_name));
    const pick = (base || allShips[0]).id;
    matched.push({ loc: loc.ship_name, ship: pick, key, note: `ambiguous (${ids.length})` });
    if (APPLY) {
      db.prepare("UPDATE ship_buy_locations SET ship_id = ? WHERE id = ?").run(pick, loc.id);
    }
  } else {
    failed.push({ loc: loc.ship_name, key });
  }
}

console.log(APPLY ? "=== APPLY ===" : "=== DRY-RUN ===");
console.log(`Ubicaciones sin ship_id: ${locRows.length}`);
console.log(`Enlazadas: ${matched.length}`);
console.log(`Sin match: ${failed.length}`);

if (!APPLY) {
  console.log("\nEjemplos de enlace:");
  matched.slice(0, 20).forEach((m) => console.log(`  "${m.loc}" -> ${m.ship} [${m.key}]${m.note ? " (" + m.note + ")" : ""}`));
  console.log("\nSin match (primeros 20):");
  failed.slice(0, 20).forEach((f) => console.log(`  "${f.loc}" [${f.key || "?"}] - ${f.reason || "no match"}`));
} else {
  const remaining = db.prepare("SELECT COUNT(*) c FROM ship_buy_locations WHERE ship_id IS NULL OR ship_id = ''").get().c;
  console.log(`Restantes sin ship_id: ${remaining}`);
}

db.close();
