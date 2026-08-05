const UEX_BASE = "https://api.uexcorp.uk/2.0";
const UEX_TOKEN = process.env.NEXT_PUBLIC_UEX_API_KEY || "";

async function uexFetch<T>(endpoint: string): Promise<T> {
  const url = `${UEX_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (UEX_TOKEN) {
    headers.Authorization = `Bearer ${UEX_TOKEN}`;
  }

  const res = await fetch(url, { headers, cache: "no-store" });

  if (!res.ok) {
    throw new Error(`UEX API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getUexGameVersions() {
  return uexFetch<{ data: { live: string; ptu: string } }>("/game_versions");
}

export async function getUexShips() {
  return uexFetch<{ data: any[] }>("/ships");
}

export async function getUexShipsPrices() {
  return uexFetch<{ data: any[] }>("/ships_prices");
}

export async function getUexItems() {
  return uexFetch<{ data: any[] }>("/items");
}

export async function getUexItemsPrices() {
  return uexFetch<{ data: any[] }>("/items_prices");
}

export async function getUexTerminals() {
  return uexFetch<{ data: any[] }>("/terminals");
}

export async function getUexLocations() {
  return uexFetch<{ data: any[] }>("/locations");
}

export async function getUexItemsTerminals() {
  return uexFetch<{ data: any[] }>("/items_terminals");
}

export default {
  getUexGameVersions,
  getUexShips,
  getUexShipsPrices,
  getUexItems,
  getUexItemsPrices,
  getUexTerminals,
  getUexLocations,
  getUexItemsTerminals,
};
