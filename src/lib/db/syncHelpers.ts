import type Database from "better-sqlite3";

// ==================== COMPONENT VALIDATION ====================
// Maximum allowed values per component type to filter anomalous data

const VALIDATION_RULES: Record<string, {
  maxDps?: number;
  maxAlpha?: number;
  maxHp?: number;
  maxRegen?: number;
  maxCooling?: number;
  maxSpeed?: number;
  minSpeed?: number;
  maxPrice?: number;
  blockedNames?: RegExp[];
}> = {
  Weapon: {
    maxDps: 30000,    // Normal max ~15k for S12
    maxAlpha: 100000, // Normal max ~50k
    blockedNames: [/PLACEHOLDER/i, /test/i],
  },
  Shield: {
    maxHp: 120000,    // Normal max S4 ~105k
    maxRegen: 25000,  // Normal max S4 ~23k
    blockedNames: [/PLACEHOLDER/i],
  },
  PowerPlant: {
    maxPrice: 5000000, // Reasonable max
    blockedNames: [/PLACEHOLDER/i],
  },
  Cooler: {
    maxCooling: 150,  // Normal max S4 ~102
    blockedNames: [/PLACEHOLDER/i],
  },
  QuantumDrive: {
    maxSpeed: 450000000, // Normal max S4 ~400G
    minSpeed: 50000000,  // Minimum ~50G
    blockedNames: [/PLACEHOLDER/i, /TEMP/i],
  },
  Radar: {
    blockedNames: [/PLACEHOLDER/i, /Fake/i, /TEMP/i],
  },
};

export function validateComponent(
  compType: string,
  name: string,
  stats: Record<string, any>,
  price: number
): { valid: boolean; reason?: string } {
  const rules = VALIDATION_RULES[compType];
  if (!rules) return { valid: true }; // No rules = pass

  // Check blocked name patterns
  if (rules.blockedNames) {
    for (const pattern of rules.blockedNames) {
      if (pattern.test(name)) {
        return { valid: false, reason: `Blocked name pattern: ${pattern.source}` };
      }
    }
  }

  // Check weapon stats
  if (compType === "Weapon") {
    if (rules.maxDps && (stats.dps || 0) > rules.maxDps) {
      return { valid: false, reason: `DPS ${stats.dps} exceeds max ${rules.maxDps}` };
    }
    if (rules.maxAlpha && (stats.alpha || 0) > rules.maxAlpha) {
      return { valid: false, reason: `Alpha ${stats.alpha} exceeds max ${rules.maxAlpha}` };
    }
  }

  // Check shield stats
  if (compType === "Shield") {
    if (rules.maxHp && (stats.hp || 0) > rules.maxHp) {
      return { valid: false, reason: `HP ${stats.hp} exceeds max ${rules.maxHp}` };
    }
    if (rules.maxRegen && (stats.regen_rate || 0) > rules.maxRegen) {
      return { valid: false, reason: `Regen ${stats.regen_rate} exceeds max ${rules.maxRegen}` };
    }
  }

  // Check cooler stats
  if (compType === "Cooler") {
    if (rules.maxCooling && (stats.cooling_rate || 0) > rules.maxCooling) {
      return { valid: false, reason: `Cooling ${stats.cooling_rate} exceeds max ${rules.maxCooling}` };
    }
  }

  // Check QD stats
  if (compType === "QuantumDrive") {
    const speed = stats.travel_speed || 0;
    if (rules.maxSpeed && speed > rules.maxSpeed) {
      return { valid: false, reason: `Speed ${speed} exceeds max ${rules.maxSpeed}` };
    }
    if (rules.minSpeed && speed > 0 && speed < rules.minSpeed) {
      return { valid: false, reason: `Speed ${speed} below min ${rules.minSpeed}` };
    }
  }

  // Check price
  if (rules.maxPrice && price > rules.maxPrice) {
    return { valid: false, reason: `Price ${price} exceeds max ${rules.maxPrice}` };
  }

  return { valid: true };
}

export function detectSlotType(name: string, port: any): string {
  const lower = name.toLowerCase();
  const subtype = String(port.type || port.sub_type || "").toLowerCase();

  if (lower.includes("armor") || lower.includes("armour")) return "utility";
  if (lower.includes("paint") || lower.includes("skin")) return "utility";
  if (lower.includes("countermeasure") || lower.includes("flare") || lower.includes("chaff")) return "utility";
  if (lower.includes("locker") || lower.includes("stairwell") || lower.includes("hangar") || lower.includes("elevator")) return "utility";
  if (lower.includes("component") && !lower.includes("weapon")) return "utility";

  if (lower.includes("flight") || lower.includes("controller_flight") || subtype.includes("flight")) return "flight_controller";
  if (lower.includes("lifesupport") || lower.includes("life_support") || lower.includes("life support") || subtype.includes("lifesupport")) return "life_support";

  // Missile bays are ordnance slots, not weapon slots. Check them before the
  // generic weapon/gun rule because names such as "weapon_missilebay" contain
  // both terms.
  if (lower.includes("missile") || lower.includes("ordinance") || subtype.includes("missile")) return "missile";
  if (lower.includes("weapon") || lower.includes("gun") || lower.includes("turret") || subtype.includes("weapon") || subtype.includes("gun"))
    return "weapon";
  if (lower.includes("shield") || subtype.includes("shield")) return "shield";
  if (lower.includes("power") || lower.includes("plant") || subtype.includes("powerplant")) return "power_plant";
  if (lower.includes("cooler") || subtype.includes("cooler")) return "cooler";
  if (lower.includes("quantum") || lower.includes("qd") || subtype.includes("quantum")) return "quantum_drive";
  if (lower.includes("radar") || subtype.includes("radar")) return "radar";
  if (lower.includes("thruster") || lower.includes("engine") || subtype.includes("thruster")) return "thruster";
  if (lower.includes("flir")) return "flir";
  return "utility";
}

export function extractSize(name: string): number {
  const match = name.match(/[Ss](\d+)/);
  return match ? parseInt(match[1]) : 1;
}

export function deduplicateVehicles(vehicles: any[]): any[] {
  const byId = new Map<string, any>();
  const isSpecial = (s: any) => /collector|wikelo|special|exec|paint|skin/i.test(String(s.class_name || ""));
  for (const vehicle of vehicles) {
    const v = vehicle || {};
    const id = String(v.id || v.uuid || v.class_name || "");
    if (!id) continue;
    const prev = byId.get(id);
    if (!prev) { byId.set(id, v); continue; }
    if (isSpecial(prev) && !isSpecial(v)) byId.set(id, v);
  }
  return Array.from(byId.values());
}

export function syncManufacturers(db: Database, vehicles: any[]): void {
  const map = new Map<string, string>();
  vehicles.forEach((v: any) => {
    if (v.manufacturer?.code && v.manufacturer?.name) {
      map.set(v.manufacturer.code, v.manufacturer.name);
    }
  });
  const stmt = db.prepare("INSERT OR REPLACE INTO manufacturers (code, name) VALUES (?, ?)");
  db.transaction((entries: [string, string][]) => {
    for (const [code, name] of entries) stmt.run([code, name]);
  })(Array.from(map.entries()));
}

export function syncShipsAndHardpoints(
  db: Database,
  vehicles: any[],
  onProgress?: (step: string, progress: number) => void,
  progressBase?: number
): number {
  const insertShip = db.prepare(`
    INSERT OR REPLACE INTO ships (id, name, class_name, manufacturer_code, classification, crew, mass, cargo_capacity, scm_speed, max_speed, hull_hp, shield_hp, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertHardpoint = db.prepare(`
    INSERT OR REPLACE INTO hardpoints (id, ship_id, name, slot_type, size, max_size)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let shipCount = 0;
  const base = progressBase ?? 25;
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
        shipId, String(v.name || "Unknown"), String(v.class_name || v.name || "Unknown"),
        String(mfg.code || ""), String(v.career || ""),
        Number(crewVal) || 1, Number(v.mass) || 0, Number(v.cargo_capacity) || 0,
        Number(speed.scm) || 0, Number(speed.max) || 0,
        Number(v.health) || 0, Number(v.shield_hp) || 0, String(image)
      ]);

      if (v.ports && Array.isArray(v.ports)) {
        for (const port of v.ports) {
          if (!port || typeof port !== "object") continue;
          const portName = String(port.name || port.class_name || "");
          const slotType = detectSlotType(portName, port);
          const portSizes = port.sizes || {};
          const size = Number(portSizes.min || port.size || extractSize(portName)) || 1;
          const maxSize = Number(portSizes.max || port.max_size || size) || size;
          insertHardpoint.run([`${shipId}_${portName}`, shipId, portName, slotType, size, maxSize]);
        }
      }
    } catch (e) {
      console.warn(`Failed to sync vehicle ${vehicle?.name || shipCount}:`, e);
    }
    shipCount++;
    if (shipCount % 50 === 0) {
      onProgress?.(`Sincronizando naves... ${shipCount}/${vehicles.length}`, base + (shipCount / vehicles.length) * 15);
    }
  }
  return shipCount;
}

/**
 * Extracts the cheapest observed purchase price and the verified buy
 * locations (shop, station, planet/moon, system) from a Star Citizen Wiki
 * item's `uex_prices.purchase` list, which is populated for both port
 * components (via /items) and weapons (via /vehicle-weapons).
 */
export function extractWikiPurchaseInfo(wikiItem: any): { price: number | null; locations: Array<{ location_name: string; system: string; planet_moon: string; shop_name: string; price: number }> } {
  const purchases = (wikiItem?.uex_prices?.purchase || []).filter((p: any) => p.price_buy > 0);
  if (purchases.length === 0) return { price: null, locations: [] };

  const cheapest = [...purchases].sort((a: any, b: any) => a.price_buy - b.price_buy)[0];
  const locations: Array<{ location_name: string; system: string; planet_moon: string; shop_name: string; price: number }> = [];
  const seenTerminals = new Set<string>();
  for (const purchase of purchases) {
    const terminalName = String(purchase.terminal_name || "").trim();
    if (!terminalName || seenTerminals.has(terminalName)) continue;
    seenTerminals.add(terminalName);

    // UEX terminal names are usually "Shop - Landing Zone" (e.g. "Dumper's
    // Depot - Area 18"); split so the shop and station render separately.
    let shopName = terminalName;
    let stationName = terminalName;
    if (terminalName.includes(" - ")) {
      const parts = terminalName.split(" - ");
      shopName = parts[0].trim();
      stationName = parts.slice(1).join(" - ").trim();
    }

    const loc = purchase.starmap_location || {};
    const system = String(loc.star_system_name || "");
    const planetMoon = String(loc.parent_name || loc.name || "");

    locations.push({
      location_name: stationName || loc.name || terminalName,
      system,
      planet_moon: planetMoon,
      shop_name: shopName,
      price: purchase.price_buy,
    });
  }
  return { price: cheapest.price_buy, locations };
}

export function syncWeapons(db: Database, weapons: any[]): number {
  const insertComponent = db.prepare(`
    INSERT OR REPLACE INTO components (id, name, class_name, manufacturer_code, type, size, class, stats, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updatePrice = db.prepare(`
    INSERT OR REPLACE INTO component_prices (component_id, price_auec, updated_at, source)
    VALUES (?, ?, datetime('now'), 'wiki')
  `);
  const insertLocation = db.prepare(`
    INSERT INTO buy_locations (component_id, location_name, system, planet_moon, shop_name, shop_type, price, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'wiki')
  `);
  let count = 0;
  let skipped = 0;
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
      const grade = normalizeGrade(weapon.grade);
      const stats = {
        ...(grade !== undefined ? { grade } : {}),
        dps, alpha: Number(vw.damage_per_shot) || 0, fire_rate: Number(vw.rpm) || 0,
        range: Number(vw.range) || 0, capacity: Number(vw.capacity) || 0,
      };
      const wepId = String(weapon.uuid || weapon.class_name || `weapon_${count}`);
      const weaponName = String(weapon.name || "Unknown Weapon");
      const image = (weapon.images?.[0]?.thumbnail_url || weapon.images?.[0]?.original_url) || "";
      const weaponClass = weapon.class || weapon.sub_type || "";

      // Validate before inserting
      const validation = validateComponent("Weapon", weaponName, stats, 0);
      if (!validation.valid) {
        console.log(`  [SKIP] Weapon "${weaponName}": ${validation.reason}`);
        skipped++;
        continue;
      }

      insertComponent.run([
        wepId, weaponName, String(weapon.class_name || weapon.name || "Unknown"),
        String(mfg.code || ""), "Weapon", Number(weapon.size) || 1, String(weaponClass),
        JSON.stringify(stats), String(image)
      ]);

      const { price, locations } = extractWikiPurchaseInfo(weapon);
      if (price !== null && price > 0) {
        updatePrice.run([wepId, price]);
      }
      for (const loc of locations) {
        insertLocation.run([wepId, loc.location_name, loc.system, loc.planet_moon, loc.shop_name, "Terminal", loc.price]);
      }

      count++;
    } catch (e) {
      console.warn(`Failed to sync weapon ${weapon?.name}:`, e);
    }
  }
  if (skipped > 0) console.log(`  Skipped ${skipped} invalid weapons`);
  return count;
}

export function buildWikiItemMap(wikiItems: any[]): Map<string, any> {
  const map = new Map<string, any>();
  for (const item of wikiItems) {
    const cn = String(item.class_name || "");
    if (cn) map.set(cn.toLowerCase(), item);
  }
  return map;
}

export function extractPortComponents(vehicles: any[]): Map<string, any> {
  const slotTypes = ["Shield", "PowerPlant", "Cooler", "QuantumDrive", "Radar", "LifeSupportGenerator", "FlightController", "Missile", "EMP", "QED"];
  const map = new Map<string, any>();
  for (const vehicle of vehicles) {
    const v = vehicle || {};
    if (!v.ports || !Array.isArray(v.ports)) continue;
    for (const port of v.ports) {
      if (!port || typeof port !== "object") continue;
      const pType = port.type || "";
      if (!slotTypes.includes(pType)) continue;
      const class_name = String(port.class_name || "");
      if (!class_name) continue;
      const key = `${pType}_${class_name}`;
      if (!map.has(key)) {
        const portSizes = port.sizes || {};
        const equipped = port.equipped_item || {};
        const equipMfg = equipped.manufacturer || {};
        map.set(key, {
          type: pType, class_name,
          name: String(equipped.name || class_name.replace(/_/g, " ")),
          size: Number(portSizes.min || port.size) || 1,
          sub_type: String(port.sub_type || ""),
          manufacturer_name: String(equipMfg.name || ""),
          grade: Number(equipped.grade) || 0,
        });
      }
    }
  }
  return map;
}

export function normalizeGrade(grade: any): number | undefined {
  if (typeof grade === "number" && Number.isFinite(grade)) return grade;
  const g = String(grade || "").toUpperCase().trim();
  if (g === "A" || g === "1") return 1;
  if (g === "B" || g === "2") return 2;
  if (g === "C" || g === "3") return 3;
  if (g === "D" || g === "4") return 4;
  return undefined;
}

export function extractWikiStats(compType: string, wikiItem: any): Record<string, any> {
  const stats: Record<string, any> = {};

  if (compType === "Shield" && wikiItem.shield) {
    const s = wikiItem.shield;
    stats.hp = s.max_health || 0;
    stats.max_hp = s.max_shield_health || s.max_health || 0;
    stats.regen_rate = s.regen_rate || s.max_shield_regen || 0;
    stats.regen_time = s.regen_time || 0;
    stats.decay_ratio = s.decay_ratio || 0;
    if (s.absorption) stats.absorption = s.absorption;
    if (s.resistance) stats.resistance = s.resistance;
    if (s.regen_delay) {
      stats.regen_delay_downed = s.regen_delay.downed || 0;
      stats.regen_delay_damage = s.regen_delay.damage || 0;
    }
    if (s.reserve_pool) {
      stats.reserve_regen_rate = s.reserve_pool.regen_rate || 0;
      stats.reserve_regen_time = s.reserve_pool.regen_time || 0;
    }
  } else if (compType === "Shield" && wikiItem.durability) {
    stats.hp = wikiItem.durability.health || 0;
  } else if (compType === "PowerPlant" && wikiItem.power_plant) {
    const pp = wikiItem.power_plant;
    stats.output = pp.power_output || 0;
    stats.power_segment_generation = pp.power_segment_generation || 0;
    if (wikiItem.temperature) {
      stats.overheat_threshold = wikiItem.temperature.overheat_threshold || 0;
    }
    if (wikiItem.durability) {
      stats.component_hp = wikiItem.durability.health || 0;
      if (wikiItem.durability.resistance) {
        stats.resistance = wikiItem.durability.resistance;
      }
    }
  } else if (compType === "Cooler") {
    const c = wikiItem.cooler || {};
    stats.cooling_rate = c.cooling_rate || c.coolant_segment_generation || 0;
    stats.suppression_ir = c.suppression_ir_factor || 0;
    stats.suppression_heat = c.suppression_heat_factor || 0;
  } else if (compType === "QuantumDrive" && wikiItem.quantum_drive) {
    const qd = wikiItem.quantum_drive;
    const sj = qd.standard_jump || {};
    stats.travel_speed = sj.drive_speed || 0;
    stats.spool_time = sj.spool_up_time || 0;
    stats.cooldown = sj.cooldown_time || 0;
    stats.fuel_efficiency = qd.fuel_efficiency || 0;
    stats.fuel_rate = qd.fuel_rate || 0;
    stats.fuel_consumption_scu_per_gm = qd.fuel_consumption_scu_per_gm || 0;
    stats.disconnect_range = qd.disconnect_range || 0;
    stats.travel_time_10gm = qd.travel_time_10gm?.seconds || 0;
    stats.accel_rate = sj.stage_two_accel_rate || 0;
    if (qd.spline_jump) {
      stats.spline_speed = qd.spline_jump.drive_speed || 0;
    }
    const jumpRange = Number(qd.jump_range);
    if (Number.isFinite(jumpRange) && jumpRange > 0 && jumpRange < 1e30) {
      stats.quantum_fuel_claimed = jumpRange;
    }
  } else if (compType === "Radar" && wikiItem.radar) {
    const r = wikiItem.radar;
    const aimAssist = r.aim_assist || {};
    // The Wiki API does not expose a field literally named detection_range.
    // Its operational range is represented by the maximum aim-assignment distance.
    stats.cooldown = r.cooldown || 0;
    stats.detection_range = r.detection_range || r.range || aimAssist.distance_max_assignment || 0;
    stats.assignment_distance_min = aimAssist.distance_min_assignment || 0;
    stats.assignment_distance_max = aimAssist.distance_max_assignment || 0;
    stats.outside_range_buffer = aimAssist.outside_range_buffer_distance || 0;
    if (r.sensitivity) {
      stats.sensitivity_ir = r.sensitivity.infrared || 0;
      stats.sensitivity_cs = r.sensitivity.cross_section || 0;
      stats.sensitivity_em = r.sensitivity.electromagnetic || 0;
      stats.sensitivity_resource = r.sensitivity.resource || 0;
      stats.sensitivity_db = r.sensitivity.db || 0;
    }
    if (r.ground_vehicle_sensitivity) {
      stats.ground_sensitivity_ir = r.ground_vehicle_sensitivity.infrared || 0;
      stats.ground_sensitivity_cs = r.ground_vehicle_sensitivity.cross_section || 0;
      stats.ground_sensitivity_em = r.ground_vehicle_sensitivity.electromagnetic || 0;
    }
    if (r.piercing) {
      stats.piercing_ir = r.piercing.infrared || 0;
      stats.piercing_cs = r.piercing.cross_section || 0;
      stats.piercing_em = r.piercing.electromagnetic || 0;
    }
  } else if (compType === "FlightController" && wikiItem.flight_controller) {
    const fc = wikiItem.flight_controller;
    stats.scm_speed = fc.scm_speed || 0;
    stats.max_speed = fc.max_speed || 0;
    stats.boost_forward = fc.boost_speed_forward || 0;
    stats.pitch = fc.pitch || 0;
    stats.yaw = fc.yaw || 0;
    stats.roll = fc.roll || 0;
  } else if (compType === "Missile" && wikiItem.missile) {
    const m = wikiItem.missile;
    stats.alpha = m.damage || 0;
    stats.range = m.range || 0;
    stats.velocity = m.speed || 0;
    stats.capacity = m.capacity || 0;
  } else if (compType === "EMP" && wikiItem.emp) {
    stats.range = wikiItem.emp.range || 0;
    stats.emission_em_max = wikiItem.emp.emission_em || 0;
  } else if (compType === "QED" && wikiItem.qed) {
    stats.range = wikiItem.qed.range || 0;
    stats.cooldown = wikiItem.qed.cooldown || 0;
  } else if (compType === "LifeSupport" && wikiItem.life_support_generator) {
    const ls = wikiItem.life_support_generator;
    stats.output = ls.power_output || 0;
    stats.emission_em_max = ls.emission_em || 0;
  }

  if (wikiItem.emission) {
    stats.emission_ir = wikiItem.emission.ir || 0;
    stats.emission_em_min = wikiItem.emission.em_min || 0;
    stats.emission_em_max = wikiItem.emission.em_max || 0;
  }
  if (wikiItem.durability && compType !== "Shield" && compType !== "PowerPlant") {
    stats.component_hp = wikiItem.durability.health || 0;
  }
  return stats;
}

/** Deliberately leaves unavailable statistics absent rather than estimating them. */
export function applyFallbackEstimates(
  _stats: Record<string, any>,
  _compType: string,
  _size: number,
  _grade: number | undefined,
): void {
  void _stats;
  void _compType;
  void _size;
  void _grade;
}

/**
 * Legacy compatibility helper. An unavailable price is represented by null;
 * callers must only persist prices supplied by an upstream source.
 */
export function computeEstimatedPrice(_compType: string, _size: number, _grade: number): null {
  void _compType;
  void _size;
  void _grade;
  return null;
}

export function syncComponentsFromPorts(
  db: Database,
  portComponentMap: Map<string, any>,
  wikiItemMap: Map<string, any>,
  onProgress?: (step: string, progress: number) => void
): number {
  void onProgress;
  const insertComponent = db.prepare(`
    INSERT OR REPLACE INTO components (id, name, class_name, manufacturer_code, type, size, class, stats, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updatePrice = db.prepare(`
    INSERT OR REPLACE INTO component_prices (component_id, price_auec, updated_at, source)
    VALUES (?, ?, datetime('now'), 'wiki')
  `);
  const insertLocation = db.prepare(`
    INSERT INTO buy_locations (component_id, location_name, system, planet_moon, shop_name, shop_type, price, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'wiki')
  `);

  let count = 0;
  let skipped = 0;
  for (const comp of portComponentMap.values()) {
    try {
      const compId = String(comp.class_name);
      const compType = comp.type === "LifeSupportGenerator" ? "LifeSupport" : comp.type;
      const size = Number(comp.size) || 1;

      const wikiItem = wikiItemMap.get(comp.class_name.toLowerCase());
      const stats: Record<string, any> = {};
      let price: number | null = null;
      let imageUrl = "";
      let componentClass = comp.sub_type || "";

      let purchaseLocations: ReturnType<typeof extractWikiPurchaseInfo>["locations"] = [];
      if (wikiItem) {
        Object.assign(stats, extractWikiStats(compType, wikiItem));
        const purchaseInfo = extractWikiPurchaseInfo(wikiItem);
        price = purchaseInfo.price;
        purchaseLocations = purchaseInfo.locations;
        if (wikiItem.images?.[0]) {
          imageUrl = wikiItem.images?.[0]?.thumbnail_url || wikiItem.images?.[0]?.original_url || "";
        }
        if (wikiItem.name) comp.name = wikiItem.name;
        if (wikiItem.class) componentClass = String(wikiItem.class);
      }

      const grade = normalizeGrade(wikiItem?.grade ?? comp.grade);
      if (grade !== undefined) stats.grade = grade;

      applyFallbackEstimates(stats, compType, size, grade);

      // Validate before inserting
      const compName = String(comp.name || comp.class_name);
      const validation = validateComponent(compType, compName, stats, price ?? 0);
      if (!validation.valid) {
        console.log(`  [SKIP] ${compType} "${compName}" (S${size}): ${validation.reason}`);
        skipped++;
        continue;
      }

      insertComponent.run([
        compId, String(comp.name), String(comp.class_name), String(comp.manufacturer_name || ""),
        compType, size, componentClass, JSON.stringify(stats), imageUrl
      ]);

      if (price !== null && price > 0) {
        updatePrice.run([compId, price]);
      }
      for (const loc of purchaseLocations) {
        insertLocation.run([compId, loc.location_name, loc.system, loc.planet_moon, loc.shop_name, "Terminal", loc.price]);
      }

      count++;
    } catch (e) {
      console.warn(`Failed to sync component ${comp.class_name}:`, e);
    }
  }
  if (skipped > 0) console.log(`  Skipped ${skipped} invalid components`);
  return count;
}

export function copyBaseImagesToSpecialEditions(db: Database): number {
  const shipsMissing = db.prepare(
    "SELECT id, name, class_name FROM ships WHERE (image_url IS NULL OR image_url = '')"
  ).all() as any[];
  const baseStmt = db.prepare(
    "SELECT image_url FROM ships WHERE class_name = ? AND image_url IS NOT NULL AND image_url != '' LIMIT 1"
  );
  let copied = 0;
  for (const ship of shipsMissing) {
    const cn = ship.class_name || '';
    const base = cn
      .replace(/_Collector_\w+$/i, '').replace(/_Exec_\w+$/i, '').replace(/_BTALA$/i, '')
      .replace(/_Showdown$/i, '').replace(/_Military$/i, '').replace(/_Industrial$/i, '')
      .replace(/_Stealth$/i, '').replace(/_Medic$/i, '').replace(/_Mod$/i, '')
      .replace(/_Competition$/i, '').replace(/_Grad02$/i, '').replace(/_Indust$/i, '')
      .replace(/_Milt$/i, '').replace(/_Civet$/i, '').replace(/_Civilian$/i, '')
      .replace(/_IKTI_ARGOS$/i, '').replace(/_IKTI$/i, '').replace(/_Argos$/i, '')
      .replace(/CitizenCon\d+$/i, '');
    if (base === cn || base.length < 4) continue;
    const baseRow = baseStmt.get(base) as any;
    if (baseRow?.image_url) {
      db.prepare("UPDATE ships SET image_url = ? WHERE id = ?").run(baseRow.image_url, ship.id);
      copied++;
    }
  }
  return copied;
}
