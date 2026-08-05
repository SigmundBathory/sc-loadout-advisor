const WIKI_BASE = "https://api.star-citizen.wiki/api";

interface WikiPage<T> {
  data: T[];
  links?: Record<string, string>;
  meta?: { total: number; current_page: number; last_page: number };
}

async function wikiFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${WIKI_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      return res.json();
    }

    lastError = new Error(`Wiki API error: ${res.status} ${res.statusText}`);
    console.warn(`Wiki API attempt ${attempt + 1} failed: ${res.status} ${res.statusText} for ${endpoint}`);
  }

  throw lastError;
}

async function wikiFetchAllPages(
  endpoint: string,
  baseParams?: Record<string, string>,
  pageSize: number = 200
): Promise<any[]> {
  const allData: any[] = [];
  let page = 1;
  let lastPage = 1;

  while (page <= lastPage) {
    const params: Record<string, string> = {
      ...baseParams,
      "page[number]": String(page),
      "page[size]": String(pageSize),
    };
    const res = await wikiFetch<WikiPage<any[]>>(endpoint, params);
    allData.push(...(res.data || []));
    if (res.meta) {
      lastPage = res.meta.last_page || 1;
    } else {
      break;
    }
    if (allData.length > 0 && !res.meta) break;
    page++;
    // Delay between pages to avoid rate limiting
    if (page <= lastPage) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  return allData;
}

export async function getGameVersions() {
  return wikiFetch<{ data: Array<{ code: string; channel: string; released_at: string; is_default: boolean }> }>(
    "/game-versions"
  );
}

export async function getDefaultVersion() {
  return wikiFetch<{ data: { code: string; version?: string } }>("/game-versions/default");
}

export async function getVehicles(version?: string) {
  const params: Record<string, string> = {};
  if (version) params.version = version;
  const data = await wikiFetchAllPages("/vehicles", params);
  return { data };
}

export async function getVehicle(id: string, version?: string) {
  const params: Record<string, string> = {};
  if (version) params.version = version;
  return wikiFetch<any>(`/vehicles/${id}`, params);
}

export async function getItems(
  type: string,
  version?: string
) {
  const params: Record<string, string> = { "filter[type]": type };
  if (version) params.version = version;
  const data = await wikiFetchAllPages("/items", params);
  return { data };
}

export async function getAllVehicleItems(version?: string) {
  const types = ["Shield", "PowerPlant", "Cooler", "QuantumDrive", "Radar", "FlightController", "LifeSupportGenerator"];
  const allItems: any[] = [];
  for (const type of types) {
    try {
      const res = await getItems(type, version);
      allItems.push(...res.data.map((item: any) => ({ ...item, _wikiType: type })));
      console.log(`Fetched ${res.data.length} ${type} items`);
      // Delay between types to avoid rate limiting
      if (types.indexOf(type) < types.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (e) {
      console.warn(`Failed to fetch ${type} items:`, e);
      // Wait longer on error before retrying next type
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return { data: allItems };
}

export async function getVehicleWeapons(version?: string) {
  const params: Record<string, string> = {};
  if (version) params.version = version;
  const data = await wikiFetchAllPages("/vehicle-weapons", params);
  return { data };
}

export async function getLocations(version?: string) {
  const params: Record<string, string> = {};
  if (version) params.version = version;
  const data = await wikiFetchAllPages("/locations", params);
  return { data };
}

export async function getChangelog(version: string) {
  return wikiFetch<any>(`/game-versions/${version}/changelog`);
}

export async function getChangelogChanges(version: string) {
  return wikiFetch<any>(`/game-versions/${version}/changelog/changes`);
}

export default {
  getGameVersions,
  getDefaultVersion,
  getVehicles,
  getVehicle,
  getItems,
  getVehicleWeapons,
  getLocations,
  getChangelog,
  getChangelogChanges,
};
