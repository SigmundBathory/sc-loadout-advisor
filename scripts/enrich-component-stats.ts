/**
 * Script para enriquecer los stats de componentes desde la Wiki API
 * Este script hace fetch individual de cada componente para obtener todos los stats disponibles
 * y actualiza la base de datos SQLite con la informacion completa.
 */

import { getDb } from "../src/lib/db/schema";
import { getItems } from "../src/lib/api/starCitizenWiki";
import { extractWikiStats, validateComponent, normalizeGrade } from "../src/lib/db/syncHelpers";

const BATCH_SIZE = 50; // Procesar en batches para evitar rate limiting
const DELAY_BETWEEN_BATCHES = 2000; // 2 segundos entre batches

interface ComponentToEnrich {
  id: string;
  class_name: string;
  type: string;
  size: number;
  current_stats: Record<string, any>;
}

/**
 * Obtiene todos los componentes de la base de datos que necesitan enriquecimiento
 */
function getComponentsNeedingEnrichment(db: any): ComponentToEnrich[] {
  const rows = db.prepare(`
    SELECT id, class_name, type, size, stats 
    FROM components 
    WHERE stats IS NULL OR stats = '{}' OR 
          (type IN ('Shield', 'PowerPlant', 'Cooler', 'QuantumDrive') AND 
           (stats NOT LIKE '%"hp"%' AND type = 'Shield') OR
           (stats NOT LIKE '%"output"%' AND type = 'PowerPlant') OR
           (stats NOT LIKE '%"cooling_rate"%' AND type = 'Cooler'))
    LIMIT 1000
  `).all() as any[];

  return rows.map(row => ({
    id: row.id,
    class_name: row.class_name,
    type: row.type,
    size: row.size || 1,
    current_stats: row.stats ? JSON.parse(row.stats) : {}
  }));
}

/**
 * Obtiene los stats completos de un componente desde la Wiki API
 */
async function fetchComponentStats(className: string, componentType: string): Promise<Record<string, any>> {
  try {
    // Intentar obtener el item por class_name
    const response = await getItems(componentType, undefined);
    const items = response.data || [];
    
    // Buscar el item por class_name (case insensitive)
    const item = items.find((i: any) => 
      (i.class_name || "").toLowerCase() === className.toLowerCase()
    );
    
    if (item) {
      return extractWikiStats(componentType, item);
    }
    
    // Si no se encuentra por tipo, intentar con todos los tipos
    const allTypes = ["Shield", "PowerPlant", "Cooler", "QuantumDrive", "Radar", "FlightController", "LifeSupport"];
    for (const type of allTypes) {
      if (type === componentType) continue;
      const resp = await getItems(type, undefined);
      const found = resp.data?.find((i: any) => 
        (i.class_name || "").toLowerCase() === className.toLowerCase()
      );
      if (found) {
        return extractWikiStats(type, found);
      }
    }
    
    return {};
  } catch (error) {
    console.warn(`Error fetching stats for ${className}:`, error);
    return {};
  }
}

/**
 * Aplica estimaciones basadas en tamaño y tipo para stats que no se pueden obtener
 */
function applySizeBasedEstimates(
  stats: Record<string, any>,
  compType: string,
  size: number
): Record<string, any> {
  const estimated = { ...stats };
  
  // Estimaciones para Shields
  if (compType === "Shield") {
    if (!estimated.hp || estimated.hp === 0) {
      // HP base por tamaño (valores aproximados de la comunidad)
      const baseHp: Record<number, number> = { 1: 2500, 2: 15000, 3: 150000, 4: 350000 };
      estimated.hp = baseHp[size] || baseHp[3];
      estimated.max_hp = estimated.hp;
    }
    if (!estimated.regen_rate || estimated.regen_rate === 0) {
      // Regen rate base por tamaño
      const baseRegen: Record<number, number> = { 1: 500, 2: 3500, 3: 25000, 4: 60000 };
      estimated.regen_rate = baseRegen[size] || baseRegen[3];
    }
  }
  
  // Estimaciones para Power Plants
  if (compType === "PowerPlant") {
    if (!estimated.output || estimated.output === 0) {
      // Output base por tamaño
      const baseOutput: Record<number, number> = { 1: 5000, 2: 25000, 3: 200000, 4: 500000 };
      estimated.output = baseOutput[size] || baseOutput[3];
    }
  }
  
  // Estimaciones para Coolers
  if (compType === "Cooler") {
    if (!estimated.cooling_rate || estimated.cooling_rate === 0) {
      // Cooling rate base por tamaño
      const baseCooling: Record<number, number> = { 1: 1000000, 2: 5000000, 3: 30000000, 4: 100000000 };
      estimated.cooling_rate = baseCooling[size] || baseCooling[3];
    }
  }
  
  // Estimaciones para Quantum Drives
  if (compType === "QuantumDrive") {
    if (!estimated.travel_speed || estimated.travel_speed === 0) {
      // Travel speed base por tamaño
      const baseSpeed: Record<number, number> = { 1: 150000, 2: 250000, 3: 300000, 4: 400000 };
      estimated.travel_speed = (baseSpeed[size] || baseSpeed[3]) * 1000; // Convertir a m/s
    }
    if (!estimated.quantum_fuel_claimed || estimated.quantum_fuel_claimed === 0) {
      // Fuel capacity base por tamaño
      const baseFuel: Record<number, number> = { 1: 580, 2: 2500, 3: 10000, 4: 100000 };
      estimated.quantum_fuel_claimed = baseFuel[size] || baseFuel[3];
    }
  }
  
  return estimated;
}

/**
 * Funcion principal para enriquecer stats de componentes
 */
async function enrichComponentStats() {
  const db = getDb();
  
  console.log("🔍 Obteniendo componentes que necesitan enriquecimiento...");
  const components = getComponentsNeedingEnrichment(db);
  
  if (components.length === 0) {
    console.log("✅ Todos los componentes ya tienen stats completos!");
    return;
  }
  
  console.log(`📊 Encontrados ${components.length} componentes para enriquecer`);
  
  const updateStmt = db.prepare(`
    UPDATE components SET stats = ?, updated_at = datetime('now') WHERE id = ?
  `);
  
  let processed = 0;
  let enriched = 0;
  let skipped = 0;
  
  // Procesar en batches
  for (let i = 0; i < components.length; i += BATCH_SIZE) {
    const batch = components.slice(i, i + BATCH_SIZE);
    console.log(`\n🚀 Procesando batch ${i / BATCH_SIZE + 1} (${batch.length} componentes)...`);
    
    for (const comp of batch) {
      try {
        // Obtener stats desde Wiki API
        const wikiStats = await fetchComponentStats(comp.class_name, comp.type);
        
        // Aplicar estimaciones basadas en tamaño si faltan stats
        let finalStats = { ...comp.current_stats, ...wikiStats };
        
        // Si no se obtuvieron stats de Wiki, aplicar estimaciones
        if (Object.keys(wikiStats).length === 0) {
          finalStats = applySizeBasedEstimates(finalStats, comp.type, comp.size);
        } else {
          // Aun asi, aplicar estimaciones para stats faltantes
          finalStats = applySizeBasedEstimates(finalStats, comp.type, comp.size);
        }
        
        // Validar el componente
        const validation = validateComponent(comp.type, comp.class_name, finalStats, 0);
        if (!validation.valid) {
          console.log(`  ⚠️  Skipped ${comp.type} "${comp.class_name}": ${validation.reason}`);
          skipped++;
          continue;
        }
        
        // Actualizar en base de datos
        updateStmt.run([JSON.stringify(finalStats), comp.id]);
        enriched++;
        
      } catch (error) {
        console.log(`  ❌ Error processing ${comp.class_name}:`, error);
        skipped++;
      }
      
      processed++;
      if (processed % 10 === 0) {
        console.log(`  ✓ Procesados ${processed}/${components.length}`);
      }
    }
    
    // Esperar entre batches para evitar rate limiting
    if (i + BATCH_SIZE < components.length) {
      console.log(`⏳ Esperando ${DELAY_BETWEEN_BATCHES / 1000} segundos antes del proximo batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  console.log(`\n📈 Resumen:`);
  console.log(`  ✅ Enriquecidos: ${enriched}`);
  console.log(`  ⚠️  Saltados: ${skipped}`);
  console.log(`  📊 Total procesados: ${processed}`);
}

/**
 * Funcion para enriquecer todos los componentes de un tipo especifico
 */
async function enrichComponentsByType(componentType: string) {
  const db = getDb();
  
  console.log(`🔍 Obteniendo componentes de tipo ${componentType}...`);
  const rows = db.prepare(`
    SELECT id, class_name, type, size, stats 
    FROM components 
    WHERE type = ?
    LIMIT 1000
  `).all(componentType) as any[];
  
  const components = rows.map(row => ({
    id: row.id,
    class_name: row.class_name,
    type: row.type,
    size: row.size || 1,
    current_stats: row.stats ? JSON.parse(row.stats) : {}
  }));
  
  if (components.length === 0) {
    console.log(`✅ No hay componentes de tipo ${componentType} para enriquecer`);
    return;
  }
  
  console.log(`📊 Encontrados ${components.length} componentes de tipo ${componentType}`);
  
  const updateStmt = db.prepare(`
    UPDATE components SET stats = ?, updated_at = datetime('now') WHERE id = ?
  `);
  
  let processed = 0;
  let enriched = 0;
  
  for (const comp of components) {
    try {
      const wikiStats = await fetchComponentStats(comp.class_name, comp.type);
      let finalStats = { ...comp.current_stats, ...wikiStats };
      finalStats = applySizeBasedEstimates(finalStats, comp.type, comp.size);
      
      const validation = validateComponent(comp.type, comp.class_name, finalStats, 0);
      if (!validation.valid) {
        console.log(`  ⚠️  Skipped ${comp.class_name}: ${validation.reason}`);
        continue;
      }
      
      updateStmt.run([JSON.stringify(finalStats), comp.id]);
      enriched++;
      processed++;
      
      if (processed % 10 === 0) {
        console.log(`  ✓ Procesados ${processed}/${components.length}`);
      }
    } catch (error) {
      console.log(`  ❌ Error processing ${comp.class_name}:`, error);
      processed++;
    }
  }
  
  console.log(`\n📈 Resumen para ${componentType}:`);
  console.log(`  ✅ Enriquecidos: ${enriched}`);
  console.log(`  📊 Total procesados: ${processed}`);
}

/**
 * Funcion para verificar el estado de los stats de los componentes
 */
function checkComponentStatsStatus() {
  const db = getDb();
  
  const types = ["Shield", "PowerPlant", "Cooler", "QuantumDrive", "Radar", "FlightController"];
  
  console.log("\n📊 Estado actual de stats por tipo de componente:\n");
  
  for (const type of types) {
    const total = db.prepare(`SELECT COUNT(*) as c FROM components WHERE type = ?`).get(type) as any;
    const withStats = db.prepare(`
      SELECT COUNT(*) as c FROM components 
      WHERE type = ? AND stats IS NOT NULL AND stats != '{}'
    `).get(type) as any;
    const withHp = db.prepare(`
      SELECT COUNT(*) as c FROM components 
      WHERE type = ? AND stats LIKE '%"hp"%'
    `).get(type) as any;
    const withOutput = db.prepare(`
      SELECT COUNT(*) as c FROM components 
      WHERE type = ? AND stats LIKE '%"output"%'
    `).get(type) as any;
    const withCooling = db.prepare(`
      SELECT COUNT(*) as c FROM components 
      WHERE type = ? AND stats LIKE '%"cooling_rate"%'
    `).get(type) as any;
    
    const totalCount = total?.c || 0;
    const withStatsCount = withStats?.c || 0;
    const withHpCount = withHp?.c || 0;
    const withOutputCount = withOutput?.c || 0;
    const withCoolingCount = withCooling?.c || 0;
    
    console.log(`${type.padEnd(15)}: ${totalCount} total, ${withStatsCount} con stats (${Math.round((withStatsCount / totalCount) * 100)}%)`);
    
    if (type === "Shield") {
      console.log(`  - Con HP: ${withHpCount} (${Math.round((withHpCount / totalCount) * 100)}%)`);
    } else if (type === "PowerPlant") {
      console.log(`  - Con Output: ${withOutputCount} (${Math.round((withOutputCount / totalCount) * 100)}%)`);
    } else if (type === "Cooler") {
      console.log(`  - Con Cooling Rate: ${withCoolingCount} (${Math.round((withCoolingCount / totalCount) * 100)}%)`);
    }
  }
}

// Ejecutar el script
async function main() {
  console.log("=".repeat(60));
  console.log("SC Loadout Advisor - Enriquecimiento de Stats de Componentes");
  console.log("=".repeat(60));
  
  // Primero, verificar el estado actual
  checkComponentStatsStatus();
  
  // Enriquecer todos los componentes que lo necesiten
  console.log("\n" + "=".repeat(60));
  console.log("Enriqueciendo stats de componentes...");
  console.log("=".repeat(60) + "\n");
  
  try {
    await enrichComponentStats();
    
    // Verificar el estado despues del enriquecimiento
    console.log("\n" + "=".repeat(60));
    console.log("Estado despues del enriquecimiento:");
    console.log("=".repeat(60));
    checkComponentStatsStatus();
    
    console.log("\n✅ Enriquecimiento completado!");
  } catch (error) {
    console.error("❌ Error durante el enriquecimiento:", error);
    process.exit(1);
  }
}

// Ejecutar solo si este archivo se ejecuta directamente
if (import.meta.url.endsWith(import.meta.filename)) {
  main().catch(console.error);
}

export {
  enrichComponentStats,
  enrichComponentsByType,
  checkComponentStatsStatus,
  fetchComponentStats,
  applySizeBasedEstimates
};
