import { getDb, seedMissingPricesAndLocations } from "./schema";
import {
  getDefaultVersion,
  getGameVersions,
  getVehicles,
  getVehicleWeapons,
  getAllVehicleItems,
} from "../api/starCitizenWiki";
import {
  getUexGameVersions,
  getUexTerminals,
  getUexCommodities,
  getUexPrices,
  getAllCommoditiesWithPrices,
  hasUexApiKey,
} from "../api/uexCorp";
import {
  startSyncLog,
  finishSyncLog,
  captureVersionSnapshot,
} from "./queries";
import {
  deduplicateVehicles,
  syncManufacturers,
  syncShipsAndHardpoints,
  syncWeapons,
  buildWikiItemMap,
  extractPortComponents,
  syncComponentsFromPorts,
  copyBaseImagesToSpecialEditions,
} from "./syncHelpers";

// A process-local guard prevents overlapping destructive sync jobs. Production
// deployments should still use a distributed job lock when multiple instances
// can run concurrently.
let syncInProgress = false;
let syncStartedAt = 0;
const SYNC_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

function isSyncStuck(): boolean {
  return syncInProgress && Date.now() - syncStartedAt > SYNC_TIMEOUT_MS;
}

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
    } catch (e) { console.warn("UEX version check failed:", e); }

    onProgress?.("Descargando datos del Wiki...", 15);
    const vehiclesRes = await getVehicles(currentVersion);
    const vehicles = vehiclesRes.data || [];
    const uniqueVehicles = deduplicateVehicles(vehicles);

    onProgress?.("Sincronizando fabricantes...", 15);
    syncManufacturers(db, uniqueVehicles);

    onProgress?.("Sincronizando naves...", 25);
    syncShipsAndHardpoints(db, uniqueVehicles, onProgress, 25);

    onProgress?.("Sincronizando armas...", 45);
    const weaponsRes = await getVehicleWeapons(currentVersion);
    const weapons = weaponsRes.data || [];
    const weaponCount = syncWeapons(db, weapons);
    console.log(`Synced ${weaponCount} weapons`);

    onProgress?.("Sincronizando componentes...", 65);
    let wikiItems: any[] = [];
    try {
      const itemsRes = await getAllVehicleItems(currentVersion);
      wikiItems = itemsRes.data || [];
    } catch (e) { console.warn("Failed to fetch Wiki items:", e); }
    const wikiItemMap = buildWikiItemMap(wikiItems);
    const portComponentMap = extractPortComponents(vehicles);
    const compCount = syncComponentsFromPorts(db, portComponentMap, wikiItemMap, onProgress);
    console.log(`Synced ${compCount} components`);

    onProgress?.("Sincronizando ubicaciones UEX...", 75);
    try { await getUexTerminals(); } catch (e) { console.warn("UEX terminals unavailable:", e); }
    seedMissingPricesAndLocations(db);

    onProgress?.("Copiando imágenes...", 92);
    const imgCopied = copyBaseImagesToSpecialEditions(db);
    console.log(`Copied base images to ${imgCopied} special edition ships`);

    onProgress?.("Finalizando...", 95);
    db.prepare(`
      UPDATE sync_meta SET wiki_version = ?, uex_version = ?, last_sync_at = datetime('now'),
        last_prices_sync_at = datetime('now'), sync_status = 'ok'
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
  onProgress?: (step: string, progress: number) => void,
  opts?: { force?: boolean }
): Promise<void> {
  const db = getDb();
  const force = opts?.force ?? false;

  if (syncInProgress && !isSyncStuck()) {
    throw new Error("A data synchronization is already in progress");
  }
  // If sync is stuck (timeout), reset the flag and continue
  if (isSyncStuck()) {
    console.warn("Sync flag was stuck, resetting after timeout");
    syncInProgress = false;
  }

  const existing = db.prepare("SELECT code, is_synced FROM game_versions WHERE code = ?").get(version) as any;
  if (!force && existing?.is_synced) {
    const ships = (db.prepare("SELECT COUNT(*) as c FROM ships").get() as any)?.c || 0;
    const comps = (db.prepare("SELECT COUNT(*) as c FROM components").get() as any)?.c || 0;
    const locs = (db.prepare("SELECT COUNT(*) as c FROM buy_locations").get() as any)?.c || 0;
    onProgress?.(`${version} ya sincronizada — omitiendo (usa force para forzar)`, 100);
    // Update last_sync_at even when skipping to keep dashboard timestamps current
    db.prepare("UPDATE sync_meta SET last_sync_at = datetime('now'), sync_status = 'ok' WHERE id = 1").run();
    finishSyncLog(startSyncLog(version), { status: "ok", ships, components: comps, locations: locs });
    return;
  }

  syncInProgress = true;
  syncStartedAt = Date.now();
  const syncLogId = startSyncLog(version);
  db.prepare("UPDATE sync_meta SET sync_status = 'syncing' WHERE id = 1").run();

  try {
    onProgress?.(`Sincronizando datos para ${version}...`, 5);

    onProgress?.("Verificando version UEX...", 10);
    let uexVersion = "";
    try { const uexRes = await getUexGameVersions(); uexVersion = uexRes.data?.live || ""; } catch (e) { console.warn("UEX version check failed:", e); }

    onProgress?.("Descargando datos del Wiki...", 15);
    const vehiclesRes = await getVehicles(version);
    const vehicles = vehiclesRes.data || [];
    if (vehicles.length === 0) throw new Error(`Wiki returned no vehicles for ${version}`);

    // Fetch all mandatory sources before touching the active dataset. If any
    // source fails, the previous dataset remains intact.
    onProgress?.("Validando armas de la versión...", 18);
    const weaponsRes = await getVehicleWeapons(version);
    const weapons = weaponsRes.data || [];
    if (weapons.length === 0) throw new Error(`Wiki returned no weapons for ${version}`);

    onProgress?.("Validando componentes de la versión...", 20);
    let wikiItems: any[] = [];
    try {
      const itemsRes = await getAllVehicleItems(version);
      wikiItems = itemsRes.data || [];
    } catch (error) {
      throw new Error(`Wiki components could not be fetched: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (wikiItems.length === 0) throw new Error(`Wiki returned no component items for ${version}`);

    // Save images before wipe
    const existingImages = new Map<string, string>();
    const savedRows = db.prepare("SELECT id, image_url FROM ships WHERE image_url IS NOT NULL AND image_url != ''").all() as any[];
    for (const row of savedRows) existingImages.set(row.id, row.image_url);
    console.log(`Saved ${existingImages.size} ship images before sync`);

    db.exec("DELETE FROM hardpoints; DELETE FROM ships; DELETE FROM components; DELETE FROM buy_locations; DELETE FROM component_prices;");

    const uniqueVehicles = deduplicateVehicles(vehicles);

    syncManufacturers(db, uniqueVehicles);

    onProgress?.("Sincronizando naves...", 25);
    syncShipsAndHardpoints(db, uniqueVehicles, onProgress, 25);

    onProgress?.("Sincronizando armas...", 45);
    const weaponCount = syncWeapons(db, weapons);
    console.log(`Synced ${weaponCount} weapons`);

    onProgress?.("Sincronizando componentes...", 65);
    const wikiItemMap = buildWikiItemMap(wikiItems);
    const portComponentMap = extractPortComponents(vehicles);
    const compCount = syncComponentsFromPorts(db, portComponentMap, wikiItemMap, onProgress);
    console.log(`Synced ${compCount} components`);

    onProgress?.("Sincronizando ubicaciones UEX...", 75);
    try { await getUexTerminals(); } catch (e) { console.warn("UEX terminals unavailable:", e); }

    // UEX Commodities & Prices
    onProgress?.("Sincronizando precios UEX...", 80);
    try {
      // Verificar si hay API key configurada
      if (!hasUexApiKey()) {
        console.warn("UEX_API_KEY not configured. Skipping UEX price sync.");
        onProgress?.("UEX API key no configurada - omitiendo precios", 85);
      } else {
        // Usar el nuevo endpoint que ya asocia commodities con precios
        const commoditiesWithPrices = await getAllCommoditiesWithPrices();
        const commodities = commoditiesWithPrices.data || [];
        
        const updatePrice = db.prepare("INSERT OR REPLACE INTO component_prices (component_id, price_auec, updated_at, source) VALUES (?, ?, datetime('now'), 'uex')");
        const insertLocation = db.prepare("INSERT OR REPLACE INTO buy_locations (component_id, location_name, system, planet_moon, shop_name, shop_type, price, source) VALUES (?, ?, ?, ?, ?, ?, ?, 'uex')");
        let uexPriceCount = 0;
        
        for (const commodity of commodities) {
          if (!commodity.name) continue;
          
          const compName = commodity.name.trim().toLowerCase();
          if (!compName) continue;
          
          // Buscar componentes que coincidan exactamente por nombre o class_name
          const ourComponents = db.prepare(
            "SELECT id, name, class_name FROM components WHERE LOWER(name) = ? OR LOWER(class_name) = ?"
          ).all(compName, compName) as any[];
          
          if (ourComponents.length === 0) continue;
          
          // Para cada componente que coincide, actualizar precios y ubicaciones
          for (const comp of ourComponents) {
            const prices = commodity.prices || [];
            
            // Obtener el precio más barato
            const cheapestPrice = prices.length > 0 
              ? Math.min(...prices.map((p: any) => p.price || Infinity).filter((p: number) => p !== Infinity))
              : null;
            
            if (cheapestPrice !== null && !isNaN(cheapestPrice)) {
              updatePrice.run([comp.id, cheapestPrice]);
              uexPriceCount++;
            }
            
            // Guardar todas las ubicaciones con precios
            for (const priceEntry of prices) {
              if (!priceEntry.price) continue;
              insertLocation.run([
                comp.id,
                priceEntry.location_name || priceEntry.shop_name || "UEX Terminal",
                priceEntry.system_name || "Stanton",
                priceEntry.planet_name || "",
                priceEntry.shop_name || "UEX",
                "Terminal",
                priceEntry.price
              ]);
            }
          }
        }
        
        console.log(`Updated ${uexPriceCount} component prices from UEX`);
      }
    } catch (e) { 
      console.warn("UEX commodities/prices unavailable:", e);
      onProgress?.("Error en sincronizacion UEX - usando cache", 85);
    }

    // Apply fallback estimates for components with missing critical stats
    onProgress?.("Aplicando estimaciones a stats faltantes...", 85);
    seedMissingPricesAndLocations(db);

    // Restore saved images
    if (existingImages.size > 0) {
      let restored = 0;
      const restoreStmt = db.prepare("UPDATE ships SET image_url = ? WHERE id = ? AND (image_url IS NULL OR image_url = '')");
      for (const [id, imgUrl] of existingImages) { const r = restoreStmt.run(imgUrl, id); if (r.changes > 0) restored++; }
      console.log(`Restored ${restored} ship images from pre-sync cache`);
    }

    onProgress?.("Copiando imágenes...", 92);
    const imgCopied = copyBaseImagesToSpecialEditions(db);
    console.log(`Copied base images to ${imgCopied} special edition ships`);

    onProgress?.("Finalizando...", 95);
    db.prepare("UPDATE sync_meta SET wiki_version = ?, uex_version = ?, last_sync_at = datetime('now'), last_prices_sync_at = datetime('now'), sync_status = 'ok', selected_wiki_version = ? WHERE id = 1").run([version, uexVersion, version]);
    db.prepare("INSERT OR REPLACE INTO game_versions (code, channel, released_at, is_default, is_synced, last_synced_at) SELECT ?, 'live', '', 0, 1, datetime('now') WHERE NOT EXISTS (SELECT 1 FROM game_versions WHERE code = ?)").run([version, version]);
    db.prepare("UPDATE game_versions SET is_synced = 1, last_synced_at = datetime('now') WHERE code = ?").run([version]);

    const shipTotal = (db.prepare("SELECT COUNT(*) as c FROM ships").get() as any)?.c || 0;
    const compTotal = (db.prepare("SELECT COUNT(*) as c FROM components").get() as any)?.c || 0;
    const locTotal = (db.prepare("SELECT COUNT(*) as c FROM buy_locations").get() as any)?.c || 0;
    console.log(`Sync complete for ${version}: ${shipTotal} ships, ${compTotal} components, ${locTotal} locations`);

    captureVersionSnapshot(version);
    finishSyncLog(syncLogId, { status: "ok", ships: shipTotal, components: compTotal, locations: locTotal });
    onProgress?.("Sincronizacion completada", 100);
  } catch (error) {
    console.error("Sync error:", error);
    db.prepare("UPDATE sync_meta SET sync_status = 'error' WHERE id = 1").run();
    finishSyncLog(syncLogId, { status: "error", error: error instanceof Error ? error.message : String(error) });
    throw error;
  } finally {
    syncInProgress = false;
  }
}
