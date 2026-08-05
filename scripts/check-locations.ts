import Database from "better-sqlite3";
const db = new Database("data/sc-loadout.db");

console.log("=== HIGH RENTAL PRICES ===");
const high = db.prepare("SELECT * FROM ship_buy_locations WHERE location_type = 'rental' AND price_auec > 50000 ORDER BY price_auec DESC").all() as any[];
high.forEach(l => console.log(`  ${l.ship_name}: ${l.price_auec.toLocaleString()} @ ${l.shop_name} (${l.location_name})`));

console.log("\n=== MISSING BUY LOCATIONS (Wikelo ships without sale) ===");
const wikeloOnly = db.prepare(`
  SELECT ws.ship_name FROM wikelo_ships ws
  LEFT JOIN ship_buy_locations sbl ON sbl.ship_name = ws.ship_name AND sbl.location_type = 'sale'
  WHERE sbl.id IS NULL
`).all() as any[];
wikeloOnly.forEach(w => console.log(`  ${w.ship_name}`));

console.log("\n=== ALL RENTAL PRICES ===");
const all = db.prepare("SELECT * FROM ship_buy_locations WHERE location_type = 'rental' ORDER BY price_auec DESC").all() as any[];
all.forEach(l => console.log(`  ${l.ship_name}: ${l.price_auec.toLocaleString()} @ ${l.shop_name}`));

db.close();
