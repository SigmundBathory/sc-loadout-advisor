import { NextResponse } from "next/server";
import { requireAdminToken } from "@/lib/security/admin";
import { getDb } from "@/lib/db/schema";
import { detectSlotType, extractSize } from "@/lib/db/syncHelpers";
import {
  decodeBase64Import,
  identityOf,
  parseImportText,
  type ImportRecord,
  type ImportType,
} from "@/lib/importValidation";

const importTypes = new Set<ImportType>(["ships", "components", "weapons", "locations", "full"]);

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const authError = requireAdminToken(request);
  if (authError) return authError;

  try {
    const contentType = request.headers.get("content-type") || "";
    let text: string;
    let version = "";
    let importType: ImportType = "full";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
      if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File exceeds 10485760 bytes" }, { status: 413 });
      text = await file.text();
      version = stringValue(formData.get("version"));
      importType = stringValue(formData.get("type")) as ImportType || "full";
    } else {
      const body = await request.json() as Record<string, unknown>;
      version = stringValue(body.version);
      importType = stringValue(body.type) as ImportType || "full";
      text = decodeBase64Import(body.fileContent);
    }

    if (!version.trim()) return NextResponse.json({ error: "Version is required" }, { status: 400 });
    if (version.length > 100) return NextResponse.json({ error: "Version is too long" }, { status: 400 });
    if (!importTypes.has(importType)) return NextResponse.json({ error: "Invalid import type" }, { status: 400 });
    if (importType === "locations") return NextResponse.json({ error: "Location imports are not supported yet" }, { status: 400 });

    const validation = parseImportText(text);
    if (validation.errors.length > 0) {
      return NextResponse.json({ error: "Invalid import data", errors: validation.errors }, { status: 400 });
    }
    const db = getDb();
    const imported = { ships: 0, components: 0, hardpoints: 0 };
    const shouldImport = (type: Exclude<ImportType, "locations" | "full">) => importType === "full" || importType === type;

    db.transaction(() => {
      const insertManufacturer = db.prepare("INSERT OR REPLACE INTO manufacturers (code, name) VALUES (?, ?)");
      const insertShip = db.prepare(`INSERT OR REPLACE INTO ships
        (id, name, class_name, manufacturer_code, classification, crew, mass, cargo_capacity, scm_speed, max_speed, hull_hp, shield_hp, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      const insertHardpoint = db.prepare(`INSERT OR REPLACE INTO hardpoints
        (id, ship_id, name, slot_type, size, max_size) VALUES (?, ?, ?, ?, ?, ?)`);
      const insertComponent = db.prepare(`INSERT OR REPLACE INTO components
        (id, name, class_name, manufacturer_code, type, size, class, stats, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

      if (shouldImport("ships")) {
        for (const ship of validation.ships) {
          const shipId = identityOf(ship)!;
          const manufacturer = (ship.manufacturer as ImportRecord | undefined) ?? {};
          const crew = ship.crew;
          const crewValue = typeof crew === "object" && crew !== null
            ? (Number((crew as ImportRecord).min ?? (crew as ImportRecord).max) || 1)
            : (Number(crew) || 1);
          const speed = (ship.speed as ImportRecord | undefined) ?? {};
          const images = Array.isArray(ship.images) ? ship.images : [];
          const firstImage = images[0] as ImportRecord | undefined;
          const image = stringValue(firstImage?.source ?? ship.image_url);
          if (manufacturer.code && manufacturer.name) insertManufacturer.run([manufacturer.code, manufacturer.name]);
          insertShip.run([
            shipId, displayName(ship), stringValue(ship.class_name ?? ship.name), stringValue(manufacturer.code),
            stringValue(ship.career ?? ship.classification), crewValue, Number(ship.mass) || 0,
            Number(ship.cargo_capacity) || 0, Number(speed.scm ?? ship.scm_speed) || 0,
            Number(speed.max ?? ship.max_speed) || 0, Number(ship.health ?? ship.hull_hp) || 0,
            Number(ship.shield_hp) || 0, image,
          ]);
          const ports = (ship.ports ?? ship.hardpoints) as ImportRecord[] | undefined;
          for (const port of ports ?? []) {
            const portName = displayName(port);
            const sizes = (port.sizes as ImportRecord | undefined) ?? {};
            const size = Number(sizes.min ?? port.size ?? extractSize(portName)) || 1;
            const maxSize = Number(sizes.max ?? port.max_size ?? size) || size;
            insertHardpoint.run([`${shipId}_${portName}`, shipId, portName, detectSlotType(portName, port), size, maxSize]);
            imported.hardpoints++;
          }
          imported.ships++;
        }
      }

      if (shouldImport("components")) {
        for (const component of validation.components) {
          const manufacturer = (component.manufacturer as ImportRecord | undefined) ?? {};
          insertComponent.run([identityOf(component)!, displayName(component), stringValue(component.class_name ?? component.name),
            stringValue(manufacturer.code ?? manufacturer.name), stringValue(component.type ?? "Unknown"), Number(component.size) || 1,
            stringValue(component.sub_type ?? component.class), JSON.stringify(component.stats ?? {}), stringValue(component.image_url)]);
          imported.components++;
        }
      }

      if (shouldImport("weapons")) {
        for (const weapon of validation.weapons) {
          const manufacturer = (weapon.manufacturer as ImportRecord | undefined) ?? {};
          const vehicleWeapon = (weapon.vehicle_weapon as ImportRecord | undefined) ?? weapon;
          const modes = Array.isArray(vehicleWeapon.modes) ? vehicleWeapon.modes : [];
          const primary = (modes[0] as ImportRecord | undefined) ?? {};
          const alpha = Number(vehicleWeapon.damage_per_shot ?? vehicleWeapon.alpha) || 0;
          const rpm = Number(vehicleWeapon.rpm ?? vehicleWeapon.fire_rate) || 0;
          const dps = Number(primary.damage_per_second ?? vehicleWeapon.dps) || (rpm > 0 ? Math.round(alpha * rpm / 60) : 0);
          insertComponent.run([identityOf(weapon)!, displayName(weapon), stringValue(weapon.class_name ?? weapon.name),
            stringValue(manufacturer.code ?? manufacturer.name), "Weapon", Number(weapon.size) || 1, stringValue(weapon.sub_type),
            JSON.stringify({ dps, alpha, fire_rate: rpm, range: Number(vehicleWeapon.range) || 0 }), stringValue(weapon.image_url)]);
          imported.components++;
        }
      }

      // A partial import must not claim to be a complete dataset for the version.
      if (importType === "full") {
        db.prepare(`UPDATE sync_meta SET wiki_version = ?, last_sync_at = datetime('now'), sync_status = 'ok', selected_wiki_version = ? WHERE id = 1`).run([version, version]);
        db.prepare(`INSERT OR REPLACE INTO game_versions (code, channel, released_at, is_default, is_synced, last_synced_at) VALUES (?, 'ptu', '', 0, 1, datetime('now'))`).run([version]);
      }
    })();

    const shipTotal = (db.prepare("SELECT COUNT(*) as c FROM ships").get() as { c: number }).c;
    const compTotal = (db.prepare("SELECT COUNT(*) as c FROM components").get() as { c: number }).c;
    return NextResponse.json({ message: "Import completed", version, imported, totals: { ships: shipTotal, components: compTotal } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    const status = message === "No file content" ? 400 : message.includes("exceeds") ? 413 : 500;
    return NextResponse.json({ error: status === 500 ? `Import failed: ${message}` : message }, { status });
  }
}

function displayName(record: ImportRecord): string {
  return stringValue(record.name ?? record.class_name);
}
