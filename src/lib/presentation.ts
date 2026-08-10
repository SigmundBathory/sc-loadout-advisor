export const UNVERIFIED_DATA_LABEL = "Sin datos verificados";
export const UNAVAILABLE_LABEL = "No disponible";

export type DataSource = "wiki" | "uex" | "imported" | "legacy_unverified";

export function sourceLabel(source?: DataSource): string {
  switch (source) {
    case "wiki": return "Star Citizen Wiki";
    case "uex": return "UEX Corp";
    case "imported": return "Importado";
    default: return "Ubicación heredada · verificar en juego";
  }
}

export function isVerifiedSource(source?: DataSource): boolean {
  return source === "wiki" || source === "uex" || source === "imported";
}

export function formatPrice(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? `${value.toLocaleString("es-ES")} aUEC`
    : UNAVAILABLE_LABEL;
}

export function hasKnownValue(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
