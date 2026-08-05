import { getDb } from "./schema";
import {
  getDefaultVersion,
  getGameVersions,
  getVehicles,
  getVehicleWeapons,
  getLocations,
} from "../api/starCitizenWiki";
import {
  getUexGameVersions,
  getUexItemsPrices,
  getUexTerminals,
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
        const image = (v.images && v.images[0] && v.images[0].source) || "";
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
          const image = (weapon.images && weapon.images[0] && weapon.images[0].source) || "";
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

    // --- Extract components from vehicle ports ---
    onProgress?.("Sincronizando componentes de naves...", 65);
    const componentSlotTypes = ["Shield", "PowerPlant", "Cooler", "QuantumDrive", "Radar", "LifeSupportGenerator", "FlightController"];
    const componentMap = new Map<string, any>();

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
        if (!componentMap.has(key)) {
          const portSizes = port.sizes || {};
          const equipped = port.equipped_item || {};
          const equipMfg = equipped.manufacturer || {};
          componentMap.set(key, {
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

    for (const [key, comp] of componentMap) {
      try {
        const compId = String(comp.class_name);
        const compType = comp.type === "LifeSupportGenerator" ? "LifeSupport" : comp.type;
        const size = Number(comp.size) || 1;
        const grade = Number(comp.grade) || 3;
        
        // Calculate realistic specs based on size and grade if missing
        const stats: Record<string, number> = { grade };
        const gradeMultiplier = grade === 1 ? 1.3 : grade === 2 ? 1.15 : grade === 3 ? 1.0 : 0.85;

        if (compType === "Shield") {
          const baseHp = size === 1 ? 1650 : size === 2 ? 9500 : size === 3 ? 105000 : 250000;
          stats.hp = Math.round(baseHp * gradeMultiplier);
          stats.regen_rate = Math.round(stats.hp * 0.12);
        } else if (compType === "PowerPlant") {
          const baseOutput = size === 1 ? 3800 : size === 2 ? 16000 : size === 3 ? 125000 : 450000;
          stats.output = Math.round(baseOutput * gradeMultiplier);
        } else if (compType === "Cooler") {
          const baseCooling = size === 1 ? 450000 : size === 2 ? 2500000 : size === 3 ? 18000000 : 50000000;
          stats.cooling_rate = Math.round(baseCooling * gradeMultiplier);
        } else if (compType === "QuantumDrive") {
          stats.travel_speed = size === 1 ? 125000 : size === 2 ? 185000 : 250000;
          stats.quantum_fuel_claimed = size === 1 ? 580 : size === 2 ? 2500 : 12000;
          stats.fuel_capacity = stats.quantum_fuel_claimed;
          stats.spool_time = size === 1 ? 3 : size === 2 ? 4.5 : 7;
        }

        insertComponent.run([
          compId,
          String(comp.name),
          String(comp.class_name),
          "",
          compType,
          size,
          String(comp.sub_type || ""),
          JSON.stringify(stats),
          ""
        ]);
        componentCount++;
      } catch (e) {
        console.warn(`Failed to sync component ${comp.class_name}:`, e);
      }
    }

    console.log(`Synced ${componentCount} total components (${componentMap.size} from vehicle ports)`);

    // --- UEX prices and locations ---
    onProgress?.("Sincronizando precios UEX...", 75);
    const insertLocation = db.prepare(`
      INSERT OR REPLACE INTO buy_locations (component_id, location_name, system, planet_moon, shop_name, shop_type, price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const updatePrice = db.prepare(`
      INSERT OR REPLACE INTO component_prices (component_id, price_auec, updated_at)
      VALUES (?, ?, datetime('now'))
    `);

    try {
      const terminalsRes = await getUexTerminals();
      const terminals = terminalsRes.data || [];
      const terminalMap = new Map<number, any>();
      terminals.forEach((t: any) => terminalMap.set(t.id, t));

      const pricesRes = await getUexItemsPrices();
      const prices = pricesRes.data || [];

      let priceCount = 0;
      for (const priceEntry of prices) {
        const terminal = terminalMap.get(priceEntry.id_terminal);
        if (terminal) {
          const compName = priceEntry.item_name || priceEntry.code;
          const component = db
            .prepare("SELECT id FROM components WHERE name LIKE ? OR class_name LIKE ?")
            .get([`%${compName}%`, `%${compName}%`]) as any;

          if (component) {
            insertLocation.run([
              component.id,
              String(terminal.location || ""),
              String(terminal.system || ""),
              String(terminal.planet_moon || ""),
              String(terminal.name || ""),
              String(terminal.terminal_type || ""),
              Number(priceEntry.price) || 0
            ]);
            if (priceEntry.price > 0) {
              updatePrice.run([component.id, Number(priceEntry.price)]);
            }
            priceCount++;
          }
        }
      }
      console.log(`Synced ${priceCount} UEX price entries`);
    } catch (e) {
      console.warn("Failed to sync UEX prices:", e);
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
        const image = (v.images && v.images[0] && v.images[0].source) || "";
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
          const image = (weapon.images && weapon.images[0] && weapon.images[0].source) || "";
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

    // --- Extract components from vehicle ports ---
    onProgress?.("Sincronizando componentes de naves...", 65);
    const componentSlotTypes = ["Shield", "PowerPlant", "Cooler", "QuantumDrive", "Radar", "LifeSupportGenerator", "FlightController"];
    const componentMap = new Map<string, any>();

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
        if (!componentMap.has(key)) {
          const portSizes = port.sizes || {};
          const equipped = port.equipped_item || {};
          const equipMfg = equipped.manufacturer || {};
          componentMap.set(key, {
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

    for (const [key, comp] of componentMap) {
      try {
        const compId = String(comp.class_name);
        const compType = comp.type === "LifeSupportGenerator" ? "LifeSupport" : comp.type;
        const size = Number(comp.size) || 1;
        const grade = Number(comp.grade) || 3;

        const stats: Record<string, number> = { grade };
        const gradeMultiplier = grade === 1 ? 1.3 : grade === 2 ? 1.15 : grade === 3 ? 1.0 : 0.85;

        if (compType === "Shield") {
          const baseHp = size === 1 ? 1650 : size === 2 ? 9500 : size === 3 ? 105000 : 250000;
          stats.hp = Math.round(baseHp * gradeMultiplier);
          stats.regen_rate = Math.round(stats.hp * 0.12);
        } else if (compType === "PowerPlant") {
          const baseOutput = size === 1 ? 3800 : size === 2 ? 16000 : size === 3 ? 125000 : 450000;
          stats.output = Math.round(baseOutput * gradeMultiplier);
        } else if (compType === "Cooler") {
          const baseCooling = size === 1 ? 450000 : size === 2 ? 2500000 : size === 3 ? 18000000 : 50000000;
          stats.cooling_rate = Math.round(baseCooling * gradeMultiplier);
        } else if (compType === "QuantumDrive") {
          stats.travel_speed = size === 1 ? 125000 : size === 2 ? 185000 : 250000;
          stats.quantum_fuel_claimed = size === 1 ? 580 : size === 2 ? 2500 : 12000;
          stats.fuel_capacity = stats.quantum_fuel_claimed;
          stats.spool_time = size === 1 ? 3 : size === 2 ? 4.5 : 7;
        }

        insertComponent.run([
          compId,
          String(comp.name),
          String(comp.class_name),
          "",
          compType,
          size,
          String(comp.sub_type || ""),
          JSON.stringify(stats),
          ""
        ]);
        componentCount++;
      } catch (e) {
        console.warn(`Failed to sync component ${comp.class_name}:`, e);
      }
    }

    console.log(`Synced ${componentCount} total components (${componentMap.size} from vehicle ports)`);

    // --- UEX prices and locations ---
    onProgress?.("Sincronizando precios UEX...", 75);
    const insertLocation = db.prepare(`
      INSERT OR REPLACE INTO buy_locations (component_id, location_name, system, planet_moon, shop_name, shop_type, price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const updatePrice = db.prepare(`
      INSERT OR REPLACE INTO component_prices (component_id, price_auec, updated_at)
      VALUES (?, ?, datetime('now'))
    `);

    try {
      const terminalsRes = await getUexTerminals();
      const terminals = terminalsRes.data || [];
      const terminalMap = new Map<number, any>();
      terminals.forEach((t: any) => terminalMap.set(t.id, t));

      const pricesRes = await getUexItemsPrices();
      const prices = pricesRes.data || [];

      let priceCount = 0;
      for (const priceEntry of prices) {
        const terminal = terminalMap.get(priceEntry.id_terminal);
        if (terminal) {
          const compName = priceEntry.item_name || priceEntry.code;
          const component = db
            .prepare("SELECT id FROM components WHERE name LIKE ? OR class_name LIKE ?")
            .get([`%${compName}%`, `%${compName}%`]) as any;

          if (component) {
            insertLocation.run([
              component.id,
              String(terminal.location || ""),
              String(terminal.system || ""),
              String(terminal.planet_moon || ""),
              String(terminal.name || ""),
              String(terminal.terminal_type || ""),
              Number(priceEntry.price) || 0
            ]);
            if (priceEntry.price > 0) {
              updatePrice.run([component.id, Number(priceEntry.price)]);
            }
            priceCount++;
          }
        }
      }
      console.log(`Synced ${priceCount} UEX price entries`);
    } catch (e) {
      console.warn("Failed to sync UEX prices:", e);
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
