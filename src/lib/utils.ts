import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function translateSlotTypeEs(type: string): string {
  const t = (type || "").toLowerCase();
  if (t === "weapon" || t.includes("weapon") || t.includes("gun") || t.includes("turret"))
    return "Arma Principal / Torreta";
  if (t === "shield" || t.includes("shield")) return "Generador de Escudo";
  if (t === "power_plant" || t.includes("power")) return "Planta de Energía";
  if (t === "cooler" || t.includes("cooler")) return "Sistema de Enfriamiento";
  if (t === "quantum_drive" || t.includes("quantum")) return "Motor Quantum (Salto)";
  if (t === "missile" || t.includes("missile")) return "Misil / Soporte RACK";
  if (t === "radar" || t.includes("radar")) return "Radar y Sensores";
  if (t === "thruster" || t.includes("thruster") || t.includes("flight"))
    return "Control de Vuelo / Propulsor";
  if (t === "life_support" || t.includes("life")) return "Soporte Vital";
  return type || "Componente";
}

export function translateComponentTypeEs(type: string): string {
  const t = (type || "").toLowerCase();
  if (t === "weapon") return "Arma Principal / Torreta";
  if (t === "shield") return "Generador de Escudo";
  if (t === "powerplant" || t === "power_plant") return "Planta de Energía";
  if (t === "cooler") return "Enfriador";
  if (t === "quantumdrive" || t === "quantum_drive") return "Motor Quantum (Salto)";
  if (t === "missile" || t === "missilerack") return "Misil / Soporte RACK";
  if (t === "radar") return "Radar y Sensores";
  if (t === "flightcontroller" || t === "thruster") return "Control de Vuelo";
  if (t === "lifesupport") return "Soporte Vital";
  return type || "Componente";
}
