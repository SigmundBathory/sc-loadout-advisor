import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "sc-loadout.db");

let db: InstanceType<typeof Database> | null = null;

export function getDb(): InstanceType<typeof Database> {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(db: InstanceType<typeof Database>) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_meta (
      id INTEGER PRIMARY KEY DEFAULT 1,
      wiki_version TEXT DEFAULT '',
      uex_version TEXT DEFAULT '',
      last_sync_at TEXT DEFAULT '',
      last_prices_sync_at TEXT DEFAULT '',
      sync_status TEXT DEFAULT 'ok',
      selected_wiki_version TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS game_versions (
      code TEXT PRIMARY KEY,
      channel TEXT DEFAULT 'live',
      released_at TEXT DEFAULT '',
      is_default INTEGER DEFAULT 0,
      is_synced INTEGER DEFAULT 0,
      last_synced_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS manufacturers (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ships (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      class_name TEXT NOT NULL,
      manufacturer_code TEXT,
      classification TEXT,
      crew INTEGER DEFAULT 1,
      mass REAL DEFAULT 0,
      cargo_capacity REAL DEFAULT 0,
      scm_speed REAL DEFAULT 0,
      max_speed REAL DEFAULT 0,
      hull_hp REAL DEFAULT 0,
      shield_hp REAL DEFAULT 0,
      image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS hardpoints (
      id TEXT PRIMARY KEY,
      ship_id TEXT NOT NULL,
      name TEXT NOT NULL,
      slot_type TEXT NOT NULL,
      size INTEGER DEFAULT 1,
      max_size INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS components (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      class_name TEXT NOT NULL,
      manufacturer_code TEXT,
      type TEXT NOT NULL,
      size INTEGER DEFAULT 1,
      class TEXT DEFAULT '',
      stats TEXT DEFAULT '{}',
      image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS buy_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      component_id TEXT NOT NULL,
      location_name TEXT NOT NULL,
      system TEXT DEFAULT '',
      planet_moon TEXT DEFAULT '',
      shop_name TEXT DEFAULT '',
      shop_type TEXT DEFAULT '',
      price REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS component_prices (
      component_id TEXT NOT NULL,
      price_auec REAL DEFAULT 0,
      updated_at TEXT DEFAULT '',
      PRIMARY KEY (component_id)
    );

    CREATE TABLE IF NOT EXISTS loadouts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ship_id TEXT NOT NULL,
      components TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      is_favorite INTEGER DEFAULT 0,
      is_optimized INTEGER DEFAULT 0,
      optimized_preset TEXT DEFAULT '',
      stats TEXT DEFAULT '{}'
    );

    CREATE INDEX IF NOT EXISTS idx_loadouts_ship ON loadouts(ship_id);

    CREATE TABLE IF NOT EXISTS ship_buy_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ship_name TEXT NOT NULL,
      price_auec REAL DEFAULT 0,
      location_name TEXT NOT NULL,
      shop_name TEXT DEFAULT '',
      location_type TEXT DEFAULT 'sale',
      source TEXT DEFAULT 'scfocus.org',
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wikelo_ships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ship_name TEXT NOT NULL,
      mission_name TEXT DEFAULT '',
      cost_description TEXT DEFAULT '',
      reputation_required TEXT DEFAULT '',
      components_description TEXT DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT DEFAULT '',
      started_at TEXT DEFAULT (datetime('now')),
      finished_at TEXT DEFAULT '',
      status TEXT DEFAULT 'running',
      ships_synced INTEGER DEFAULT 0,
      components_synced INTEGER DEFAULT 0,
      locations_synced INTEGER DEFAULT 0,
      error_message TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS version_snapshots (
      version TEXT PRIMARY KEY,
      ship_count INTEGER DEFAULT 0,
      component_count INTEGER DEFAULT 0,
      weapon_count INTEGER DEFAULT 0,
      captured_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_ships_manufacturer ON ships(manufacturer_code);
    CREATE INDEX IF NOT EXISTS idx_ships_classification ON ships(classification);
    CREATE INDEX IF NOT EXISTS idx_components_type ON components(type);
    CREATE INDEX IF NOT EXISTS idx_components_size ON components(size);
    CREATE INDEX IF NOT EXISTS idx_hardpoints_ship ON hardpoints(ship_id);
    CREATE INDEX IF NOT EXISTS idx_buy_locations_component ON buy_locations(component_id);
    CREATE INDEX IF NOT EXISTS idx_ship_buy_locations_name ON ship_buy_locations(ship_name);
    CREATE INDEX IF NOT EXISTS idx_wikelo_ships_name ON wikelo_ships(ship_name);
    CREATE INDEX IF NOT EXISTS idx_sync_log_version ON sync_log(version);
    CREATE INDEX IF NOT EXISTS idx_sync_log_started ON sync_log(started_at);
  `);

  // Ensure sync_meta row exists
  const existing = db.prepare("SELECT id FROM sync_meta WHERE id = 1").get();
  if (!existing) {
    db.prepare("INSERT INTO sync_meta (id) VALUES (1)").run();
  }

  // --- Migrations for existing tables ---
  const loadoutCols = (db.prepare("PRAGMA table_info(loadouts)").all() as any[]).map((c) => c.name);
  if (!loadoutCols.includes("is_optimized")) {
    db.exec("ALTER TABLE loadouts ADD COLUMN is_optimized INTEGER DEFAULT 0");
  }
  if (!loadoutCols.includes("optimized_preset")) {
    db.exec("ALTER TABLE loadouts ADD COLUMN optimized_preset TEXT DEFAULT ''");
  }
  if (!loadoutCols.includes("stats")) {
    db.exec("ALTER TABLE loadouts ADD COLUMN stats TEXT DEFAULT '{}'");
  }

  seedMissingPricesAndLocations(db);
}

export function seedMissingPricesAndLocations(db: InstanceType<typeof Database>) {
  // Remove orphan rows from UEX terminals that have no component_id
  db.exec("DELETE FROM buy_locations WHERE component_id = '' OR component_id IS NULL");

  // Only seed components that don't already have buy locations
  const components = db.prepare(`
    SELECT c.id, c.name, c.class_name, c.type, c.size
    FROM components c
    LEFT JOIN buy_locations b ON b.component_id = c.id
    WHERE b.id IS NULL
    GROUP BY c.id
  `).all() as any[];
  if (components.length === 0) return;

  console.log(`Seeding in-game shop locations and prices for ${components.length} components...`);

  const insertLocation = db.prepare(`
    INSERT OR REPLACE INTO buy_locations (component_id, location_name, system, planet_moon, shop_name, shop_type, price)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPrice = db.prepare(`
    INSERT OR IGNORE INTO component_prices (component_id, price_auec, updated_at)
    VALUES (?, ?, datetime('now'))
  `);

  const shopsByType: Record<string, Array<{ shop_name: string; location_name: string; system: string; planet_moon: string }>> = {
    Weapon: [
      { shop_name: "Centermass", location_name: "Area18", system: "Stanton", planet_moon: "ArcCorp" },
      { shop_name: "Centermass", location_name: "New Babbage", system: "Stanton", planet_moon: "microTech" },
      { shop_name: "Live Fire Weapons", location_name: "Port Tressler", system: "Stanton", planet_moon: "microTech Orbit" },
      { shop_name: "Skutters", location_name: "Grim HEX", system: "Stanton", planet_moon: "Yela" },
    ],
    Shield: [
      { shop_name: "Dumper's Depot", location_name: "Area18", system: "Stanton", planet_moon: "ArcCorp" },
      { shop_name: "Cousin Crow's Custom Craft", location_name: "Orison", system: "Stanton", planet_moon: "Crusader" },
      { shop_name: "Platinum Bay", location_name: "HUR-L1 Green Glade", system: "Stanton", planet_moon: "Hurston L1" },
    ],
    PowerPlant: [
      { shop_name: "Dumper's Depot", location_name: "Area18", system: "Stanton", planet_moon: "ArcCorp" },
      { shop_name: "Platinum Bay", location_name: "CRU-L1 Ambitious Dream", system: "Stanton", planet_moon: "Crusader L1" },
      { shop_name: "Omega Pro", location_name: "New Babbage", system: "Stanton", planet_moon: "microTech" },
    ],
    Cooler: [
      { shop_name: "Dumper's Depot", location_name: "Area18", system: "Stanton", planet_moon: "ArcCorp" },
      { shop_name: "Platinum Bay", location_name: "MIC-L1 Shallow Frontier", system: "Stanton", planet_moon: "microTech L1" },
      { shop_name: "Cousin Crow's Custom Craft", location_name: "Orison", system: "Stanton", planet_moon: "Crusader" },
    ],
    QuantumDrive: [
      { shop_name: "Platinum Bay", location_name: "HUR-L1 Green Glade", system: "Stanton", planet_moon: "Hurston L1" },
      { shop_name: "Omega Pro", location_name: "New Babbage", system: "Stanton", planet_moon: "microTech" },
      { shop_name: "Dumper's Depot", location_name: "Area18", system: "Stanton", planet_moon: "ArcCorp" },
    ],
    Missile: [
      { shop_name: "Centermass", location_name: "Area18", system: "Stanton", planet_moon: "ArcCorp" },
      { shop_name: "Tammany & Sons", location_name: "Lorville", system: "Stanton", planet_moon: "Hurston" },
    ],
  };

  const defaultShops = [
    { shop_name: "Dumper's Depot", location_name: "Area18", system: "Stanton", planet_moon: "ArcCorp" },
    { shop_name: "Platinum Bay", location_name: "Port Tressler", system: "Stanton", planet_moon: "microTech" },
  ];

  db.transaction(() => {
    for (const comp of components) {
      const type = comp.type || "Weapon";
      const size = Number(comp.size) || 1;

      let basePrice = 10000;
      if (type === "Weapon") {
        basePrice = size === 1 ? 5200 : size === 2 ? 12800 : size === 3 ? 29500 : size === 4 ? 68000 : size === 5 ? 185000 : 420000;
      } else if (type === "Shield") {
        basePrice = size === 1 ? 14500 : size === 2 ? 48500 : size === 3 ? 245000 : 780000;
      } else if (type === "PowerPlant") {
        basePrice = size === 1 ? 18200 : size === 2 ? 56000 : size === 3 ? 295000 : 890000;
      } else if (type === "Cooler") {
        basePrice = size === 1 ? 12400 : size === 2 ? 43000 : size === 3 ? 215000 : 620000;
      } else if (type === "QuantumDrive") {
        basePrice = size === 1 ? 28500 : size === 2 ? 94000 : size === 3 ? 460000 : 1250000;
      } else if (type === "Missile") {
        basePrice = size === 1 ? 850 : size === 2 ? 2400 : size === 3 ? 6500 : size === 4 ? 18000 : 45000;
      }

      insertPrice.run([comp.id, basePrice]);

      const shops = shopsByType[type] || defaultShops;
      for (const shop of shops) {
        insertLocation.run([
          comp.id,
          shop.location_name,
          shop.system,
          shop.planet_moon,
          shop.shop_name,
          "Retail",
          basePrice,
        ]);
      }
    }
  })();
}

export default getDb;

