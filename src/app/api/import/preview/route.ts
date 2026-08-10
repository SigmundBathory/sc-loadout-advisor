import { NextResponse } from "next/server";
import {
  decodeBase64Import,
  parseImportText,
  type ImportRecord,
} from "@/lib/importValidation";

interface PreviewResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: { ships: number; components: number; weapons: number; hardpoints: number };
  sampleShips: { name: string; manufacturer: string; classification: string; crew: number }[];
  sampleComponents: { name: string; type: string; size: number }[];
}

const emptyResult = (errors: string[] = [], warnings: string[] = []): PreviewResult => ({
  valid: errors.length === 0,
  errors,
  warnings,
  summary: { ships: 0, components: 0, weapons: 0, hardpoints: 0 },
  sampleShips: [],
  sampleComponents: [],
});

function textValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function recordValue(value: unknown): ImportRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as ImportRecord : {};
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (!body.fileContent) return NextResponse.json({ error: "No file content" }, { status: 400 });

    let text: string;
    try {
      text = decodeBase64Import(body.fileContent);
    } catch (error) {
      return NextResponse.json(emptyResult([error instanceof Error ? error.message : "Invalid file content"]));
    }

    const validation = parseImportText(text);
    const sampleShips = validation.ships.slice(0, 5).map((ship) => {
      const manufacturer = recordValue(ship.manufacturer);
      const crew = ship.crew;
      const crewValue = typeof crew === "object" && crew !== null
        ? Number(recordValue(crew).min ?? recordValue(crew).max) || 0
        : Number(crew) || 0;
      return {
        name: textValue(ship.name ?? ship.class_name),
        manufacturer: textValue(manufacturer.name ?? manufacturer.code),
        classification: textValue(ship.career ?? ship.classification),
        crew: crewValue,
      };
    });
    const sampleComponents = [...validation.components, ...validation.weapons].slice(0, 5).map((component) => ({
      name: textValue(component.name ?? component.class_name),
      type: textValue(component.type) || (validation.weapons.includes(component) ? "Weapon" : ""),
      size: Number(component.size) || 0,
    }));

    return NextResponse.json({
      valid: validation.errors.length === 0,
      errors: validation.errors,
      warnings: validation.warnings,
      summary: {
        ships: validation.ships.length,
        components: validation.components.length,
        weapons: validation.weapons.length,
        hardpoints: validation.hardpoints,
      },
      sampleShips,
      sampleComponents,
    } satisfies PreviewResult);
  } catch (error) {
    return NextResponse.json(emptyResult([`Error al procesar: ${error instanceof Error ? error.message : "unknown error"}`]));
  }
}
