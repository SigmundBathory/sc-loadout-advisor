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
    LEFT JOIN ship_buy_locations sbl ON (
      sbl.ship_id = s.id OR
      sbl.ship_name = s.name OR
      (sbl.location_type = 'sale' AND s.name LIKE '%' || sbl.ship_name || '%'
       AND s.name NOT LIKE '%Wikelo%' AND s.name NOT LIKE '%PYAM%'
       AND s.name NOT LIKE '%Collector%' AND s.name NOT LIKE '%Executive Edition%'
       AND s.name NOT LIKE '%Best In Show%' AND s.name NOT LIKE '%CitizenCon%'
       AND s.name NOT LIKE '%Heartseeker%' AND s.name NOT LIKE '%Teach%'
       AND s.name NOT LIKE '%IKTI%' AND s.name NOT LIKE '%OX%'
       AND s.name NOT LIKE '%Alliance%' AND s.name NOT LIKE '%Military%'
       AND s.name NOT LIKE '%Stealth%' AND s.name NOT LIKE '%Medic%'
       AND s.name NOT LIKE '%Industrial%')
    )
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
  return rows
    .filter((r: any) => !r.name.toLowerCase().includes("interdiction"))
    .map((r: any) => fixHardpointClassification(r, shipId))
    .map((r: any) => ({
      id: r.id,
      name: r.name,
      slot_type: r.slot_type,
      size: r.size,
      max_size: r.max_size,
      component_id: r.component_id || undefined,
    }));
}

/**
 * Fixes known hardpoint misclassifications from wiki data.
 * Some ships have weapon hardpoints incorrectly classified as "utility".
 */
function fixHardpointClassification(row: any, shipId: string): any {
  const name = row.name.toLowerCase();

  // Known ship IDs with misclassified hardpoints (ship_id contains ship name pattern)
  // F7A/F7C Hornet Mk I - utility slots that are actually weapons
  if (shipId.includes('f7a-hornet-mk-i') || shipId.includes('f7c-hornet-mk-i') || shipId.includes('f7c-hornet-wildfire-mk-i')) {
    if (row.slot_type === 'utility') {
      const n = name;
      // Center gun (size 5), wing guns (size 4), nose gun (size 3)
      if (n.includes('class_4_center') || n.includes('class_4_nose') ||
          n.includes('class_2_left_wing') || n.includes('class_2_right_wing') ||
          n.includes('class_4_center') || n.includes('intake_hardpoint_countermeasure')) {
        // Countermeasures are utility, but class_4_center/nose and class_2 wings are guns
        if (n.includes('countermeasure')) return row;
        return { ...row, slot_type: 'weapon' };
      }
    }
  }

  // Gladiator - utility class_2_left/right_wing are nose guns (size 4)
  if (shipId.includes('gladiator') && !shipId.includes('valiant') && !shipId.includes('pirate')) {
    if (row.slot_type === 'utility' && name.includes('class_2') && name.includes('wing')) {
      return { ...row, slot_type: 'weapon' };
    }
  }

  // Buccaneer - all utility slots are actually weapons
  // Spinal S4, left/right S3 pylons, S1 wingtips
  if (shipId.includes('buccaneer') && !shipId.includes('alliance') && !shipId.includes('wikelo') && !shipId.includes('work') && !shipId.includes('ox')) {
    if (row.slot_type === 'utility') {
      const n = name;
      if (n.includes('spinal') || n.includes('left_s3') || n.includes('right_s3') ||
          n.includes('left_wingtip') || n.includes('right_wingtip') ||
          n.includes('s4') || n.includes('s3_pylon') || n.includes('wingtip')) {
        return { ...row, slot_type: 'weapon' };
      }
    }
  }

  // M50 Interceptor - wing guns are size=1 max=2, should be size=2 for fixed S2 guns
  // The wiki data has size=1 (mount class) but they're fixed S2 guns
  if (shipId.includes('m50-interceptor') && !shipId.includes('velocity') && !shipId.includes('force')) {
    if (row.slot_type === 'weapon' && name.includes('gun_class1') && row.size === 1 && row.max_size === 2) {
      return { ...row, size: 2 }; // Fix: actual gun size is S2
    }
  }

  // Herald - wings are size=1 max=2 (S2 guns), nose is S3 - already correct
  // Arrow - correct (2x S3 wing)

  return row;
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
           cp.price_auec, cp.source as price_source
    FROM components c
    LEFT JOIN manufacturers m ON c.manufacturer_code = m.code
    LEFT JOIN component_prices cp ON c.id = cp.component_id
    WHERE 1=1
  `;
  const params: any[] = [];

  // Hide internal game placeholder components (name "<=" PLACEHOLDER "=>")
  query += " AND c.name NOT LIKE '%PLACEHOLDER%'";

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
              cp.price_auec, cp.source as price_source
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
              cp.price_auec, cp.source as price_source
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
  slotSize: number,
  slotMinSize: number = slotSize
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
    radar: "Radar",
    flight_controller: "FlightController",
    flightcontroller: "FlightController",
    life_support: "LifeSupport",
    lifesupport: "LifeSupport",
    missile: "Missile",
  };

  const componentType = slotTypeMap[slotType.toLowerCase()] || slotType;
  // Non-configurable / cosmetic slots have no compatible components
  if (!slotTypeMap[slotType.toLowerCase()]) return [];

  const rows = db
    .prepare(
      `SELECT c.*, m.name as manufacturer_name, m.code as manufacturer_code,
              cp.price_auec, cp.source as price_source
       FROM components c
       LEFT JOIN manufacturers m ON c.manufacturer_code = m.code
       LEFT JOIN component_prices cp ON c.id = cp.component_id
       WHERE c.type = ? AND c.size >= ? AND c.size <= ?
       AND c.name NOT LIKE '%PLACEHOLDER%'
       AND LOWER(c.name) NOT LIKE '%mauler%'
       AND LOWER(c.class_name) NOT LIKE '%mauler%'
       ORDER BY c.name`
    )
    .all([componentType, slotMinSize, slotSize]) as any[];

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
      source: r.source || "legacy_unverified",
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
    source: r.source || "legacy_unverified",
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
    price_source: row.price_source || "legacy_unverified",
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
    SELECT * FROM (
      SELECT s.id, s.name, s.classification, s.image_url, s.mass, s.hull_hp, s.shield_hp,
             (SELECT COUNT(*) FROM hardpoints WHERE ship_id = s.id AND slot_type = 'weapon') as weapons,
             (SELECT COUNT(*) FROM hardpoints WHERE ship_id = s.id AND slot_type = 'shield') as shields,
             (SELECT COUNT(*) FROM hardpoints WHERE ship_id = s.id AND slot_type = 'missile') as missiles
      FROM ships s
      WHERE s.hull_hp > 0
    ) sub
    WHERE weapons > 0
    ORDER BY
      CASE
        WHEN mass > 10000000 THEN 1
        WHEN mass > 1000000 THEN 2
        WHEN mass > 100000 THEN 3
        ELSE 4
      END,
      weapons DESC, mass DESC
    LIMIT ?
  `).all([limit]) as any[];
  return rows;
}

export function getManufacturerDistribution() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT m.code, m.name, COUNT(s.id) as count
    FROM ships s
    JOIN manufacturers m ON s.manufacturer_code = m.code
    GROUP BY m.code, m.name
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

export function getShipsWithDps(filters?: {
  manufacturer?: string;
  classification?: string;
  search?: string;
}) {
  const db = getDb();
  // Calculate DPS based on weapon slot count only (simpler and more accurate)
  let query = `
    SELECT s.*, m.name as manufacturer_name, m.code as manufacturer_code,
           (SELECT COUNT(*) FROM hardpoints WHERE ship_id = s.id AND slot_type = 'weapon') * 800 as dps,
           MIN(CASE WHEN sbl.location_type = 'sale' THEN sbl.price_auec END) as price_auec,
           MAX(CASE WHEN sbl.ship_name IS NOT NULL THEN 1 ELSE 0 END) as is_buyable
    FROM ships s
    LEFT JOIN manufacturers m ON s.manufacturer_code = m.code
    LEFT JOIN ship_buy_locations sbl ON (
      sbl.ship_id = s.id OR
      sbl.ship_name = s.name OR
      (sbl.location_type = 'sale' AND s.name LIKE '%' || sbl.ship_name || '%'
       AND s.name NOT LIKE '%Wikelo%' AND s.name NOT LIKE '%PYAM%'
       AND s.name NOT LIKE '%Collector%' AND s.name NOT LIKE '%Executive Edition%'
       AND s.name NOT LIKE '%Best In Show%' AND s.name NOT LIKE '%CitizenCon%'
       AND s.name NOT LIKE '%Heartseeker%' AND s.name NOT LIKE '%Teach%'
       AND s.name NOT LIKE '%IKTI%' AND s.name NOT LIKE '%OX%'
       AND s.name NOT LIKE '%Alliance%' AND s.name NOT LIKE '%Military%'
       AND s.name NOT LIKE '%Stealth%' AND s.name NOT LIKE '%Medic%'
       AND s.name NOT LIKE '%Industrial%')
    )
    WHERE 1=1
    GROUP BY s.id
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

// ==================== SYNC LOG ====================

export interface SyncLogEntry {
  id: number;
  version: string;
  started_at: string;
  finished_at: string;
  status: string;
  ships_synced: number;
  components_synced: number;
  locations_synced: number;
  error_message: string;
}

export function startSyncLog(version: string): number {
  const db = getDb();
  const result = db
    .prepare("INSERT INTO sync_log (version, status) VALUES (?, 'running')")
    .run(version);
  return Number(result.lastInsertRowid);
}

export function finishSyncLog(
  id: number,
  opts: { status: string; ships?: number; components?: number; locations?: number; error?: string }
) {
  const db = getDb();
  db.prepare(`
    UPDATE sync_log SET
      finished_at = datetime('now'),
      status = ?,
      ships_synced = ?,
      components_synced = ?,
      locations_synced = ?,
      error_message = ?
    WHERE id = ?
  `).run([
    opts.status,
    opts.ships || 0,
    opts.components || 0,
    opts.locations || 0,
    opts.error || "",
    id,
  ]);
}

export function getRecentSyncLogs(limit = 10): SyncLogEntry[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM sync_log ORDER BY started_at DESC LIMIT ?")
    .all(limit) as any[];
  return rows.map((r: any) => ({
    id: r.id,
    version: r.version,
    started_at: r.started_at,
    finished_at: r.finished_at,
    status: r.status,
    ships_synced: r.ships_synced,
    components_synced: r.components_synced,
    locations_synced: r.locations_synced,
    error_message: r.error_message,
  }));
}

// ==================== VERSION SNAPSHOTS ====================

export function captureVersionSnapshot(version: string) {
  const db = getDb();
  const ships = (db.prepare("SELECT COUNT(*) as c FROM ships").get() as any)?.c || 0;
  const components = (db.prepare("SELECT COUNT(*) as c FROM components").get() as any)?.c || 0;
  const weapons = (db.prepare("SELECT COUNT(*) as c FROM components WHERE type = 'Weapon'").get() as any)?.c || 0;
  db.prepare(`
    INSERT OR REPLACE INTO version_snapshots (version, ship_count, component_count, weapon_count, captured_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run([version, ships, components, weapons]);
}

export function getVersionSnapshot(version: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM version_snapshots WHERE version = ?").get(version) as
    | { version: string; ship_count: number; component_count: number; weapon_count: number; captured_at: string }
    | undefined;
}

export function getVersionChanges(currentVersion: string, previousVersion: string) {
  const current = getVersionSnapshot(currentVersion);
  const previous = getVersionSnapshot(previousVersion);
  if (!current || !previous) return null;
  return {
    shipDelta: current.ship_count - previous.ship_count,
    componentDelta: current.component_count - previous.component_count,
    weaponDelta: current.weapon_count - previous.weapon_count,
  };
}
