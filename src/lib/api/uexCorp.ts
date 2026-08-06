const UEX_BASE = "https://api.uexcorp.uk/2.0";

async function uexFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${UEX_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`UEX API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
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

export default {
  getUexGameVersions,
  getUexTerminals,
  getUexCommodities,
  getUexPrices,
  getUexShops,
};