import { NextResponse } from "next/server";
import { detectSlotType, extractSize } from "@/lib/db/syncHelpers";

interface ImportData {
  ships?: any[];
  vehicles?: any[];
  components?: any[];
  weapons?: any[];
  locations?: any[];
}

interface PreviewResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    ships: number;
    components: number;
    weapons: number;
    hardpoints: number;
  };
  sampleShips: { name: string; manufacturer: string; classification: string; crew: number }[];
  sampleComponents: { name: string; type: string; size: number }[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileContent, fileName } = body;

    if (!fileContent) {
      return NextResponse.json({ error: "No file content" }, { status: 400 });
    }

    const binaryStr = atob(fileContent);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const text = new TextDecoder().decode(bytes);

    let data: ImportData;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({
        valid: false,
        errors: ["Archivo JSON invalido — no se pudo parsear"],
        warnings: [],
        summary: { ships: 0, components: 0, weapons: 0, hardpoints: 0 },
        sampleShips: [],
        sampleComponents: [],
      });
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    const ships = data.ships || data.vehicles || [];
    const components = data.components || [];
    const weapons = data.weapons || [];

    if (ships.length === 0 && components.length === 0 && weapons.length === 0) {
      errors.push("El archivo no contiene naves, componentes ni armas");
    }

    let hardpoints = 0;
    const sampleShips: { name: string; manufacturer: string; classification: string; crew: number }[] = [];
    for (const ship of ships.slice(0, 5)) {
      const name = ship.name || ship.class_name || "Unknown";
      const mfg = ship.manufacturer || {};
      const crew = ship.crew;
      const crewVal = typeof crew === "object" && crew !== null ? (crew.min || crew.max || 1) : (crew || 1);
      sampleShips.push({
        name,
        manufacturer: mfg.name || mfg.code || "Unknown",
        classification: ship.career || ship.classification || "",
        crew: Number(crewVal) || 1,
      });
      const ports = ship.ports || ship.hardpoints || [];
      if (Array.isArray(ports)) hardpoints += ports.length;
      if (!ship.name && !ship.class_name) warnings.push(`Nave sin nombre detectada`);
    }

    const sampleComponents: { name: string; type: string; size: number }[] = [];
    for (const comp of [...components, ...weapons].slice(0, 5)) {
      sampleComponents.push({
        name: comp.name || comp.class_name || "Unknown",
        type: comp.type || "Weapon",
        size: Number(comp.size) || 1,
      });
    }

    const result: PreviewResult = {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        ships: ships.length,
        components: components.length,
        weapons: weapons.length,
        hardpoints,
      },
      sampleShips,
      sampleComponents,
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      valid: false,
      errors: [`Error al procesar: ${(error as Error).message}`],
      warnings: [],
      summary: { ships: 0, components: 0, weapons: 0, hardpoints: 0 },
      sampleShips: [],
      sampleComponents: [],
    });
  }
}
