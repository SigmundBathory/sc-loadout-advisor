export const UNVERIFIED_DATA_LABEL = "Sin datos verificados";
export const UNAVAILABLE_LABEL = "No disponible";

export function formatPrice(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? `${value.toLocaleString("es-ES")} aUEC`
    : UNVERIFIED_DATA_LABEL;
}

export function hasKnownValue(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
