const UEX_BASE = "https://api.uexcorp.uk/2.0";

// Cache para evitar requests duplicados
const uexCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 horas

async function uexFetch<T>(
  endpoint: string,
  params?: Record<string, string>,
  retries: number = 3
): Promise<T> {
  // Generar clave de cache
  const cacheKey = `${endpoint}:${JSON.stringify(params || {})}`;
  
  // Verificar cache
  const cached = uexCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data as T;
  }

  const url = new URL(`${UEX_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  // Obtener API key de variables de entorno
  const apiKey = process.env.UEX_API_KEY || process.env.NEXT_PUBLIC_UEX_API_KEY;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        headers,
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        // Guardar en cache
        uexCache.set(cacheKey, { data, timestamp: Date.now(), ttl: CACHE_TTL });
        return data as T;
      }

      // Si es error 429 (rate limit), esperar antes de reintentar
      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After") || "5";
        const delay = parseInt(retryAfter) * 1000 || 5000;
        console.warn(`UEX API rate limited. Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      lastError = new Error(`UEX API error: ${res.status} ${res.statusText}`);
    } catch (e) {
      lastError = e as Error;
    }
    
    // Esperar antes del proximo intento
    if (attempt < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  throw lastError;
}

export async function getUexGameVersions() {
  return uexFetch<{ data: { live: string; ptu: string } }>("/game_versions");
}

export async function getUexTerminals() {
  return uexFetch<{ data: any[] }>("/terminals");
}

export async function getUexCommodities() {
  return uexFetch<{ data: any[] }>("/commodities");
}

export async function getUexPrices(commodityId?: string) {
  const params: Record<string, string> = {};
  if (commodityId) params.commodity_id = commodityId;
  return uexFetch<{ data: any[] }>("/prices", params);
}

export async function getUexShops() {
  return uexFetch<{ data: any[] }>("/shops");
}

/**
 * Obtiene todos los commodities (componentes) con sus precios
 */
export async function getAllCommoditiesWithPrices() {
  try {
    const [commoditiesRes, pricesRes] = await Promise.all([
      getUexCommodities(),
      getUexPrices(),
    ]);
    
    const commodities = commoditiesRes.data || [];
    const prices = pricesRes.data || [];
    
    // Crear mapa de commodities por id y nombre
    const commodityMap = new Map<string, any>();
    for (const c of commodities) {
      if (c.id) commodityMap.set(c.id.toLowerCase(), c);
      if (c.name) commodityMap.set(c.name.toLowerCase(), c);
    }
    
    // Asociar precios a commodities
    const commoditiesWithPrices: any[] = [];
    for (const priceEntry of prices) {
      if (!priceEntry.commodity_id || !priceEntry.price) continue;
      
      const commodity = commodityMap.get(priceEntry.commodity_id.toLowerCase());
      if (!commodity) continue;
      
      // Buscar si ya existe este commodity en el array
      const existing = commoditiesWithPrices.find(
        (c: any) => c.id === commodity.id || c.name === commodity.name
      );
      
      if (existing) {
        // Añadir el precio al commodity existente
        if (!existing.prices) existing.prices = [];
        existing.prices.push({
          price: priceEntry.price,
          location_name: priceEntry.location_name,
          system_name: priceEntry.system_name,
          planet_name: priceEntry.planet_name,
          shop_name: priceEntry.shop_name,
          shop_id: priceEntry.shop_id,
          location_id: priceEntry.location_id,
        });
      } else {
        // Crear nuevo commodity con precio
        commoditiesWithPrices.push({
          ...commodity,
          prices: [{
            price: priceEntry.price,
            location_name: priceEntry.location_name,
            system_name: priceEntry.system_name,
            planet_name: priceEntry.planet_name,
            shop_name: priceEntry.shop_name,
            shop_id: priceEntry.shop_id,
            location_id: priceEntry.location_id,
          }],
        });
      }
    }
    
    return { data: commoditiesWithPrices };
  } catch (error) {
    console.warn("Failed to fetch commodities with prices:", error);
    return { data: [] };
  }
}

/**
 * Busca un componente por nombre y devuelve sus precios y ubicaciones
 */
export async function searchComponentPrices(componentName: string) {
  try {
    const allData = await getAllCommoditiesWithPrices();
    const commodities = allData.data || [];
    
    // Buscar por nombre (case insensitive, partial match)
    const matches = commodities.filter((c: any) => 
      c.name && c.name.toLowerCase().includes(componentName.toLowerCase())
    );
    
    if (matches.length === 0) {
      return { data: [] };
    }
    
    // Devolver todos los matches
    return { data: matches };
  } catch (error) {
    console.warn(`Failed to search component prices for ${componentName}:`, error);
    return { data: [] };
  }
}

/**
 * Verifica si la API key de UEX está configurada
 */
export function hasUexApiKey(): boolean {
  return !!(process.env.UEX_API_KEY || process.env.NEXT_PUBLIC_UEX_API_KEY);
}

export default {
  getUexGameVersions,
  getUexTerminals,
  getUexCommodities,
  getUexPrices,
  getUexShops,
  getAllCommoditiesWithPrices,
  searchComponentPrices,
  hasUexApiKey,
};