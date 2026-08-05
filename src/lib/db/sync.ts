import { getDb } from "./schema";
import {
  getDefaultVersion,
  getGameVersions,
  getVehicles,
  getVehicleWeapons,
  getLocations,
  getAllVehicleItems,
} from "../api/starCitizenWiki";
import {
  getUexGameVersions,
  getUexTerminals,
  getUexItemPricesByCategory,
} from "../api/uexCorp";

export async function checkVersionAndSync(): Promise<{
  needsSync: boolean;
  currentVersion: string;
  lastVersion: string;
}> {
  const db = getDb();
  const meta = db.prepare("SELECT * FROM sync_meta WHERE id = 1").get() as any;

  try {
    const wikiVersionRes = await getDefaultVersion();
    const currentVersion = wikiVersionRes.data?.code || wikiVersionRes.data?.version || "";
    const lastVersion = meta?.wiki_version || "";

    return {
      needsSync: currentVersion !== lastVersion || !lastVersion,
      currentVersion,
      lastVersion,
    };
  } catch (error) {
    console.error("Error checking version:", error);
    return { needsSync: false, currentVersion: "", lastVersion: meta?.wiki_version || "" };
  }
}

export async function syncAllData(onProgress?: (step: string, progress: number) => void): Promise<void> {
  const db = getDb();

  db.prepare("UPDATE sync_meta SET sync_status = 'syncing' WHERE id = 1").run();

  try {
    onProgress?.("Obteniendo version actual...", 5);
    const versionRes = await getDefaultVersion();
    const currentVersion = versionRes.data?.code || versionRes.data?.version || "";

    onProgress?.("Verificando version UEX...", 10);
    let uexVersion = "";
    try {
      const uexRes = await getUexGameVersions();
      uexVersion = uexRes.data?.live || "";
    } catch (e) {
      console.warn("UEX version check failed:", e);
    }

    // --- Manufacturers ---
    onProgress?.("Sincronizando fabricantes...", 15);
    const vehiclesRes = await getVehicles(currentVersion);
    const vehicles = vehiclesRes.data || [];

    const manufacturersMap = new Map<string, string>();
    vehicles.forEach((v: any) => {
      if (v.manufacturer?.code && v.manufacturer?.name) {
        manufacturersMap.set(v.manufacturer.code, v.manufacturer.name);
      }
    });

    const insertManufacturer = db.prepare(
      "INSERT OR REPLACE INTO manufacturers (code, name) VALUES (?, ?)"
    );
    const insertMany = db.transaction((entries: [string, string][]) => {
      for (const [code, name] of entries) {
        insertManufacturer.run([code, name]);
      }
    });
    insertMany(Array.from(manufacturersMap.entries()));

    // --- Ships ---
    onProgress?.("Sincronizando naves...", 25);
    const insertShip = db.prepare(`
      INSERT OR REPLACE INTO ships (id, name, class_name, manufacturer_code, classification, crew, mass, cargo_capacity, scm_speed, max_speed, hull_hp, shield_hp, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertHardpoint = db.prepare(`
      INSERT OR REPLACE INTO hardpoints (id, ship_id, name, slot_type, size, max_size)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    let shipCount = 0;
    for (const vehicle of vehicles) {
      try {
        const v = vehicle || {};
        const mfg = v.manufacturer || {};
        const shipId = String(v.id || v.uuid || v.class_name || `ship_${shipCount}`);
        const crew = v.crew;
        const crewVal = typeof crew === "object" && crew !== null ? (crew.min || crew.max || 1) : (crew || 1);
        const speed = v.speed || {};
        const image = (v.images?.[0]?.thumbnail_url || v.images?.[0]?.original_url) || "";
        insertShip.run([
          shipId,
          String(v.name || "Unknown"),
          String(v.class_name || v.name || "Unknown"),
          String(mfg.code || ""),
          String(v.career || ""),
          Number(crewVal) || 1,
          Number(v.mass) || 0,
          Number(v.cargo_capacity) || 0,
          Number(speed.scm) || 0,
          Number(speed.max) || 0,
          Number(v.health) || 0,
          Number(v.shield_hp) || 0,
          String(image)
        ]);

        if (v.ports && Array.isArray(v.ports)) {
          for (const port of v.ports) {
            if (!port || typeof port !== "object") continue;
            const portName = String(port.name || port.class_name || "");
            const slotType = detectSlotType(portName, port);
            const portSizes = port.sizes || {};
            const size = Number(portSizes.min || port.size || extractSize(portName)) || 1;
            const maxSize = Number(portSizes.max || port.max_size || size) || size;
            insertHardpoint.run([
              `${shipId}_${portName}`,
              shipId,
              portName,
              slotType,
              size,
              maxSize
            ]);
          }
        }
      } catch (e) {
        console.warn(`Failed to sync vehicle ${vehicle?.name || shipCount}:`, e);
      }
      shipCount++;
      if (shipCount % 50 === 0) {
        onProgress?.(`Sincronizando naves... ${shipCount}/${vehicles.length}`, 25 + (shipCount / vehicles.length) * 15);
      }
    }

    // --- Components from vehicle-weapons endpoint ---
    onProgress?.("Sincronizando armas...", 45);
    const insertComponent = db.prepare(`
      INSERT OR REPLACE INTO components (id, name, class_name, manufacturer_code, type, size, class, stats, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let componentCount = 0;

    try {
      const weaponsRes = await getVehicleWeapons(currentVersion);
      const weapons = weaponsRes.data || [];
      for (const weapon of weapons) {
        try {
          const mfg = weapon.manufacturer || {};
          const vw = weapon.vehicle_weapon || {};
          const modes = vw.modes || [];
          const primaryMode = modes[0] || {};
          let dps = Number(primaryMode.damage_per_second) || 0;
          if (dps === 0) {
            const alpha = Number(vw.damage_per_shot) || 0;
            const rpm = Number(vw.rpm) || 0;
            dps = rpm > 0 ? Math.round((alpha * rpm) / 60) : 0;
          }
          const stats = {
            dps,
            alpha: Number(vw.damage_per_shot) || 0,
            fire_rate: Number(vw.rpm) || 0,
            range: Number(vw.range) || 0,
            capacity: Number(vw.capacity) || 0,
          };
          const wepId = String(weapon.uuid || weapon.class_name || `weapon_${componentCount}`);
          const image = (weapon.images?.[0]?.thumbnail_url || weapon.images?.[0]?.original_url) || "";
          insertComponent.run([
            wepId,
            String(weapon.name || "Unknown Weapon"),
            String(weapon.class_name || weapon.name || "Unknown"),
            String(mfg.code || ""),
            "Weapon",
            Number(weapon.size) || 1,
            String(weapon.sub_type || ""),
            JSON.stringify(stats),
            String(image)
          ]);
          componentCount++;
        } catch (e) {
          console.warn(`Failed to sync weapon ${weapon?.name}:`, e);
        }
      }
      console.log(`Synced ${componentCount} weapons`);
    } catch (e) {
      console.warn("Failed to sync vehicle weapons:", e);
    }

    const updatePrice = db.prepare(`
      INSERT OR REPLACE INTO component_prices (component_id, price_auec, updated_at)
      VALUES (?, ?, datetime('now'))
    `);

    // --- Fetch real component data from Wiki API /items ---
    onProgress?.("Sincronizando componentes reales...", 65);
    let wikiItems: any[] = [];
    try {
      const itemsRes = await getAllVehicleItems(currentVersion);
      wikiItems = itemsRes.data || [];
      console.log(`Fetched ${wikiItems.length} items from Wiki API /items`);
    } catch (e) {
      console.warn("Failed to fetch Wiki items:", e);
    }

    // Build lookup map by class_name for real stats
    const wikiItemMap = new Map<string, any>();
    for (const item of wikiItems) {
      const cn = String(item.class_name || "");
      if (cn) wikiItemMap.set(cn.toLowerCase(), item);
    }

    // --- Extract hardpoints from vehicle ports ---
    onProgress?.("Sincronizando hardpoints de naves...", 68);
    const componentSlotTypes = ["Shield", "PowerPlant", "Cooler", "QuantumDrive", "Radar", "LifeSupportGenerator", "FlightController"];
    const portComponentMap = new Map<string, any>();

    for (const vehicle of vehicles) {
      const v = vehicle || {};
      if (!v.ports || !Array.isArray(v.ports)) continue;
      for (const port of v.ports) {
        if (!port || typeof port !== "object") continue;
        const pType = port.type || "";
        if (!componentSlotTypes.includes(pType)) continue;
        const class_name = String(port.class_name || "");
        if (!class_name) continue;
        const key = `${pType}_${class_name}`;
        if (!portComponentMap.has(key)) {
          const portSizes = port.sizes || {};
          const equipped = port.equipped_item || {};
          const equipMfg = equipped.manufacturer || {};
          portComponentMap.set(key, {
            type: pType,
            class_name: class_name,
            name: String(equipped.name || class_name.replace(/_/g, " ")),
            size: Number(portSizes.min || port.size) || 1,
            sub_type: String(port.sub_type || ""),
            manufacturer_name: String(equipMfg.name || ""),
            grade: Number(equipped.grade) || 0,
          });
        }
      }
    }

    // --- Sync components with real Wiki API data ---
    onProgress?.("Guardando componentes...", 70);
    for (const [key, comp] of portComponentMap) {
      try {
        const compId = String(comp.class_name);
        const compType = comp.type === "LifeSupportGenerator" ? "LifeSupport" : comp.type;
        const size = Number(comp.size) || 1;
        const grade = Number(comp.grade) || 3;

        // Try to find real stats from Wiki API
        const wikiItem = wikiItemMap.get(comp.class_name.toLowerCase());
        let stats: Record<string, any> = { grade };
        let price = 0;
        let imageUrl = "";

        if (wikiItem) {
          // Extract real stats based on type
          if (compType === "Shield" && wikiItem.shield) {
            const s = wikiItem.shield;
            stats.hp = s.max_health || 0;
            stats.regen_rate = s.regen_rate || 0;
            stats.regen_time = s.regen_time || 0;
            stats.decay_ratio = s.decay_ratio || 0;
            if (s.reserve_pool) {
              stats.reserve_regen_rate = s.reserve_pool.regen_rate || 0;
            }
          } else if (compType === "PowerPlant" && wikiItem.power_plant) {
            const pp = wikiItem.power_plant;
            stats.output = pp.power_output || 0;
            stats.power_segment_generation = pp.power_segment_generation || 0;
          } else if (compType === "Cooler" && wikiItem.cooler) {
            const c = wikiItem.cooler;
            stats.cooling_rate = c.cooling_rate || c.power_segment_generation || 0;
          } else if (compType === "QuantumDrive" && wikiItem.quantum_drive) {
            const qd = wikiItem.quantum_drive;
            const sj = qd.standard_jump || {};
            stats.travel_speed = sj.drive_speed || 0;
            stats.spool_time = sj.spool_up_time || 0;
            stats.cooldown = sj.cooldown_time || 0;
            stats.fuel_efficiency = qd.fuel_efficiency || 0;
            stats.fuel_rate = qd.fuel_rate || 0;
          } else if (compType === "Radar" && wikiItem.radar) {
            stats.detection_range = wikiItem.radar.detection_range || 0;
          }

          // Extract real price
          if (wikiItem.uec_prices?.purchase?.length > 0) {
            const cheapest = wikiItem.uec_prices.purchase
              .filter((p: any) => p.price_buy > 0)
              .sort((a: any, b: any) => a.price_buy - b.price_buy)[0];
            if (cheapest) {
              price = cheapest.price_buy;
            }
          }

          // Extract image
          if (wikiItem.images?.[0]) {
            imageUrl = wikiItem.images?.[0]?.thumbnail_url || wikiItem.images?.[0]?.original_url || "";
          }

          // Use Wiki API name if available
          if (wikiItem.name) comp.name = wikiItem.name;
          if (wikiItem.grade) stats.grade = wikiItem.grade;
        }

        // Fallback to estimated stats if Wiki API didn't have them
        if (!wikiItem || stats.hp === undefined && compType === "Shield") {
          const gradeMultiplier = grade === 1 ? 1.3 : grade === 2 ? 1.15 : grade === 3 ? 1.0 : 0.85;
          const baseHp = size === 1 ? 1650 : size === 2 ? 9500 : size === 3 ? 105000 : 250000;
          stats.hp = Math.round(baseHp * gradeMultiplier);
          stats.regen_rate = Math.round(stats.hp * 0.12);
        }
        if (!wikiItem || stats.output === undefined && compType === "PowerPlant") {
          const gradeMultiplier = grade === 1 ? 1.3 : grade === 2 ? 1.15 : grade === 3 ? 1.0 : 0.85;
          const baseOutput = size === 1 ? 3800 : size === 2 ? 16000 : size === 3 ? 125000 : 450000;
          stats.output = Math.round(baseOutput * gradeMultiplier);
        }
        if (!wikiItem || stats.cooling_rate === undefined && compType === "Cooler") {
          const gradeMultiplier = grade === 1 ? 1.3 : grade === 2 ? 1.15 : grade === 3 ? 1.0 : 0.85;
          const baseCooling = size === 1 ? 450000 : size === 2 ? 2500000 : size === 3 ? 18000000 : 50000000;
          stats.cooling_rate = Math.round(baseCooling * gradeMultiplier);
        }
        if (!wikiItem || stats.travel_speed === undefined && compType === "QuantumDrive") {
          const gradeMultiplier = grade === 1 ? 1.3 : grade === 2 ? 1.15 : grade === 3 ? 1.0 : 0.85;
          stats.travel_speed = size === 1 ? 125000 : size === 2 ? 185000 : 250000;
          stats.spool_time = size === 1 ? 3 : size === 2 ? 4.5 : 7;
        }

        insertComponent.run([
          compId,
          String(comp.name),
          String(comp.class_name),
          String(comp.manufacturer_name || ""),
          compType,
          size,
          String(comp.sub_type || ""),
          JSON.stringify(stats),
          imageUrl
        ]);

        // Save price if available
        if (price > 0) {
          updatePrice.run([compId, price]);
        }

        componentCount++;
      } catch (e) {
        console.warn(`Failed to sync component ${comp.class_name}:`, e);
      }
    }

    console.log(`Synced ${componentCount} components (${portComponentMap.size} from ports, ${wikiItemMap.size} from Wiki API)`);

    // --- UEX terminals (location data) ---
    // Ship component prices come from Wiki API, not UEX.
    onProgress?.("Sincronizando ubicaciones UEX...", 75);
    try {
      const terminalsRes = await getUexTerminals();
      const terminals = terminalsRes.data || [];
      const terminalMap = new Map<number, any>();
      terminals.forEach((t: any) => terminalMap.set(t.id, t));

      const insertLocation = db.prepare(`
        INSERT OR REPLACE INTO buy_locations (component_id, location_name, system, planet_moon, shop_name, shop_type, price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const terminal of terminals) {
        if (!terminal) continue;
        const locName = String(terminal.location || terminal.name || "");
        const system = String(terminal.star_system || "");
        const planetMoon = String(terminal.planet_name || terminal.moon_name || "");
        const shopName = String(terminal.name || "");
        const shopType = String(terminal.terminal_type || "");

        if (locName || shopName) {
          insertLocation.run(["", locName, system, planetMoon, shopName, shopType, 0]);
        }
      }
      console.log(`Synced ${terminals.length} UEX terminal locations`);
    } catch (e) {
      console.warn("UEX terminals unavailable:", e);
    }

    // --- Sync metadata ---
    onProgress?.("Finalizando...", 95);
    db.prepare(`
      UPDATE sync_meta SET
        wiki_version = ?,
        uex_version = ?,
        last_sync_at = datetime('now'),
        last_prices_sync_at = datetime('now'),
        sync_status = 'ok'
      WHERE id = 1
    `).run([currentVersion, uexVersion]);

    const shipTotal = (db.prepare("SELECT COUNT(*) as c FROM ships").get() as any)?.c || 0;
    const compTotal = (db.prepare("SELECT COUNT(*) as c FROM components").get() as any)?.c || 0;
    const locTotal = (db.prepare("SELECT COUNT(*) as c FROM buy_locations").get() as any)?.c || 0;
    console.log(`Sync complete: ${shipTotal} ships, ${compTotal} components, ${locTotal} locations`);

    onProgress?.("Sincronizacion completada", 100);
  } catch (error) {
    console.error("Sync error:", error);
    db.prepare("UPDATE sync_meta SET sync_status = 'error' WHERE id = 1").run();
    throw error;
  }
}

function detectSlotType(name: string, port: any): string {
  const lower = name.toLowerCase();
  const subtype = String(port.type || port.sub_type || "").toLowerCase();
  if (lower.includes("weapon") || lower.includes("gun") || lower.includes("turret") || subtype.includes("weapon") || subtype.includes("gun"))
    return "weapon";
  if (lower.includes("shield") || subtype.includes("shield")) return "shield";
  if (lower.includes("power") || lower.includes("plant") || subtype.includes("powerplant")) return "power_plant";
  if (lower.includes("cooler") || subtype.includes("cooler")) return "cooler";
  if (lower.includes("quantum") || lower.includes("qd") || subtype.includes("quantum")) return "quantum_drive";
  if (lower.includes("missile") || lower.includes("ordinance") || subtype.includes("missile")) return "missile";
  if (lower.includes("radar") || subtype.includes("radar")) return "radar";
  if (lower.includes("thruster") || lower.includes("engine") || subtype.includes("thruster")) return "thruster";
  if (lower.includes("flir")) return "flir";
  return "weapon";
}

function extractSize(name: string): number {
  const match = name.match(/[Ss](\d+)/);
  return match ? parseInt(match[1]) : 1;
}

export function getSyncMeta() {
  const db = getDb();
  return db.prepare("SELECT * FROM sync_meta WHERE id = 1").get();
}

export function getShipCount(): number {
  const db = getDb();
  const result = db.prepare("SELECT COUNT(*) as count FROM ships").get() as any;
  return result?.count || 0;
}

export function getComponentCount(): number {
  const db = getDb();
  const result = db.prepare("SELECT COUNT(*) as count FROM components").get() as any;
  return result?.count || 0;
}

export function getGameVersionsFromDb() {
  const db = getDb();
  return db.prepare("SELECT * FROM game_versions ORDER BY released_at DESC").all();
}

export function setSelectedVersion(version: string) {
  const db = getDb();
  db.prepare("UPDATE sync_meta SET selected_wiki_version = ? WHERE id = 1").run([version]);
}

export function getSelectedVersion(): string {
  const db = getDb();
  const meta = db.prepare("SELECT selected_wiki_version FROM sync_meta WHERE id = 1").get() as any;
  return meta?.selected_wiki_version || "";
}

export async function syncGameVersions(): Promise<void> {
  const db = getDb();
  const versionsRes = await getGameVersions();
  const versions = versionsRes.data || [];

  // Only keep the default (current LIVE) version from Wiki API
  const defaultVersion = versions.find((v: any) => v.is_default);
  if (!defaultVersion) return;

  // Get existing synced status
  const existingVersions = db.prepare("SELECT code, is_synced, last_synced_at FROM game_versions").all() as any[];
  const syncedMap = new Map(existingVersions.map(v => [v.code, { is_synced: v.is_synced, last_synced_at: v.last_synced_at }]));

  // Keep only: current LIVE default + any manually imported PTU versions
  const ptuVersions = existingVersions.filter(v => v.code.includes("PTU"));
  
  const insert = db.prepare(
    "INSERT OR REPLACE INTO game_versions (code, channel, released_at, is_default, is_synced, last_synced_at) VALUES (?, ?, ?, ?, ?, ?)"
  );

  // Insert current LIVE version
  const existing = syncedMap.get(defaultVersion.code);
  insert.run([
    defaultVersion.code,
    defaultVersion.channel || 'live',
    defaultVersion.released_at || '',
    1, // is_default
    existing?.is_synced || 0,
    existing?.last_synced_at || ''
  ]);

  // Keep existing PTU versions
  for (const ptu of ptuVersions) {
    const existingPtu = syncedMap.get(ptu.code);
    insert.run([
      ptu.code,
      'ptu',
      '',
      0,
      existingPtu?.is_synced || 0,
      existingPtu?.last_synced_at || ''
    ]);
  }

  // Remove old LIVE versions (keep only default)
  const allVersions = db.prepare("SELECT code FROM game_versions").all() as any[];
  for (const v of allVersions) {
    if (v.code !== defaultVersion.code && !v.code.includes("PTU")) {
      db.prepare("DELETE FROM game_versions WHERE code = ?").run([v.code]);
    }
  }

  // Set default selected version if none set
  const selected = getSelectedVersion();
  if (!selected) {
    setSelectedVersion(defaultVersion.code);
  }
}

export async function syncDataForVersion(
  version: string,
  onProgress?: (step: string, progress: number) => void
): Promise<void> {
  const db = getDb();

  db.prepare("UPDATE sync_meta SET sync_status = 'syncing' WHERE id = 1").run();

  try {
    onProgress?.(`Sincronizando datos para ${version}...`, 5);

    onProgress?.("Verificando version UEX...", 10);
    let uexVersion = "";
    try {
      const uexRes = await getUexGameVersions();
      uexVersion = uexRes.data?.live || "";
    } catch (e) {
      console.warn("UEX version check failed:", e);
    }

    // --- Fetch all data FIRST (don't delete yet) ---
    onProgress?.("Descargando fabricantes...", 15);
    const vehiclesRes = await getVehicles(version);
    const vehicles = vehiclesRes.data || [];

    // Now safe to clear and re-insert (data was fetched successfully)
    db.exec("DELETE FROM hardpoints");
    db.exec("DELETE FROM ships");
    db.exec("DELETE FROM components");
    db.exec("DELETE FROM buy_locations");
    db.exec("DELETE FROM component_prices");

    // --- Manufacturers ---

    const manufacturersMap = new Map<string, string>();
    vehicles.forEach((v: any) => {
      if (v.manufacturer?.code && v.manufacturer?.name) {
        manufacturersMap.set(v.manufacturer.code, v.manufacturer.name);
      }
    });

    const insertManufacturer = db.prepare(
      "INSERT OR REPLACE INTO manufacturers (code, name) VALUES (?, ?)"
    );
    const insertMany = db.transaction((entries: [string, string][]) => {
      for (const [code, name] of entries) {
        insertManufacturer.run([code, name]);
      }
    });
    insertMany(Array.from(manufacturersMap.entries()));

    // --- Ships ---
    onProgress?.("Sincronizando naves...", 25);
    const insertShip = db.prepare(`
      INSERT OR REPLACE INTO ships (id, name, class_name, manufacturer_code, classification, crew, mass, cargo_capacity, scm_speed, max_speed, hull_hp, shield_hp, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertHardpoint = db.prepare(`
      INSERT OR REPLACE INTO hardpoints (id, ship_id, name, slot_type, size, max_size)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    let shipCount = 0;
    for (const vehicle of vehicles) {
      try {
        const v = vehicle || {};
        const mfg = v.manufacturer || {};
        const shipId = String(v.id || v.uuid || v.class_name || `ship_${shipCount}`);
        const crew = v.crew;
        const crewVal = typeof crew === "object" && crew !== null ? (crew.min || crew.max || 1) : (crew || 1);
        const speed = v.speed || {};
        const image = (v.images?.[0]?.thumbnail_url || v.images?.[0]?.original_url) || "";
        insertShip.run([
          shipId,
          String(v.name || "Unknown"),
          String(v.class_name || v.name || "Unknown"),
          String(mfg.code || ""),
          String(v.career || ""),
          Number(crewVal) || 1,
          Number(v.mass) || 0,
          Number(v.cargo_capacity) || 0,
          Number(speed.scm) || 0,
          Number(speed.max) || 0,
          Number(v.health) || 0,
          Number(v.shield_hp) || 0,
          String(image)
        ]);

        if (v.ports && Array.isArray(v.ports)) {
          for (const port of v.ports) {
            if (!port || typeof port !== "object") continue;
            const portName = String(port.name || port.class_name || "");
            const slotType = detectSlotType(portName, port);
            const portSizes = port.sizes || {};
            const size = Number(portSizes.min || port.size || extractSize(portName)) || 1;
            const maxSize = Number(portSizes.max || port.max_size || size) || size;
            insertHardpoint.run([
              `${shipId}_${portName}`,
              shipId,
              portName,
              slotType,
              size,
              maxSize
            ]);
          }
        }
      } catch (e) {
        console.warn(`Failed to sync vehicle ${vehicle?.name || shipCount}:`, e);
      }
      shipCount++;
      if (shipCount % 50 === 0) {
        onProgress?.(`Sincronizando naves... ${shipCount}/${vehicles.length}`, 25 + (shipCount / vehicles.length) * 15);
      }
    }

    // --- Components from vehicle-weapons endpoint ---
    onProgress?.("Sincronizando armas...", 45);
    const insertComponent = db.prepare(`
      INSERT OR REPLACE INTO components (id, name, class_name, manufacturer_code, type, size, class, stats, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let componentCount = 0;

    try {
      const weaponsRes = await getVehicleWeapons(version);
      const weapons = weaponsRes.data || [];
      for (const weapon of weapons) {
        try {
          const mfg = weapon.manufacturer || {};
          const vw = weapon.vehicle_weapon || {};
          const modes = vw.modes || [];
          const primaryMode = modes[0] || {};
          let dps = Number(primaryMode.damage_per_second) || 0;
          if (dps === 0) {
            const alpha = Number(vw.damage_per_shot) || 0;
            const rpm = Number(vw.rpm) || 0;
            dps = rpm > 0 ? Math.round((alpha * rpm) / 60) : 0;
          }
          const stats = {
            dps,
            alpha: Number(vw.damage_per_shot) || 0,
            fire_rate: Number(vw.rpm) || 0,
            range: Number(vw.range) || 0,
            capacity: Number(vw.capacity) || 0,
          };
          const wepId = String(weapon.uuid || weapon.class_name || `weapon_${componentCount}`);
          const image = (weapon.images?.[0]?.thumbnail_url || weapon.images?.[0]?.original_url) || "";
          insertComponent.run([
            wepId,
            String(weapon.name || "Unknown Weapon"),
            String(weapon.class_name || weapon.name || "Unknown"),
            String(mfg.code || ""),
            "Weapon",
            Number(weapon.size) || 1,
            String(weapon.sub_type || ""),
            JSON.stringify(stats),
            String(image)
          ]);
          componentCount++;
        } catch (e) {
          console.warn(`Failed to sync weapon ${weapon?.name}:`, e);
        }
      }
      console.log(`Synced ${componentCount} weapons`);
    } catch (e) {
      console.warn("Failed to sync vehicle weapons:", e);
    }

    const updatePrice = db.prepare(`
      INSERT OR REPLACE INTO component_prices (component_id, price_auec, updated_at)
      VALUES (?, ?, datetime('now'))
    `);

    // --- Fetch real component data from Wiki API /items ---
    onProgress?.("Sincronizando componentes reales...", 65);
    let wikiItems: any[] = [];
    try {
      const itemsRes = await getAllVehicleItems(version);
      wikiItems = itemsRes.data || [];
      console.log(`Fetched ${wikiItems.length} items from Wiki API /items`);
    } catch (e) {
      console.warn("Failed to fetch Wiki items:", e);
    }

    const wikiItemMap = new Map<string, any>();
    for (const item of wikiItems) {
      const cn = String(item.class_name || "");
      if (cn) wikiItemMap.set(cn.toLowerCase(), item);
    }

    // --- Extract hardpoints from vehicle ports ---
    onProgress?.("Sincronizando hardpoints de naves...", 68);
    const componentSlotTypes = ["Shield", "PowerPlant", "Cooler", "QuantumDrive", "Radar", "LifeSupportGenerator", "FlightController"];
    const portComponentMap = new Map<string, any>();

    for (const vehicle of vehicles) {
      const v = vehicle || {};
      if (!v.ports || !Array.isArray(v.ports)) continue;
      for (const port of v.ports) {
        if (!port || typeof port !== "object") continue;
        const pType = port.type || "";
        if (!componentSlotTypes.includes(pType)) continue;
        const class_name = String(port.class_name || "");
        if (!class_name) continue;
        const key = `${pType}_${class_name}`;
        if (!portComponentMap.has(key)) {
          const portSizes = port.sizes || {};
          const equipped = port.equipped_item || {};
          const equipMfg = equipped.manufacturer || {};
          portComponentMap.set(key, {
            type: pType,
            class_name: class_name,
            name: String(equipped.name || class_name.replace(/_/g, " ")),
            size: Number(portSizes.min || port.size) || 1,
            sub_type: String(port.sub_type || ""),
            manufacturer_name: String(equipMfg.name || ""),
            grade: Number(equipped.grade) || 0,
          });
        }
      }
    }

    // --- Sync components with real Wiki API data ---
    onProgress?.("Guardando componentes...", 70);
    for (const [key, comp] of portComponentMap) {
      try {
        const compId = String(comp.class_name);
        const compType = comp.type === "LifeSupportGenerator" ? "LifeSupport" : comp.type;
        const size = Number(comp.size) || 1;
        const grade = Number(comp.grade) || 3;

        const wikiItem = wikiItemMap.get(comp.class_name.toLowerCase());
        let stats: Record<string, any> = { grade };
        let price = 0;
        let imageUrl = "";

        if (wikiItem) {
          if (compType === "Shield" && wikiItem.shield) {
            const s = wikiItem.shield;
            stats.hp = s.max_health || 0;
            stats.regen_rate = s.regen_rate || 0;
            stats.regen_time = s.regen_time || 0;
            stats.decay_ratio = s.decay_ratio || 0;
          } else if (compType === "PowerPlant" && wikiItem.power_plant) {
            const pp = wikiItem.power_plant;
            stats.output = pp.power_output || 0;
            stats.power_segment_generation = pp.power_segment_generation || 0;
          } else if (compType === "Cooler" && wikiItem.cooler) {
            stats.cooling_rate = wikiItem.cooler.cooling_rate || wikiItem.cooler.power_segment_generation || 0;
          } else if (compType === "QuantumDrive" && wikiItem.quantum_drive) {
            const qd = wikiItem.quantum_drive;
            const sj = qd.standard_jump || {};
            stats.travel_speed = sj.drive_speed || 0;
            stats.spool_time = sj.spool_up_time || 0;
            stats.cooldown = sj.cooldown_time || 0;
            stats.fuel_efficiency = qd.fuel_efficiency || 0;
          }

          if (wikiItem.uec_prices?.purchase?.length > 0) {
            const cheapest = wikiItem.uec_prices.purchase
              .filter((p: any) => p.price_buy > 0)
              .sort((a: any, b: any) => a.price_buy - b.price_buy)[0];
            if (cheapest) price = cheapest.price_buy;
          }
          if (wikiItem.images?.[0]) {
            imageUrl = wikiItem.images?.[0]?.thumbnail_url || wikiItem.images?.[0]?.original_url || "";
          }
          if (wikiItem.name) comp.name = wikiItem.name;
          if (wikiItem.grade) stats.grade = wikiItem.grade;
        }

        // Fallback estimates
        if (!wikiItem || (stats.hp === undefined && compType === "Shield")) {
          const gm = grade === 1 ? 1.3 : grade === 2 ? 1.15 : grade === 3 ? 1.0 : 0.85;
          stats.hp = Math.round((size === 1 ? 1650 : size === 2 ? 9500 : size === 3 ? 105000 : 250000) * gm);
          stats.regen_rate = Math.round(stats.hp * 0.12);
        }
        if (!wikiItem || (stats.output === undefined && compType === "PowerPlant")) {
          const gm = grade === 1 ? 1.3 : grade === 2 ? 1.15 : grade === 3 ? 1.0 : 0.85;
          stats.output = Math.round((size === 1 ? 3800 : size === 2 ? 16000 : size === 3 ? 125000 : 450000) * gm);
        }
        if (!wikiItem || (stats.travel_speed === undefined && compType === "QuantumDrive")) {
          stats.travel_speed = size === 1 ? 125000 : size === 2 ? 185000 : 250000;
          stats.spool_time = size === 1 ? 3 : size === 2 ? 4.5 : 7;
        }

        insertComponent.run([
          compId, String(comp.name), String(comp.class_name), String(comp.manufacturer_name || ""),
          compType, size, String(comp.sub_type || ""), JSON.stringify(stats), imageUrl
        ]);
        if (price > 0) updatePrice.run([compId, price]);
        componentCount++;
      } catch (e) {
        console.warn(`Failed to sync component ${comp.class_name}:`, e);
      }
    }

    console.log(`Synced ${componentCount} components (${portComponentMap.size} from ports, ${wikiItemMap.size} from Wiki API)`);

    // --- UEX terminals (location data) ---
    // Ship component prices come from Wiki API, not UEX.
    onProgress?.("Sincronizando ubicaciones UEX...", 75);
    try {
      const terminalsRes = await getUexTerminals();
      const terminals = terminalsRes.data || [];
      const terminalMap = new Map<number, any>();
      terminals.forEach((t: any) => terminalMap.set(t.id, t));

      const insertLocation = db.prepare(`
        INSERT OR REPLACE INTO buy_locations (component_id, location_name, system, planet_moon, shop_name, shop_type, price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const terminal of terminals) {
        if (!terminal) continue;
        const locName = String(terminal.location || terminal.name || "");
        const system = String(terminal.star_system || "");
        const planetMoon = String(terminal.planet_name || terminal.moon_name || "");
        const shopName = String(terminal.name || "");
        const shopType = String(terminal.terminal_type || "");

        if (locName || shopName) {
          insertLocation.run(["", locName, system, planetMoon, shopName, shopType, 0]);
        }
      }
      console.log(`Synced ${terminals.length} UEX terminal locations`);
    } catch (e) {
      console.warn("UEX terminals unavailable:", e);
    }

    // --- Sync metadata ---
    onProgress?.("Finalizando...", 95);
    db.prepare(`
      UPDATE sync_meta SET
        wiki_version = ?,
        uex_version = ?,
        last_sync_at = datetime('now'),
        last_prices_sync_at = datetime('now'),
        sync_status = 'ok',
        selected_wiki_version = ?
      WHERE id = 1
    `).run([version, uexVersion, version]);

    // Mark version as synced and ensure it exists in game_versions
    db.prepare(`
      INSERT OR REPLACE INTO game_versions (code, channel, released_at, is_default, is_synced, last_synced_at)
      SELECT ?, 'live', '', 0, 1, datetime('now')
      WHERE NOT EXISTS (SELECT 1 FROM game_versions WHERE code = ?)
    `).run([version, version]);
    db.prepare(`
      UPDATE game_versions SET is_synced = 1, last_synced_at = datetime('now')
      WHERE code = ?
    `).run([version]);

    const shipTotal = (db.prepare("SELECT COUNT(*) as c FROM ships").get() as any)?.c || 0;
    const compTotal = (db.prepare("SELECT COUNT(*) as c FROM components").get() as any)?.c || 0;
    const locTotal = (db.prepare("SELECT COUNT(*) as c FROM buy_locations").get() as any)?.c || 0;
    console.log(`Sync complete for ${version}: ${shipTotal} ships, ${compTotal} components, ${locTotal} locations`);

    onProgress?.("Sincronizacion completada", 100);
  } catch (error) {
    console.error("Sync error:", error);
    db.prepare("UPDATE sync_meta SET sync_status = 'error' WHERE id = 1").run();
    throw error;
  }
}
