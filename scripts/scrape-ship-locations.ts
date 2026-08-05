import Database from "better-sqlite3";
import * as cheerio from "cheerio";

const DB_PATH = "data/sc-loadout.db";
const URL = "https://scfocus.org/ship-sale-rental-locations-history/";

interface ShipLocation {
  ship_name: string;
  price_auec: number;
  location_name: string;
  shop_name: string;
  location_type: "sale" | "rental" | "earn";
}

async function fetchPage(): Promise<string> {
  const res = await fetch(URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SC-Loadout-Advisor/1.0)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function parsePrice(text: string): number {
  const cleaned = text.replace(/[^0-9]/g, "");
  return parseInt(cleaned) || 0;
}

function parseShipsFromPage(html: string): ShipLocation[] {
  const $ = cheerio.load(html);
  const locations: ShipLocation[] = [];

  $("table").each((_: number, table: any) => {
    const $table = $(table);
    const headers = $table.find("th").map((_: any, th: any) => $(th).text().trim().toLowerCase()).get();

    if (headers.length === 0) return;

    // Detect type from headers
    let locationType: "sale" | "rental" | "earn" = "sale";
    const headerStr = headers.join(" ");
    if (headerStr.includes("rental price") || headerStr.includes("rental location")) {
      locationType = "rental";
    } else if (headerStr.includes("earn") || headerStr.includes("wikelo") || headerStr.includes("location proximity")) {
      locationType = "earn";
    } else if (headerStr.includes("price in game") || headerStr.includes("sale location")) {
      locationType = "sale";
    }

    // Find column indices
    const shipCol = headers.findIndex((h: string) => h.includes("ship"));
    const priceCol = headers.findIndex((h: string) => h.includes("price"));
    const locationCol = headers.findIndex((h: string) => h.includes("location"));

    if (shipCol === -1) return;

    $table.find("tr").each((_: any, row: any) => {
      const cells = $(row).find("td");
      if (cells.length < 2) return;

      const shipName = $(cells[shipCol]).text().trim();
      if (!shipName || shipName.toLowerCase() === "ship") return;

      // For earn tables, there's no price column
      let price = 0;
      if (priceCol >= 0 && cells.length > priceCol) {
        price = parsePrice($(cells[priceCol]).text());
      }

      let locName = "";
      if (locationCol >= 0 && cells.length > locationCol) {
        locName = $(cells[locationCol]).text().trim();
      } else if (locationType === "earn") {
        // For earn tables, the location is often in the last column
        locName = $(cells[cells.length - 1]).text().trim();
      }

      // Parse location
      let shopName = locName;
      let cleanLocation = locName;
      const locMatch = locName.match(/^(.+?)\s*\((.+?)\)$/);
      if (locMatch) {
        shopName = locMatch[1].trim();
        cleanLocation = locMatch[2].trim();
      } else if (locName.includes(" - ")) {
        const parts = locName.split(" - ");
        shopName = parts[0].trim();
        cleanLocation = parts.slice(1).join(" - ").trim();
      }

      // For earn type, set price to 0 (can't buy)
      if (locationType === "earn") price = 0;

      locations.push({
        ship_name: shipName,
        price_auec: price,
        location_name: cleanLocation || locName,
        shop_name: shopName,
        location_type: locationType,
      });
    });
  });

  return locations;
}

function saveToDb(locations: ShipLocation[]): void {
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

  const insert = db.prepare(`
    INSERT INTO ship_buy_locations (ship_name, price_auec, location_name, shop_name, location_type)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((locs: ShipLocation[]) => {
    for (const loc of locs) {
      insert.run([loc.ship_name, loc.price_auec, loc.location_name, loc.shop_name, loc.location_type]);
    }
  });

  insertMany(locations);

  const total = db.prepare("SELECT COUNT(*) as n FROM ship_buy_locations").get() as any;
  const sales = db.prepare("SELECT COUNT(*) as n FROM ship_buy_locations WHERE location_type = 'sale'").get() as any;
  const rentals = db.prepare("SELECT COUNT(*) as n FROM ship_buy_locations WHERE location_type = 'rental'").get() as any;
  const earns = db.prepare("SELECT COUNT(*) as n FROM ship_buy_locations WHERE location_type = 'earn'").get() as any;

  console.log(`Saved ${total.n} locations (${sales.n} sale, ${rentals.n} rental, ${earns.n} earn)`);

  const ships = db.prepare("SELECT DISTINCT ship_name FROM ship_buy_locations ORDER BY ship_name").all() as any[];
  console.log(`Unique ships: ${ships.length}`);

  // Show some earn locations
  const earnSample = db.prepare("SELECT * FROM ship_buy_locations WHERE location_type = 'earn' LIMIT 5").all();
  console.log("\nEarn locations sample:");
  earnSample.forEach((l: any) => console.log(`  ${l.ship_name} @ ${l.shop_name}`));

  // Show some rental locations
  const rentalSample = db.prepare("SELECT * FROM ship_buy_locations WHERE location_type = 'rental' LIMIT 5").all();
  console.log("\nRental locations sample:");
  rentalSample.forEach((l: any) => console.log(`  ${l.ship_name}: ${l.price_auec.toLocaleString()} @ ${l.shop_name}`));

  db.close();
}

async function main() {
  console.log("Fetching scfocus.org...");
  const html = await fetchPage();
  console.log(`Page fetched (${html.length} bytes)`);

  console.log("Parsing ship locations...");
  const locations = parseShipsFromPage(html);
  console.log(`Found ${locations.length} ship locations`);

  console.log("\nSaving to database...");
  saveToDb(locations);

  console.log("Done!");
}

main().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
