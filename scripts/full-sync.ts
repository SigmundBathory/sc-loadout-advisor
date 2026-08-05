import { syncDataForVersion, syncGameVersions, checkVersionAndSync } from "../src/lib/db/sync.js";
import Database from "better-sqlite3";
import * as cheerio from "cheerio";

const DB_PATH = "data/sc-loadout.db";
const SCFOCUS_URL = "https://scfocus.org/ship-sale-rental-locations-history/";

interface ShipLocation {
  ship_name: string;
  price_auec: number;
  location_name: string;
  shop_name: string;
  location_type: "sale" | "rental" | "earn";
}

function parsePrice(text: string): number {
  const firstNum = text.match(/[\d,.]+/);
  if (!firstNum) return 0;
  const cleaned = firstNum[0].replace(/[^0-9]/g, "");
  return parseInt(cleaned) || 0;
}

function parseShipsFromPage(html: string): ShipLocation[] {
  const $ = cheerio.load(html);
  const locations: ShipLocation[] = [];

  $("table").each((_: number, table: any) => {
    const $table = $(table);
    const headers = $table.find("th").map((_: any, th: any) => $(th).text().trim().toLowerCase()).get();
    if (headers.length === 0) return;

    let locationType: "sale" | "rental" | "earn" = "sale";
    const headerStr = headers.join(" ");
    if (headerStr.includes("rental price") || headerStr.includes("rental location")) locationType = "rental";
    else if (headerStr.includes("earn") || headerStr.includes("wikelo") || headerStr.includes("location proximity")) locationType = "earn";

    const shipCol = headers.findIndex((h: string) => h.includes("ship"));
    const priceCol = headers.findIndex((h: string) => h.includes("price"));
    const locationCol = headers.findIndex((h: string) => h.includes("location"));
    if (shipCol === -1) return;

    $table.find("tr").each((_: any, row: any) => {
      const cells = $(row).find("td");
      if (cells.length < 2) return;
      const shipName = $(cells[shipCol]).text().trim();
      if (!shipName || shipName.toLowerCase() === "ship") return;

      let price = 0;
      if (priceCol >= 0 && cells.length > priceCol) price = parsePrice($(cells[priceCol]).text());

      let locName = "";
      if (locationCol >= 0 && cells.length > locationCol) locName = $(cells[locationCol]).text().trim();
      else if (locationType === "earn") locName = $(cells[cells.length - 1]).text().trim();

      let shopName = locName;
      let cleanLocation = locName;
      const locMatch = locName.match(/^(.+?)\s*\((.+?)\)$/);
      if (locMatch) { shopName = locMatch[1].trim(); cleanLocation = locMatch[2].trim(); }
      else if (locName.includes(" - ")) { const parts = locName.split(" - "); shopName = parts[0].trim(); cleanLocation = parts.slice(1).join(" - ").trim(); }

      if (locationType === "earn") price = 0;
      locations.push({ ship_name: shipName, price_auec: price, location_name: cleanLocation || locName, shop_name: shopName, location_type: locationType });
    });
  });
  return locations;
}

async function syncShipLocations(): Promise<number> {
  console.log("Fetching scfocus.org ship locations...");
  const res = await fetch(SCFOCUS_URL, { headers: { "User-Agent": "Mozilla/5.0 (compatible; SC-Loadout-Advisor/1.0)" } });
  if (!res.ok) throw new Error(`scfocus.org HTTP ${res.status}`);
  const html = await res.text();
  const locations = parseShipsFromPage(html);
  console.log(`Parsed ${locations.length} ship locations from scfocus.org`);

  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS ship_buy_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ship_name TEXT NOT NULL,
      price_auec REAL DEFAULT 0,
      location_name TEXT NOT NULL,
      shop_name TEXT DEFAULT '',
      location_type TEXT DEFAULT 'sale',
      source TEXT DEFAULT 'scfocus.org',
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_ship_buy_locations_name ON ship_buy_locations(ship_name);
  `);
  db.exec("DELETE FROM ship_buy_locations");

  const insert = db.prepare("INSERT INTO ship_buy_locations (ship_name, price_auec, location_name, shop_name, location_type) VALUES (?, ?, ?, ?, ?)");
  const insertMany = db.transaction((locs: ShipLocation[]) => { for (const loc of locs) insert.run([loc.ship_name, loc.price_auec, loc.location_name, loc.shop_name, loc.location_type]); });
  insertMany(locations);

  const total = db.prepare("SELECT COUNT(*) as n FROM ship_buy_locations").get() as any;
  const sales = db.prepare("SELECT COUNT(*) as n FROM ship_buy_locations WHERE location_type = 'sale'").get() as any;
  const rentals = db.prepare("SELECT COUNT(*) as n FROM ship_buy_locations WHERE location_type = 'rental'").get() as any;
  const earns = db.prepare("SELECT COUNT(*) as n FROM ship_buy_locations WHERE location_type = 'earn'").get() as any;
  console.log(`Ship locations: ${total.n} total (${sales.n} sale, ${rentals.n} rental, ${earns.n} earn)`);
  db.close();
  return total.n;
}

async function main() {
  const startTime = Date.now();
  console.log("=== FULL SYNC START ===\n");

  // 1. Wiki API + UEX sync
  console.log("--- Step 1: Wiki API + UEX Sync ---");
  await syncGameVersions();
  const vc = await checkVersionAndSync();
  console.log(`Wiki version: ${vc.currentVersion}`);
  if (vc.currentVersion) {
    await syncDataForVersion(vc.currentVersion, (step: string, p: number) => console.log(`[${p}%] ${step}`));
  }

  // 2. Ship buy/rent/earn locations
  console.log("\n--- Step 2: Ship Locations (scfocus.org) ---");
  await syncShipLocations();

  // 3. Wikelo ship requirements
  console.log("\n--- Step 3: Wikelo Ships (Google Sheets) ---");
  const { execSync } = await import("child_process");
  execSync("npx tsx scripts/sync-wikelo.ts", { stdio: "inherit", cwd: process.cwd() });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=== FULL SYNC COMPLETE in ${elapsed}s ===`);
}

main().catch(e => { console.error("FAIL:", e); process.exit(1); });
