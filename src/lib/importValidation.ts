export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
export const MAX_IMPORT_ITEMS = 50_000;
export const MAX_IMPORT_HARDPOINTS = 200_000;

export type ImportType = "ships" | "components" | "weapons" | "locations" | "full";
export type ImportRecord = Record<string, unknown>;

export interface ImportData extends ImportRecord {
  version?: unknown;
  ships?: unknown[];
  vehicles?: unknown[];
  components?: unknown[];
  weapons?: unknown[];
  locations?: unknown[];
  type?: unknown;
}

export interface ImportValidation {
  data: ImportData | null;
  errors: string[];
  warnings: string[];
  ships: ImportRecord[];
  components: ImportRecord[];
  weapons: ImportRecord[];
  locations: ImportRecord[];
  hardpoints: number;
}

function isRecord(value: unknown): value is ImportRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function identityOf(value: ImportRecord): string | null {
  return nonEmptyString(value.id) ?? nonEmptyString(value.uuid) ?? nonEmptyString(value.class_name);
}

export function displayNameOf(value: ImportRecord): string | null {
  return nonEmptyString(value.name) ?? nonEmptyString(value.class_name);
}

function validateCollection(
  value: unknown,
  label: string,
  errors: string[],
): ImportRecord[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    errors.push(`${label} debe ser un array`);
    return [];
  }

  const records: ImportRecord[] = [];
  for (let index = 0; index < value.length; index++) {
    const item = value[index];
    if (!isRecord(item)) {
      errors.push(`${label}[${index}] debe ser un objeto`);
      continue;
    }
    records.push(item);
  }
  return records;
}

function validateIdentities(records: ImportRecord[], label: string, errors: string[]): void {
  const seen = new Set<string>();
  records.forEach((record, index) => {
    const identity = identityOf(record);
    if (!identity) errors.push(`${label}[${index}] no tiene id, uuid o class_name`);
    if (!displayNameOf(record)) errors.push(`${label}[${index}] no tiene name o class_name`);
    if (identity) {
      if (seen.has(identity)) errors.push(`${label} contiene un duplicado: ${identity}`);
      seen.add(identity);
    }
  });
}

function countItems(validation: ImportValidation): number {
  return validation.ships.length + validation.components.length +
    validation.weapons.length + validation.locations.length;
}

export function validateImportData(value: unknown): ImportValidation {
  const result: ImportValidation = {
    data: isRecord(value) ? value as ImportData : null,
    errors: [],
    warnings: [],
    ships: [],
    components: [],
    weapons: [],
    locations: [],
    hardpoints: 0,
  };

  if (!isRecord(value)) {
    result.errors.push("El documento raíz debe ser un objeto JSON");
    return result;
  }

  const data = value as ImportData;
  result.ships = validateCollection(data.ships ?? data.vehicles, "ships/vehicles", result.errors);
  result.components = validateCollection(data.components, "components", result.errors);
  result.weapons = validateCollection(data.weapons, "weapons", result.errors);
  result.locations = validateCollection(data.locations, "locations", result.errors);

  validateIdentities(result.ships, "ships/vehicles", result.errors);
  validateIdentities(result.components, "components", result.errors);
  validateIdentities(result.weapons, "weapons", result.errors);
  validateIdentities(result.locations, "locations", result.errors);

  const identities = new Set<string>();
  for (const records of [result.components, result.weapons]) {
    for (const record of records) {
      const identity = identityOf(record);
      if (identity && identities.has(identity)) result.errors.push(`Duplicado entre componentes y armas: ${identity}`);
      if (identity) identities.add(identity);
    }
  }

  for (const [index, ship] of result.ships.entries()) {
    const ports = ship.ports ?? ship.hardpoints;
    if (ports === undefined) continue;
    if (!Array.isArray(ports)) {
      result.errors.push(`ships/vehicles[${index}].ports/hardpoints debe ser un array`);
      continue;
    }
    result.hardpoints += ports.length;
    const portNames = new Set<string>();
    for (const [portIndex, port] of ports.entries()) {
      if (!isRecord(port)) {
        result.errors.push(`ships/vehicles[${index}].ports[${portIndex}] debe ser un objeto`);
        continue;
      }
      const name = nonEmptyString(port.name) ?? nonEmptyString(port.class_name);
      if (!name) result.errors.push(`ships/vehicles[${index}].ports[${portIndex}] no tiene name o class_name`);
      if (name && portNames.has(name)) result.errors.push(`Hardpoint duplicado en ships/vehicles[${index}]: ${name}`);
      if (name) portNames.add(name);
    }
  }

  if (countItems(result) === 0) result.errors.push("El archivo no contiene naves, componentes, armas ni ubicaciones");
  if (countItems(result) > MAX_IMPORT_ITEMS) result.errors.push(`El archivo supera el máximo de ${MAX_IMPORT_ITEMS} registros`);
  if (result.hardpoints > MAX_IMPORT_HARDPOINTS) result.errors.push(`El archivo supera el máximo de ${MAX_IMPORT_HARDPOINTS} hardpoints`);
  if (data.ships !== undefined && data.vehicles !== undefined) result.warnings.push("Se usará ships y se ignorará vehicles porque ambos están presentes");

  return result;
}

export function decodeBase64Import(value: unknown): string {
  if (typeof value !== "string" || !value) throw new Error("No file content");
  const normalized = value.replace(/^data:application\/json;base64,/, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized) || normalized.length % 4 === 1) {
    throw new Error("Invalid base64 file content");
  }
  const estimatedBytes = Math.floor(normalized.length * 3 / 4);
  if (estimatedBytes > MAX_IMPORT_BYTES) throw new Error(`File exceeds ${MAX_IMPORT_BYTES} bytes`);
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function parseImportText(text: string): ImportValidation {
  if (new TextEncoder().encode(text).length > MAX_IMPORT_BYTES) {
    return { ...validateImportData(null), errors: [`File exceeds ${MAX_IMPORT_BYTES} bytes`] };
  }
  try {
    return validateImportData(JSON.parse(text));
  } catch {
    return { ...validateImportData(null), errors: ["Invalid JSON file"] };
  }
}
