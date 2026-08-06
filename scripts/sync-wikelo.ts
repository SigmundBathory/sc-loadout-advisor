import Database from "better-sqlite3";

const DB_PATH = "data/sc-loadout.db";
const CSV_URL = "https://docs.google.com/spreadsheets/d/1ji0q_pp6iW35RG1YyFEsv-lsmZOaCStJXGdIEdLLwhM/export?format=csv&gid=481073732";

interface WikeloShip {
  ship_name: string;
  mission_name: string;
  cost_description: string;
  reputation_required: string;
  components_description: string;
}

async function fetchCsv(): Promise<string> {
  const res = await fetch(CSV_URL, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// Known Wikelo ship names from the sheet
const WIKELO_SHIPS = [
  "Golem", "Fortune", "Ursa Medivac", "Intrepid", "Nox", "Pulse",
  "Prospector", "RAFT", "C1 Spirit", "Sabre Peregrine",
  "L-21 Wolf Stealth", "L-21 Wolf Military", "Zeus ES", "Guardian",
  "Mirai Guardian MX", "RSI Meteor", "Ares Ion", "Ares Inferno",
  "Sabre Firebird", "Scorpius", "Super Hornet Mk II", "Terrapin Medic",
  "Guardian QI", "Zeus CL", "Starlancer MAX", "Constellation Taurus",
  "Apollo Triage", "F8C Lightning Military", "F8C Lightning Stealth",
  "Starlancer TAC", "A2 Hercules", "Asgard", "Prowler Utility", "Idris-P",
  "Polaris"
];

function parseCsv(csv: string): WikeloShip[] {
  const lines = csv.split("\n");
  const ships: WikeloShip[] = [];
  const shipSet = new Set<string>();

  let currentShipLeft = "";
  let currentShipRight = "";
  let componentsLeft: string[] = [];
  let componentsRight: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (line.includes("Pictures") || line.includes("Mission Turn-In") || line.includes("Where to Source") || line.includes("Notes") || line.includes("Further Reading")) break;

    const parts = line.split(",");
    const left = parts.slice(0, 10);
    const right = parts.slice(10);

    // Check for ship name line (has # column)
    const leftHasHash = left.some(p => p.trim() === "#");
    const rightHasHash = right.some(p => p.trim() === "#");

    if (leftHasHash || rightHasHash) {
      // This is a ship header line
      if (leftHasHash) {
        const shipIdx = left.findIndex(p => p.trim() === "#");
        if (shipIdx > 0) currentShipLeft = left[shipIdx - 1].trim();
        componentsLeft = [];
      }
      if (rightHasHash) {
        const shipIdx = right.findIndex(p => p.trim() === "#");
        if (shipIdx > 0) currentShipRight = right[shipIdx - 1].trim();
        componentsRight = [];
      }
      continue;
    }

    // Collect component lines
    const leftComp = left.filter(p => p.trim()).join(", ");
    const rightComp = right.filter(p => p.trim()).join(", ");

    if (currentShipLeft && leftComp && (leftComp.includes("Power Plant") || leftComp.includes("Shield") || leftComp.includes("Quantum Drive") || leftComp.includes("Cooler") || leftComp.includes("Weapons") || leftComp.includes("Other components"))) {
      componentsLeft.push(leftComp);
    }
    if (currentShipRight && rightComp && (rightComp.includes("Power Plant") || rightComp.includes("Shield") || rightComp.includes("Quantum Drive") || rightComp.includes("Cooler") || rightComp.includes("Weapons") || rightComp.includes("Other components"))) {
      componentsRight.push(rightComp);
    }

    // Check for mission/cost lines
    if (leftComp.includes("Mission:") || leftComp.includes("Cost:")) {
      const shipName = matchKnownShip(currentShipLeft) || matchKnownShipFromMission(leftComp);
      if (shipName && !shipSet.has(shipName + "_left")) {
        shipSet.add(shipName + "_left");
        const mission = extractMissionFromLine(leftComp);
        ships.push({
          ship_name: shipName,
          mission_name: mission.mission,
          cost_description: mission.cost,
          reputation_required: mission.reputation,
          components_description: componentsLeft.join("; "),
        });
      }
    }

    if (rightComp.includes("Mission:") || rightComp.includes("Cost:")) {
      const shipName = matchKnownShip(currentShipRight) || matchKnownShipFromMission(rightComp);
      if (shipName && !shipSet.has(shipName + "_right")) {
        shipSet.add(shipName + "_right");
        const mission = extractMissionFromLine(rightComp);
        ships.push({
          ship_name: shipName,
          mission_name: mission.mission,
          cost_description: mission.cost,
          reputation_required: mission.reputation,
          components_description: componentsRight.join("; "),
        });
      }
    }

    // Also check for Cost-only lines (no Mission prefix)
    if ((leftComp.includes("Cost:") || leftComp.includes("Reputation:")) && !leftComp.includes("Mission:")) {
      const shipName = matchKnownShip(currentShipLeft);
      if (shipName && ships.find(s => s.ship_name === shipName)) {
        const existing = ships.find(s => s.ship_name === shipName);
        if (existing && !existing.cost_description) {
          const mission = extractMissionFromLine(leftComp);
          existing.cost_description = mission.cost;
          existing.reputation_required = mission.reputation;
        }
      }
    }
    if ((rightComp.includes("Cost:") || rightComp.includes("Reputation:")) && !rightComp.includes("Mission:")) {
      const shipName = matchKnownShip(currentShipRight);
      if (shipName && ships.find(s => s.ship_name === shipName)) {
        const existing = ships.find(s => s.ship_name === shipName);
        if (existing && !existing.cost_description) {
          const mission = extractMissionFromLine(rightComp);
          existing.cost_description = mission.cost;
          existing.reputation_required = mission.reputation;
        }
      }
    }
  }

  return ships;
}

function matchKnownShip(name: string): string | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const ship of WIKELO_SHIPS) {
    if (lower.includes(ship.toLowerCase()) || ship.toLowerCase().includes(lower)) {
      return ship;
    }
  }
  // Try partial match
  for (const ship of WIKELO_SHIPS) {
    const shipWords = ship.toLowerCase().split(" ");
    if (shipWords.some(w => lower.includes(w) && w.length > 3)) {
      return ship;
    }
  }
  return null;
}

/** Detect the ship from a mission line like "Mission: Now make Polaris." */
function matchKnownShipFromMission(line: string): string | null {
  if (!line) return null;
  const lower = line.toLowerCase();
  for (const ship of WIKELO_SHIPS) {
    const words = ship.toLowerCase().split(" ");
    if (words.every(w => w.length > 1 && lower.includes(w))) {
      return ship;
    }
  }
  return null;
}

function extractMissionFromLine(line: string): { mission: string; cost: string; reputation: string } {
  let mission = "";
  let cost = "";
  let reputation = "";

  const missionMatch = line.match(/Mission:\s*([^"-]+?)(?:\s*-\s*Cost:|$)/);
  if (missionMatch) mission = missionMatch[1].trim();

  const costMatch = line.match(/Cost:\s*(.+?)(?:\s*-\s*Reputation:|$)/);
  if (costMatch) cost = costMatch[1].trim();

  const repMatch = line.match(/Reputation:\s*(.+?)(?:\s*Cost:|$)/);
  if (repMatch) reputation = repMatch[1].trim();

  return { mission, cost, reputation };
}

function saveToDb(ships: WikeloShip[]): void {
  const db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS wikelo_ships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ship_name TEXT NOT NULL,
      mission_name TEXT DEFAULT '',
      cost_description TEXT DEFAULT '',
      reputation_required TEXT DEFAULT '',
      components_description TEXT DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_wikelo_ships_name ON wikelo_ships(ship_name);
  `);

  db.exec("DELETE FROM wikelo_ships");

  const insert = db.prepare(`
    INSERT INTO wikelo_ships (ship_name, mission_name, cost_description, reputation_required, components_description)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((ships: WikeloShip[]) => {
    for (const ship of ships) {
      insert.run([ship.ship_name, ship.mission_name, ship.cost_description, ship.reputation_required, ship.components_description]);
    }
  });

  insertMany(ships);

  const total = db.prepare("SELECT COUNT(*) as n FROM wikelo_ships").get() as any;
  console.log(`Saved ${total.n} Wikelo ships`);

  const all = db.prepare("SELECT * FROM wikelo_ships ORDER BY ship_name").all() as any[];
  all.forEach(s => console.log(`  ${s.ship_name}: ${s.mission_name || "N/A"} | ${s.cost_description.substring(0, 80) || "N/A"}`));

  db.close();
}

async function main() {
  console.log("Fetching Wikelo data from Google Sheets...");
  const csv = await fetchCsv();
  console.log(`CSV fetched (${csv.length} bytes)`);

  console.log("Parsing...");
  const ships = parseCsv(csv);
  console.log(`Found ${ships.length} Wikelo ships`);

  console.log("\nSaving to database...");
  saveToDb(ships);

  console.log("\nDone!");
}

main().catch(e => { console.error("Error:", e); process.exit(1); });
