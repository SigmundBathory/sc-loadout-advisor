import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

function resolveDbPath(): string {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;

  const projectRoot = path.resolve(/*turbopackIgnore: true*/ process.cwd());
  const candidates = [
    path.join(projectRoot, "data", "sc-loadout.db"),
    path.join(projectRoot, ".next", "standalone", "data", "sc-loadout.db"),
  ];

  for (const p of candidates) {
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) return p;
  }

  return candidates[0];
}

const DB_PATH = resolveDbPath();

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
    CREATE TABLE IF NOT EXISTS app_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

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
      price REAL DEFAULT NULL,
      source TEXT NOT NULL DEFAULT 'legacy_unverified'
    );

    CREATE TABLE IF NOT EXISTS component_prices (
      component_id TEXT NOT NULL,
      price_auec REAL DEFAULT NULL,
      updated_at TEXT DEFAULT '',
      source TEXT NOT NULL DEFAULT 'legacy_unverified',
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
      ship_id TEXT DEFAULT '',
      price_auec REAL DEFAULT NULL,
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
    CREATE INDEX IF NOT EXISTS idx_ship_buy_locations_ship ON ship_buy_locations(ship_id);
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
  const sblCols = (db.prepare("PRAGMA table_info(ship_buy_locations)").all() as any[]).map((c) => c.name);
  if (!sblCols.includes("ship_id")) {
    db.exec("ALTER TABLE ship_buy_locations ADD COLUMN ship_id TEXT DEFAULT ''");
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

  // Preserve existing purchase data, but make its provenance explicit. Older
  // databases predate the source columns and therefore cannot be treated as
  // observed until the next trusted sync refreshes them.
  const locationCols = (db.prepare("PRAGMA table_info(buy_locations)").all() as any[]).map((c) => c.name);
  if (!locationCols.includes("source")) {
    db.exec("ALTER TABLE buy_locations ADD COLUMN source TEXT NOT NULL DEFAULT 'legacy_unverified'");
  }
  db.prepare("UPDATE buy_locations SET source = 'legacy_unverified' WHERE source IS NULL OR source = ''").run();

  const priceCols = (db.prepare("PRAGMA table_info(component_prices)").all() as any[]).map((c) => c.name);
  if (!priceCols.includes("source")) {
    db.exec("ALTER TABLE component_prices ADD COLUMN source TEXT NOT NULL DEFAULT 'legacy_unverified'");
  }
  db.prepare("UPDATE component_prices SET source = 'legacy_unverified' WHERE source IS NULL OR source = ''").run();
}

/**
 * Kept for compatibility with existing sync callers. It intentionally does
 * not manufacture prices or locations when an upstream source is incomplete.
 * However, it will apply fallback estimates for critical stats that are needed
 * for the optimizer to function properly.
 */
export function seedMissingPricesAndLocations(db: InstanceType<typeof Database>): void {
  // Apply fallback estimates for components with missing critical stats
  const components = db.prepare(`
    SELECT id, type, size, stats, class_name 
    FROM components 
    WHERE stats IS NULL OR stats = '{}' OR
          (type = 'Shield' AND (stats NOT LIKE '%"hp"%' OR stats NOT LIKE '%"regen_rate"%')) OR
          (type = 'PowerPlant' AND stats NOT LIKE '%"output"%') OR
          (type = 'Cooler' AND stats NOT LIKE '%"cooling_rate"%') OR
          (type = 'QuantumDrive' AND (stats NOT LIKE '%"travel_speed"%' OR stats NOT LIKE '%"quantum_fuel_claimed"%'))
    LIMIT 1000
  `).all() as any[];
  
  if (components.length === 0) return;
  
  console.log(`Applying fallback estimates for ${components.length} components with missing stats...`);
  
  const updateStmt = db.prepare(`UPDATE components SET stats = ? WHERE id = ?`);
  
  for (const comp of components) {
    try {
      let stats = comp.stats ? JSON.parse(comp.stats) : {};
      const compType = comp.type;
      const size = comp.size || 1;
      
      // Apply fallback estimates based on type and size
      if (compType === "Shield") {
        if (!stats.hp || stats.hp === 0) {
          const baseHp: Record<number, number> = { 1: 2500, 2: 15000, 3: 150000, 4: 350000 };
          stats.hp = baseHp[size] || baseHp[3];
          stats.max_hp = stats.hp;
        }
        if (!stats.regen_rate || stats.regen_rate === 0) {
          const baseRegen: Record<number, number> = { 1: 500, 2: 3500, 3: 25000, 4: 60000 };
          stats.regen_rate = baseRegen[size] || baseRegen[3];
        }
      } else if (compType === "PowerPlant") {
        if (!stats.output || stats.output === 0) {
          const baseOutput: Record<number, number> = { 1: 5000, 2: 25000, 3: 200000, 4: 500000 };
          stats.output = baseOutput[size] || baseOutput[3];
        }
      } else if (compType === "Cooler") {
        if (!stats.cooling_rate || stats.cooling_rate === 0) {
          const baseCooling: Record<number, number> = { 1: 1000000, 2: 5000000, 3: 30000000, 4: 100000000 };
          stats.cooling_rate = baseCooling[size] || baseCooling[3];
        }
      } else if (compType === "QuantumDrive") {
        if (!stats.travel_speed || stats.travel_speed === 0) {
          const baseSpeed: Record<number, number> = { 1: 150000, 2: 250000, 3: 300000, 4: 400000 };
          stats.travel_speed = (baseSpeed[size] || baseSpeed[3]) * 1000;
        }
        if (!stats.quantum_fuel_claimed || stats.quantum_fuel_claimed === 0) {
          const baseFuel: Record<number, number> = { 1: 580, 2: 2500, 3: 10000, 4: 100000 };
          stats.quantum_fuel_claimed = baseFuel[size] || baseFuel[3];
        }
      }
      
      updateStmt.run([JSON.stringify(stats), comp.id]);
    } catch (e) {
      console.warn(`Failed to apply fallback estimates for ${comp.class_name}:`, e);
    }
  }
  
  console.log(`Applied fallback estimates for ${components.length} components`);
}


export default getDb;

