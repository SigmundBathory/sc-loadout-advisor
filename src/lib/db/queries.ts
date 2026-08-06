import { getDb } from "./schema";
import type { Ship, Hardpoint, Component, BuyLocation, Loadout } from "../types";

// ==================== SHIPS ====================

export function getAllShips(filters?: {
  manufacturer?: string;
  classification?: string;
  search?: string;
}): Ship[] {
  const db = getDb();
  let query = `
    SELECT s.*, m.name as manufacturer_name, m.code as manufacturer_code,
           MIN(CASE WHEN sbl.location_type = 'sale' THEN sbl.price_auec END) as price_auec,
           MAX(CASE WHEN sbl.ship_name IS NOT NULL THEN 1 ELSE 0 END) as is_buyable
    FROM ships s
    LEFT JOIN manufacturers m ON s.manufacturer_code = m.code
    LEFT JOIN ship_buy_locations sbl ON sbl.ship_name = s.name
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.manufacturer) {
    query += " AND s.manufacturer_code = ?";
    params.push(filters.manufacturer);
  }
  if (filters?.classification) {
    query += " AND s.classification = ?";
    params.push(filters.classification);
  }
  if (filters?.search) {
    query += " AND (s.name LIKE ? OR s.class_name LIKE ? OR m.name LIKE ?)";
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }

  query += " GROUP BY s.id ORDER BY s.name";

  const rows = db.prepare(query).all(params) as any[];
  return rows.map(mapShipRow);
}

export function getShipById(id: string): Ship | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT s.*, m.name as manufacturer_name, m.code as manufacturer_code
       FROM ships s
       LEFT JOIN manufacturers m ON s.manufacturer_code = m.code
       WHERE s.id = ? OR s.class_name = ?`
    )
    .get([id, id]) as any;

  if (!row) return null;

  const ship = mapShipRow(row);
  ship.hardpoints = getHardpointsByShip(id);
  return ship;
}

function getHardpointsByShip(shipId: string): Hardpoint[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM hardpoints WHERE ship_id = ?")
    .all(shipId) as any[];
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    slot_type: r.slot_type,
    size: r.size,
    max_size: r.max_size,
    component_id: r.component_id || undefined,
  }));
}

function mapShipRow(row: any): Ship {
  return {
    id: row.id,
    name: row.name,
    class_name: row.class_name,
    manufacturer: {
      name: row.manufacturer_name || "",
      code: row.manufacturer_code || "",
    },
    classification: row.classification || "",
    crew: row.crew || 1,
    mass: row.mass || 0,
    cargo_capacity: row.cargo_capacity || 0,
    scm_speed: row.scm_speed || 0,
    max_speed: row.max_speed || 0,
    hull_hp: row.hull_hp || 0,
    shield_hp: row.shield_hp || 0,
    image_url: row.image_url || undefined,
    hardpoints: [],
    dps: row.dps ? Number(row.dps) : undefined,
    price_auec: row.price_auec ? Number(row.price_auec) : undefined,
    is_buyable: row.is_buyable ? true : false,
  };
}

// ==================== COMPONENTS ====================

export function getAllComponents(filters?: {
  type?: string;
  size?: number;
  manufacturer?: string;
  search?: string;
}): Component[] {
  const db = getDb();
  let query = `
    SELECT c.*, m.name as manufacturer_name, m.code as manufacturer_code,
           cp.price_auec
    FROM components c
    LEFT JOIN manufacturers m ON c.manufacturer_code = m.code
    LEFT JOIN component_prices cp ON c.id = cp.component_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.type) {
    query += " AND c.type = ?";
    params.push(filters.type);
  }
  if (filters?.size) {
    query += " AND c.size = ?";
    params.push(filters.size);
  }
  if (filters?.manufacturer) {
    query += " AND c.manufacturer_code = ?";
    params.push(filters.manufacturer);
  }
  if (filters?.search) {
    query += " AND (c.name LIKE ? OR c.class_name LIKE ?)";
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  query += " ORDER BY c.name";

  const rows = db.prepare(query).all(params) as any[];
  return rows.map(mapComponentRow);
}

export function getComponentById(id: string): Component | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT c.*, m.name as manufacturer_name, m.code as manufacturer_code,
              cp.price_auec
       FROM components c
       LEFT JOIN manufacturers m ON c.manufacturer_code = m.code
       LEFT JOIN component_prices cp ON c.id = cp.component_id
       WHERE c.id = ? OR c.class_name = ?`
    )
    .get([id, id]) as any;

  if (!row) return null;

  const component = mapComponentRow(row);
  component.buy_locations = getBuyLocationsByComponent(id);
  return component;
}

export function getComponentsByIds(ids: string[]): Component[] {
  if (ids.length === 0) return [];
  const db = getDb();
  const placeholders = ids.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT c.*, m.name as manufacturer_name, m.code as manufacturer_code,
              cp.price_auec
       FROM components c
       LEFT JOIN manufacturers m ON c.manufacturer_code = m.code
       LEFT JOIN component_prices cp ON c.id = cp.component_id
       WHERE c.id IN (${placeholders})`
    )
    .all(ids) as any[];
  const comps = rows.map(mapComponentRow);
  return attachBuyLocations(comps);
}

export function getCompatibleComponents(
  shipId: string,
  slotType: string,
  slotSize: number
): Component[] {
  const db = getDb();

  const slotTypeMap: Record<string, string> = {
    weapon: "Weapon",
    turret: "Weapon",
    shield: "Shield",
    power_plant: "PowerPlant",
    powerplant: "PowerPlant",
    cooler: "Cooler",
    quantum_drive: "QuantumDrive",
    quantumdrive: "QuantumDrive",
    missile: "Weapon",
    radar: "Radar",
    thruster: "FlightController",
    flight_controller: "FlightController",
    life_support: "LifeSupport",
    lifesupport: "LifeSupport",
  };

  const componentType = slotTypeMap[slotType.toLowerCase()] || slotType;
  // Utility / cosmetic slots have no compatible components
  if (componentType === "utility") return [];

  const rows = db
    .prepare(
      `SELECT c.*, m.name as manufacturer_name, m.code as manufacturer_code,
              cp.price_auec
       FROM components c
       LEFT JOIN manufacturers m ON c.manufacturer_code = m.code
       LEFT JOIN component_prices cp ON c.id = cp.component_id
       WHERE c.type = ? AND c.size <= ?
       ORDER BY c.name`
    )
    .all([componentType, slotSize]) as any[];

  const comps = rows.map(mapComponentRow);
  return attachBuyLocations(comps);
}

export function attachBuyLocations(components: Component[]): Component[] {
  if (components.length === 0) return components;
  const db = getDb();
  const ids = components.map((c) => c.id);
  const placeholders = ids.map(() => "?").join(",");
  const rows = db
    .prepare(`SELECT * FROM buy_locations WHERE component_id IN (${placeholders})`)
    .all(ids) as any[];

  const locMap = new Map<string, BuyLocation[]>();
  for (const r of rows) {
    const list = locMap.get(r.component_id) || [];
    list.push({
      location_name: r.location_name,
      system: r.system,
      planet_moon: r.planet_moon,
      shop_name: r.shop_name,
      shop_type: r.shop_type,
      price: r.price,
    });
    locMap.set(r.component_id, list);
  }

  for (const c of components) {
    c.buy_locations = locMap.get(c.id) || [];
  }
  return components;
}


function getBuyLocationsByComponent(componentId: string): BuyLocation[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM buy_locations WHERE component_id = ?")
    .all(componentId) as any[];
  return rows.map((r: any) => ({
    location_name: r.location_name,
    system: r.system,
    planet_moon: r.planet_moon,
    shop_name: r.shop_name,
    shop_type: r.shop_type,
    price: r.price,
  }));
}

function mapComponentRow(row: any): Component {
  let stats = {};
  try {
    stats = JSON.parse(row.stats || "{}");
  } catch {}

  return {
    id: row.id,
    name: row.name,
    class_name: row.class_name,
    manufacturer: {
      name: row.manufacturer_name || "",
      code: row.manufacturer_code || "",
    },
    type: row.type,
    size: row.size || 1,
    class: row.class || "",
    stats,
    price_auec: row.price_auec || undefined,
    buy_locations: [],
    image_url: row.image_url || undefined,
  };
}

// ==================== LOADOUTS ====================

export function getAllLoadouts(): Loadout[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM loadouts ORDER BY updated_at DESC").all() as any[];
  return rows.map(mapLoadoutRow);
}

export function getLoadoutById(id: string): Loadout | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM loadouts WHERE id = ?").get(id) as any;
  if (!row) return null;
  return mapLoadoutRow(row);
}

export function createLoadout(
  name: string,
  shipId: string,
  components: Record<string, string> = {},
  options?: { is_optimized?: boolean; optimized_preset?: string; stats?: any }
): Loadout {
  const db = getDb();
  const id = `loadout_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO loadouts (id, name, ship_id, components, created_at, updated_at, is_optimized, optimized_preset, stats)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run([
    id,
    name,
    shipId,
    JSON.stringify(components),
    now,
    now,
    options?.is_optimized ? 1 : 0,
    options?.optimized_preset || "",
    JSON.stringify(options?.stats || {}),
  ]);

  return {
    id,
    name,
    ship_id: shipId,
    components,
    created_at: now,
    updated_at: now,
    is_favorite: false,
    is_optimized: options?.is_optimized,
    optimized_preset: options?.optimized_preset,
    stats: options?.stats,
  };
}

export function getLoadoutsByShip(shipId: string): Loadout[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM loadouts WHERE ship_id = ? ORDER BY updated_at DESC")
    .all(shipId) as any[];
  return rows.map(mapLoadoutRow);
}

export function updateLoadout(
  id: string,
  updates: Partial<Pick<Loadout, "name" | "components" | "is_favorite" | "is_optimized" | "optimized_preset" | "stats">>
): Loadout | null {
  const db = getDb();
  const existing = getLoadoutById(id);
  if (!existing) return null;

  const name = updates.name ?? existing.name;
  const components = updates.components
    ? JSON.stringify(updates.components)
    : JSON.stringify(existing.components);
  const isFavorite = updates.is_favorite ?? existing.is_favorite;
  const isOptimized = updates.is_optimized ?? existing.is_optimized ?? false;
  const preset = updates.optimized_preset ?? existing.optimized_preset ?? "";
  const stats = updates.stats !== undefined
    ? JSON.stringify(updates.stats)
    : JSON.stringify(existing.stats || {});
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE loadouts SET name = ?, components = ?, is_favorite = ?, is_optimized = ?, optimized_preset = ?, stats = ?, updated_at = ? WHERE id = ?`
  ).run([name, components, isFavorite ? 1 : 0, isOptimized ? 1 : 0, preset, stats, now, id]);

  return getLoadoutById(id)!;
}

export function deleteLoadout(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM loadouts WHERE id = ?").run([id]);
  return result.changes > 0;
}

function mapLoadoutRow(row: any): Loadout {
  let components = {};
  try {
    components = JSON.parse(row.components || "{}");
  } catch {}
  let stats: any = {};
  try {
    stats = JSON.parse(row.stats || "{}");
  } catch {}
  return {
    id: row.id,
    name: row.name,
    ship_id: row.ship_id,
    components,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_favorite: !!row.is_favorite,
    is_optimized: !!row.is_optimized,
    optimized_preset: row.optimized_preset || "",
    stats,
  };
}

// ==================== MANUFACTURERS ====================

export function getAllManufacturers(): { code: string; name: string }[] {
  const db = getDb();
  return db.prepare("SELECT * FROM manufacturers ORDER BY name").all() as any[];
}

export function getClassifications(): string[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT DISTINCT classification FROM ships WHERE classification != '' ORDER BY classification")
    .all() as any[];
  return rows.map((r: any) => r.classification);
}

// ==================== DASHBOARD ====================

export function getDashboardStats() {
  const db = getDb();
  const ships = (db.prepare("SELECT COUNT(*) as c FROM ships").get() as any)?.c || 0;
  const components = (db.prepare("SELECT COUNT(*) as c FROM components").get() as any)?.c || 0;
  const manufacturers = (db.prepare("SELECT COUNT(*) as c FROM manufacturers").get() as any)?.c || 0;
  const loadouts = (db.prepare("SELECT COUNT(*) as c FROM loadouts").get() as any)?.c || 0;
  const meta = db.prepare("SELECT * FROM sync_meta WHERE id = 1").get() as any;
  return { ships, components, manufacturers, loadouts, meta };
}

export function getTopShipsByDps(limit: number = 5) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT s.id, s.name, s.classification, s.image_url,
           (SELECT COUNT(*) FROM hardpoints WHERE ship_id = s.id AND slot_type = 'weapon') * 800 as dps
    FROM ships s
    WHERE s.hull_hp > 0
    ORDER BY dps DESC, s.name
    LIMIT ?
  `).all([limit]) as any[];
  return rows;
}

export function getManufacturerDistribution() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT m.name, COUNT(s.id) as count
    FROM ships s
    JOIN manufacturers m ON s.manufacturer_code = m.code
    GROUP BY m.name
    ORDER BY count DESC
    LIMIT 8
  `).all() as any[];
  return rows;
}

export function getRecentLoadouts(limit: number = 4) {
  const db = getDb();
  return db.prepare(`
    SELECT l.*, s.name as ship_name
    FROM loadouts l
    LEFT JOIN ships s ON l.ship_id = s.id
    ORDER BY l.updated_at DESC
    LIMIT ?
  `).all([limit]) as any[];
}

export function getShipCountByClassification() {
  const db = getDb();
  return db.prepare(`
    SELECT classification, COUNT(*) as count
    FROM ships
    WHERE classification != ''
    GROUP BY classification
    ORDER BY count DESC
  `).all() as any[];
}

export function getShipsWithDps(filters?: {
  manufacturer?: string;
  classification?: string;
  search?: string;
}) {
  const db = getDb();
  // Calculate DPS based on weapon slot count only (simpler and more accurate)
  let query = `
    SELECT s.*, m.name as manufacturer_name, m.code as manufacturer_code,
           (SELECT COUNT(*) FROM hardpoints WHERE ship_id = s.id AND slot_type = 'weapon') * 800 as dps
    FROM ships s
    LEFT JOIN manufacturers m ON s.manufacturer_code = m.code
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.manufacturer) {
    query += " AND s.manufacturer_code = ?";
    params.push(filters.manufacturer);
  }
  if (filters?.classification) {
    query += " AND s.classification = ?";
    params.push(filters.classification);
  }
  if (filters?.search) {
    query += " AND (s.name LIKE ? OR s.class_name LIKE ? OR m.name LIKE ?)";
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }

  query += " ORDER BY dps DESC, s.name";

  const rows = db.prepare(query).all(params) as any[];
  return rows.map(mapShipRow);
}

// ==================== SHIP BUY/RENT LOCATIONS ====================

export interface ShipBuyLocation {
  ship_name: string;
  price_auec: number;
  location_name: string;
  shop_name: string;
  location_type: "sale" | "rental" | "earn";
}

export function getShipBuyLocations(shipName: string): ShipBuyLocation[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM ship_buy_locations WHERE ship_name = ? ORDER BY price_auec ASC")
    .all(shipName) as any[];
  return rows.map((r: any) => ({
    ship_name: r.ship_name,
    price_auec: r.price_auec,
    location_name: r.location_name,
    shop_name: r.shop_name,
    location_type: r.location_type,
  }));
}

export function getShipBuyLocationsFuzzy(shipName: string): ShipBuyLocation[] {
  const db = getDb();
  // Try exact match first
  let rows = db
    .prepare("SELECT * FROM ship_buy_locations WHERE ship_name = ? ORDER BY price_auec ASC")
    .all(shipName) as any[];

  if (rows.length === 0) {
    // Try fuzzy match
    rows = db
      .prepare("SELECT * FROM ship_buy_locations WHERE ship_name LIKE ? ORDER BY price_auec ASC")
      .all(`%${shipName}%`) as any[];
  }

  if (rows.length === 0 && shipName.includes(" ")) {
    // Try first word
    const firstWord = shipName.split(" ")[0];
    rows = db
      .prepare("SELECT * FROM ship_buy_locations WHERE ship_name LIKE ? ORDER BY price_auec ASC")
      .all(`%${firstWord}%`) as any[];
  }

  return rows.map((r: any) => ({
    ship_name: r.ship_name,
    price_auec: r.price_auec,
    location_name: r.location_name,
    shop_name: r.shop_name,
    location_type: r.location_type,
  }));
}

export function getAllShipLocations(): ShipBuyLocation[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM ship_buy_locations ORDER BY ship_name, price_auec ASC")
    .all() as any[];
  return rows.map((r: any) => ({
    ship_name: r.ship_name,
    price_auec: r.price_auec,
    location_name: r.location_name,
    shop_name: r.shop_name,
    location_type: r.location_type,
  }));
}

// ==================== WEKELO SHIPS ====================

export interface WikeloShip {
  ship_name: string;
  mission_name: string;
  cost_description: string;
  reputation_required: string;
  components_description: string;
}

export function getWikeloShip(shipName: string): WikeloShip | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM wikelo_ships WHERE ship_name = ?")
    .get(shipName) as any;
  if (!row) return null;
  return {
    ship_name: row.ship_name,
    mission_name: row.mission_name,
    cost_description: row.cost_description,
    reputation_required: row.reputation_required,
    components_description: row.components_description,
  };
}

export function getWikeloShipFuzzy(shipName: string): WikeloShip | null {
  const db = getDb();
  let row = db
    .prepare("SELECT * FROM wikelo_ships WHERE ship_name = ?")
    .get(shipName) as any;

  if (!row) {
    row = db
      .prepare("SELECT * FROM wikelo_ships WHERE ship_name LIKE ?")
      .get(`%${shipName}%`) as any;
  }

  if (!row && shipName.includes(" ")) {
    const firstWord = shipName.split(" ")[0];
    row = db
      .prepare("SELECT * FROM wikelo_ships WHERE ship_name LIKE ?")
      .get(`%${firstWord}%`) as any;
  }

  if (!row) return null;
  return {
    ship_name: row.ship_name,
    mission_name: row.mission_name,
    cost_description: row.cost_description,
    reputation_required: row.reputation_required,
    components_description: row.components_description,
  };
}
