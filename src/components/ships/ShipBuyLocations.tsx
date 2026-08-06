"use client";

import { MapPin, ShoppingCart, Key, Trophy, Sparkles, Zap, Shield, Rocket, Snowflake, Crosshair, Box, Star } from "lucide-react";
import type { ShipBuyLocation, WikeloShip } from "@/lib/db/queries";
import type { ReactNode } from "react";

interface ShipBuyLocationsProps {
  locations: ShipBuyLocation[];
  wikelo?: WikeloShip | null;
}

interface ParsedWikeloComponent {
  slotKey: string;
  slotType: string;
  quantity: string;
  name: string;
  size?: string;
  grade?: string;
  classType?: string;
  weaponsNote?: string;
}

const SLOT_ICON: Record<string, ReactNode> = {
  "Power Plant": <Zap className="h-3 w-3 text-amber-400" />,
  Shield: <Shield className="h-3 w-3 text-emerald-400" />,
  "Quantum Drive": <Rocket className="h-3 w-3 text-cyan-400" />,
  Cooler: <Snowflake className="h-3 w-3 text-sky-400" />,
  Weapons: <Crosshair className="h-3 w-3 text-red-400" />,
  "Other components": <Box className="h-3 w-3 text-violet-400" />,
};

const SLOT_LABEL: Record<string, string> = {
  "Power Plant": "Planta de Potencia",
  Shield: "Escudos",
  "Quantum Drive": "Motor Cuántico",
  Cooler: "Refrigeradores",
  Weapons: "Armamento",
  "Other components": "Componentes Extra",
};

const CLASS_LABEL: Record<string, string> = {
  Military: "Militar",
  Civilian: "Civil",
  Industrial: "Industrial",
  Stealth: "Sigilo",
  Competition: "Competición",
  Explorer: "Explorador",
  Transport: "Transporte",
};

const MOJI_STAR = "\u00d4\u00a1\u00c9";

function hasStar(name: string): boolean {
  if (!name) return false;
  return /[⭐★]/.test(name) || name.includes(MOJI_STAR);
}
function stripStars(name: string): string {
  if (!name) return "";
  return name
    .replace(/[⭐★]/g, "")
    .split(MOJI_STAR).join("")
    .trim();
}

function sanitizeToken(s: string): string {
  return (s || "")
    .replace(/\r/g, "")
    .replace(/\n/g, "")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function splitRespectingQuotes(raw: string): string[] {
  const clean = raw.replace(/\r/g, "");
  const result: string[] = [];
  let buffer = "";
  let inQuotes = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ";" && !inQuotes) {
      result.push(buffer);
      buffer = "";
      continue;
    }
    buffer += ch;
  }
  if (buffer.length) result.push(buffer);
  return result.map(sanitizeToken).filter(Boolean);
}

function normalizeSlot(slot: string): string {
  const s = sanitizeToken(slot)
    .replace(/:$/, "")
    .trim()
    .toLowerCase();
  const keys = Object.keys(SLOT_ICON);
  for (const k of keys) {
    if (k.toLowerCase() === s) return k;
  }
  for (const k of keys) {
    if (k.toLowerCase().startsWith(s) || s.startsWith(k.toLowerCase())) return k;
  }
  return slot;
}

function parseWikeloComponents(raw: string): ParsedWikeloComponent[] {
  if (!raw) return [];
  const cleaned = sanitizeToken(raw)
    .replace(/^Componentes incluidos[:：]\s*/i, "")
    .replace(/^Components included[:：]\s*/i, "")
    .trim();

  const segments = splitRespectingQuotes(cleaned);
  const parsed: ParsedWikeloComponent[] = [];

  const gradeSet = new Set(["A", "B", "C", "D", "E", "F"]);
  const classKeys = Object.keys(CLASS_LABEL);

  for (const seg of segments) {
    const parts = seg.split(",").map(sanitizeToken).filter((_, idx, arr) => {
      if (idx === 0) return true;
      return arr[idx - 1] !== "" || _ !== "";
    }).concat(Array(6).fill("")).slice(0, 8);

    const rawSlot = parts[0] || "";
    const slotKey = normalizeSlot(rawSlot);
    const slotLabel = SLOT_LABEL[slotKey] || sanitizeToken(rawSlot).replace(/:$/, "") || "Otros";

    const quantity = parts[1] || "";
    const rawName = parts[2] || "";
    const sizeRaw = parts[3] || "";
    const classRaw = parts[4] || "";
    const gradeRaw = parts[5] || "";

    let size: string | undefined;
    if (/^\d+$/.test(sizeRaw)) {
      const n = Number(sizeRaw);
      if (n >= 0 && n <= 9) size = `Tamaño ${n}`;
    } else {
      for (let j = 2; j < parts.length; j++) {
        const t = parts[j];
        if (/^\d+$/.test(t) && Number(t) >= 0 && Number(t) <= 9) {
          size = `Tamaño ${t}`;
          break;
        }
      }
    }

    let grade: string | undefined;
    if (gradeRaw && gradeSet.has(gradeRaw.toUpperCase())) {
      grade = `Grado ${gradeRaw.toUpperCase()}`;
    } else {
      for (let j = 2; j < parts.length; j++) {
        const t = (parts[j] || "").toUpperCase();
        if (gradeSet.has(t)) {
          grade = `Grado ${t}`;
          break;
        }
      }
    }

    let classType: string | undefined;
    const classUpper = classRaw;
    const matchedClass =
      classKeys.find((k) => k.toLowerCase() === classUpper.toLowerCase()) ||
      classKeys.find((k) => classUpper.toLowerCase().startsWith(k.toLowerCase()));
    if (matchedClass) {
      classType = CLASS_LABEL[matchedClass] || matchedClass;
    } else if (sanitizeToken(classRaw) && !/^(null|<null>|\d+)$/i.test(classRaw)) {
      classType = sanitizeToken(classRaw).replace(/^"|"$/g, "");
    }

    const cleanName = stripStars(rawName);

    let weaponsNote: string | undefined;
    if (!cleanName && slotKey.toLowerCase().includes("weapon")) {
      for (let i = 2; i < parts.length; i++) {
        const t = sanitizeToken(parts[i]).replace(/^"|"$/g, "");
        if (t && !/^(<null>|null)$/i.test(t)) {
          weaponsNote = t;
          break;
        }
      }
    }

    if (!cleanName && !weaponsNote) continue;

    parsed.push({
      slotKey,
      slotType: slotLabel,
      quantity,
      name: cleanName,
      size,
      grade,
      classType,
      weaponsNote,
    });
  }

  return parsed;
}

export default function ShipBuyLocations({ locations, wikelo }: ShipBuyLocationsProps) {
  if (locations.length === 0 && !wikelo) return null;

  const sales = locations.filter(l => l.location_type === "sale");
  const rentals = locations.filter(l => l.location_type === "rental");
  const earns = locations.filter(l => l.location_type === "earn");

  const parsedComps = wikelo?.components_description
    ? parseWikeloComponents(wikelo.components_description)
    : [];

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Disponibilidad In-Game
      </h3>

      {sales.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">Compra</span>
          </div>
          <div className="space-y-1.5">
            {sales.map((loc, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{loc.shop_name}</span>
                  <span className="text-muted-foreground">— {loc.location_name}</span>
                </div>
                <span className="font-mono text-emerald-400 font-semibold">
                  {loc.price_auec > 0 ? `${loc.price_auec.toLocaleString()} aUEC` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {rentals.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Key className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs font-semibold text-blue-400">Alquiler (1 dia)</span>
          </div>
          <div className="space-y-1.5">
            {rentals.map((loc, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-blue-500/5 border border-blue-500/10 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{loc.shop_name}</span>
                  <span className="text-muted-foreground">— {loc.location_name}</span>
                </div>
                <span className="font-mono text-blue-400 font-semibold">
                  {loc.price_auec > 0 ? `${loc.price_auec.toLocaleString()} aUEC` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {earns.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">Obtener (Misiones/Wikelo)</span>
          </div>
          <div className="space-y-1.5">
            {earns.map((loc, i) => (
              <div key={i} className="flex items-center text-xs bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2">
                <span className="font-medium text-foreground">{loc.shop_name}</span>
                <span className="text-muted-foreground ml-2">— {loc.location_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {wikelo && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-xs font-semibold text-purple-400">Wikelo Emporium</span>
          </div>
          <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg px-3 py-3 space-y-2">
            {wikelo.mission_name && (
              <div className="text-xs">
                <span className="text-muted-foreground">Mision: </span>
                <span className="font-medium text-foreground">{wikelo.mission_name}</span>
              </div>
            )}
            {wikelo.cost_description && (
              <div className="text-xs">
                <span className="text-muted-foreground">Requisitos: </span>
                <span className="text-foreground">{wikelo.cost_description}</span>
              </div>
            )}
            {wikelo.reputation_required && (
              <div className="text-xs">
                <span className="text-muted-foreground">Reputacion: </span>
                <span className="text-amber-400">{wikelo.reputation_required}</span>
              </div>
            )}
            {parsedComps.length > 0 ? (
              <div className="mt-2 pt-2 border-t border-purple-500/10 space-y-2">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Componentes incluidos
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {parsedComps.map((c, i) => (
                    <div
                      key={i}
                      className="bg-background/40 border border-purple-500/10 rounded-lg px-2.5 py-2 space-y-1 hover:border-purple-400/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {SLOT_ICON[c.slotKey] || SLOT_ICON[c.slotType] || <Box className="h-3 w-3 text-purple-400" />}
                          <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wide">
                            {c.slotType}
                          </span>
                        </div>
                        {c.quantity && (
                          <span className="shrink-0 text-[10px] font-mono bg-purple-500/10 text-purple-300 rounded px-1.5 py-0.5 border border-purple-500/15">
                            {c.quantity}
                          </span>
                        )}
                      </div>

                      {c.weaponsNote ? (
                        <div className="text-[11px] text-foreground font-medium line-clamp-3">
                          {c.weaponsNote}
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-[11px] text-foreground font-medium truncate">
                              {c.name || "—"}
                            </span>
                            {hasStar(c.name) && (
                              <Star className="h-3 w-3 shrink-0 text-amber-400 fill-amber-400" />
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {c.size && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded border border-border/50 bg-muted/30 text-muted-foreground">
                                {c.size}
                              </span>
                            )}
                            {c.classType && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
                                {c.classType}
                              </span>
                            )}
                            {c.grade && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                                {c.grade}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : wikelo.components_description ? (
              <div className="text-xs mt-2 pt-2 border-t border-purple-500/10">
                <span className="text-muted-foreground">Componentes incluidos: </span>
                <span className="text-foreground text-[11px] whitespace-pre-wrap break-words">
                  {wikelo.components_description
                    .replace(/<null>,?\s*/g, "")
                    .replace(/; /g, ";\n")
                    .trim()}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
