import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/schema";

interface ImportData {
  version?: string;
  ships?: any[];
  vehicles?: any[];
  components?: any[];
  weapons?: any[];
  locations?: any[];
  type?: "ships" | "components" | "weapons" | "locations" | "full";
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    
    let file: File | null = null;
    let version = "";
    let importType: ImportData["type"] = "full";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      file = formData.get("file") as File;
      version = formData.get("version") as string;
      importType = (formData.get("type") as ImportData["type"]) || "full";
    } else {
      const body = await request.json();
      version = body.version;
      importType = (body.type as ImportData["type"]) || "full";
      
      if (body.fileContent) {
        const binaryStr = atob(body.fileContent);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        file = new File([bytes], body.fileName || "import.json", { type: "application/json" });
      }
    }

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!version) {
      return NextResponse.json(
        { error: "Version is required" },
        { status: 400 }
      );
    }

    const text = await file.text();
    let data: ImportData;

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON file" },
        { status: 400 }
      );
    }

    const db = getDb();
    const imported = { ships: 0, components: 0, hardpoints: 0 };

    const shouldImport = (t: "ships" | "components" | "weapons") =>
      importType === "full" || importType === t;

    const ships = data.ships || data.vehicles || [];
    if (shouldImport("ships") && ships.length > 0) {
      const insertShip = db.prepare(`
        INSERT OR REPLACE INTO ships (id, name, class_name, manufacturer_code, classification, crew, mass, cargo_capacity, scm_speed, max_speed, hull_hp, shield_hp, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertHardpoint = db.prepare(`
        INSERT OR REPLACE INTO hardpoints (id, ship_id, name, slot_type, size, max_size)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const insertManufacturer = db.prepare(
        "INSERT OR REPLACE INTO manufacturers (code, name) VALUES (?, ?)"
      );

      for (const ship of ships) {
        try {
          const mfg = ship.manufacturer || {};
          const shipId = String(ship.id || ship.uuid || ship.class_name || `ship_${imported.ships}`);
          const crew = ship.crew;
          const crewVal = typeof crew === "object" && crew !== null ? (crew.min || crew.max || 1) : (crew || 1);
          const speed = ship.speed || {};
          const image = (ship.images && ship.images[0] && ship.images[0].source) || ship.image_url || "";

          if (mfg.code && mfg.name) {
            insertManufacturer.run([mfg.code, mfg.name]);
          }

          insertShip.run([
            shipId,
            String(ship.name || "Unknown"),
            String(ship.class_name || ship.name || "Unknown"),
            String(mfg.code || ""),
            String(ship.career || ship.classification || ""),
            Number(crewVal) || 1,
            Number(ship.mass) || 0,
            Number(ship.cargo_capacity) || 0,
            Number(speed.scm || ship.scm_speed) || 0,
            Number(speed.max || ship.max_speed) || 0,
            Number(ship.health || ship.hull_hp) || 0,
            Number(ship.shield_hp) || 0,
            String(image)
          ]);

          const ports = ship.ports || ship.hardpoints || [];
          if (Array.isArray(ports)) {
            for (const port of ports) {
              if (!port || typeof port !== "object") continue;
              const portName = String(port.name || port.class_name || "");
              const slotType = detectSlotType(portName, port);
              const portSizes = port.sizes || {};
              const size = Number(portSizes.min || port.size || extractSize(portName)) || 1;
              const maxSize = Number(portSizes.max || port.max_size || size) || size;
              insertHardpoint.run([
                `${shipId}_${portName}`,
                shipId,
                portName,
                slotType,
                size,
                maxSize
              ]);
              imported.hardpoints++;
            }
          }

          imported.ships++;
        } catch (e) {
          console.warn(`Failed to import ship ${ship?.name}:`, e);
        }
      }
    }

    const components = data.components || [];
    if (shouldImport("components") && components.length > 0) {
      const insertComponent = db.prepare(`
        INSERT OR REPLACE INTO components (id, name, class_name, manufacturer_code, type, size, class, stats, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const comp of components) {
        try {
          const compId = String(comp.id || comp.uuid || comp.class_name || `comp_${imported.components}`);
          const mfg = comp.manufacturer || {};
          insertComponent.run([
            compId,
            String(comp.name || "Unknown"),
            String(comp.class_name || comp.name || "Unknown"),
            String(mfg.code || mfg.name || ""),
            String(comp.type || "Unknown"),
            Number(comp.size) || 1,
            String(comp.sub_type || comp.class || ""),
            JSON.stringify(comp.stats || {}),
            String(comp.image_url || "")
          ]);
          imported.components++;
        } catch (e) {
          console.warn(`Failed to import component ${comp?.name}:`, e);
        }
      }
    }

    const weapons = data.weapons || [];
    if (shouldImport("weapons") && weapons.length > 0) {
      const insertComponent = db.prepare(`
        INSERT OR REPLACE INTO components (id, name, class_name, manufacturer_code, type, size, class, stats, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const weapon of weapons) {
        try {
          const mfg = weapon.manufacturer || {};
          const vw = weapon.vehicle_weapon || weapon;
          const modes = vw.modes || [];
          const primaryMode = modes[0] || {};
          let dps = Number(primaryMode.damage_per_second || vw.dps) || 0;
          if (dps === 0) {
            const alpha = Number(vw.damage_per_shot) || 0;
            const rpm = Number(vw.rpm) || 0;
            dps = rpm > 0 ? Math.round((alpha * rpm) / 60) : 0;
          }
          const stats = {
            dps,
            alpha: Number(vw.damage_per_shot || vw.alpha) || 0,
            fire_rate: Number(vw.rpm || vw.fire_rate) || 0,
            range: Number(vw.range) || 0,
          };
          const wepId = String(weapon.uuid || weapon.class_name || weapon.id || `weapon_${imported.components}`);
          const image = (weapon.images && weapon.images[0] && weapon.images[0].source) || weapon.image_url || "";
          insertComponent.run([
            wepId,
            String(weapon.name || "Unknown Weapon"),
            String(weapon.class_name || weapon.name || "Unknown"),
            String(mfg.code || mfg.name || ""),
            "Weapon",
            Number(weapon.size) || 1,
            String(weapon.sub_type || ""),
            JSON.stringify(stats),
            String(image)
          ]);
          imported.components++;
        } catch (e) {
          console.warn(`Failed to import weapon ${weapon?.name}:`, e);
        }
      }
    }

    db.prepare(`
      UPDATE sync_meta SET
        wiki_version = ?,
        last_sync_at = datetime('now'),
        sync_status = 'ok',
        selected_wiki_version = ?
      WHERE id = 1
    `).run([version, version]);

    db.prepare(`
      INSERT OR REPLACE INTO game_versions (code, channel, released_at, is_default, is_synced, last_synced_at)
      VALUES (?, 'ptu', '', 0, 1, datetime('now'))
    `).run([version]);

    const shipTotal = (db.prepare("SELECT COUNT(*) as c FROM ships").get() as any)?.c || 0;
    const compTotal = (db.prepare("SELECT COUNT(*) as c FROM components").get() as any)?.c || 0;

    return NextResponse.json({
      message: "Import completed",
      version,
      imported,
      totals: {
        ships: shipTotal,
        components: compTotal,
      },
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Import failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}

function detectSlotType(name: string, port: any): string {
  const lower = name.toLowerCase();
  const subtype = String(port.type || port.sub_type || "").toLowerCase();
  if (lower.includes("weapon") || lower.includes("gun") || lower.includes("turret") || subtype.includes("weapon") || subtype.includes("gun"))
    return "weapon";
  if (lower.includes("shield") || subtype.includes("shield")) return "shield";
  if (lower.includes("power") || lower.includes("plant") || subtype.includes("powerplant")) return "power_plant";
  if (lower.includes("cooler") || subtype.includes("cooler")) return "cooler";
  if (lower.includes("quantum") || lower.includes("qd") || subtype.includes("quantum")) return "quantum_drive";
  if (lower.includes("missile") || lower.includes("ordinance") || subtype.includes("missile")) return "missile";
  if (lower.includes("radar") || subtype.includes("radar")) return "radar";
  if (lower.includes("thruster") || lower.includes("engine") || subtype.includes("thruster")) return "thruster";
  if (lower.includes("flir")) return "flir";
  return "weapon";
}

function extractSize(name: string): number {
  const match = name.match(/[Ss](\d+)/);
  return match ? parseInt(match[1]) : 1;
}
