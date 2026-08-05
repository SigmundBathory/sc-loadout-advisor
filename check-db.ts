import Database from "better-sqlite3";
const db = new Database("data/sc-loadout.db");

console.log("=== SHIPS ===");
const ships = db.prepare("SELECT id, name, shield_hp, hull_hp, scm_speed, max_speed, image_url FROM ships LIMIT 5").all();
ships.forEach(s => console.log(s));
const withShield = db.prepare("SELECT COUNT(*) as n FROM ships WHERE shield_hp > 0").get();
const withHull = db.prepare("SELECT COUNT(*) as n FROM ships WHERE hull_hp > 0").get();
const withSpeed = db.prepare("SELECT COUNT(*) as n FROM ships WHERE scm_speed > 0").get();
const withImage = db.prepare("SELECT COUNT(*) as n FROM ships WHERE image_url != '' AND image_url IS NOT NULL").get();
console.log("shield_hp:", withShield.n, "hull_hp:", withHull.n, "speed:", withSpeed.n, "image:", withImage.n);

console.log("\n=== COMPONENTS SAMPLE ===");
const comps = db.prepare("SELECT id, name, type, stats FROM components WHERE type != 'Weapon' LIMIT 10").all();
comps.forEach(c => console.log(c.type, c.name, c.stats));

console.log("\n=== COMPONENT STATS BY TYPE ===");
const types = db.prepare("SELECT type, COUNT(*) as n FROM components GROUP BY type").all();
types.forEach(t => console.log(t.type + ":", t.n));

console.log("\n=== BUY_LOCATIONS LINKED ===");
const linked = db.prepare("SELECT COUNT(*) as n FROM buy_locations WHERE component_id != '' AND component_id IS NOT NULL").get();
const unlinked = db.prepare("SELECT COUNT(*) as n FROM buy_locations WHERE component_id = '' OR component_id IS NULL").get();
console.log("Linked:", linked.n, "Unlinked:", unlinked.n);

console.log("\n=== COMPONENT PRICES ===");
const prices = db.prepare("SELECT COUNT(*) as n FROM component_prices").get();
console.log("Price records:", prices.n);

db.close();
