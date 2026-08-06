"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, LayoutGrid, List, Rocket, Users, Shield, Zap, X, DollarSign, Wand2, AlertTriangle } from "lucide-react";
import type { Ship } from "@/lib/types";
import Link from "next/link";
import { useShips, useOptimizedShipIds } from "@/lib/api/client";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { ShipImage } from "@/components/ui/ProgressiveImage";

interface ShipSelectorProps {
  initialShips?: Ship[];
  manufacturers?: { code: string; name: string }[];
  classifications?: string[];
}

export default function ShipSelector({
  initialShips = [],
  manufacturers = [],
  classifications = [],
}: ShipSelectorProps) {
  const [search, setSearch] = useState("");
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [selectedClassification, setSelectedClassification] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data, isLoading, isError, refetch } = useShips(false);
  const optimizedShipIds = useOptimizedShipIds();

  const allShips = useMemo(
    () => (initialShips.length > 0 ? initialShips : data?.ships || []),
    [initialShips, data]
  );

  const loading = isLoading && allShips.length === 0;

  const ships = useMemo(() => {
    let filtered = allShips;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.class_name.toLowerCase().includes(q) ||
          (s.manufacturer?.name || "").toLowerCase().includes(q)
      );
    }
    if (selectedManufacturer) {
      filtered = filtered.filter(
        (s) => s.manufacturer?.code === selectedManufacturer
      );
    }
    if (selectedClassification) {
      filtered = filtered.filter(
        (s) => s.classification === selectedClassification
      );
    }
    return filtered;
  }, [allShips, search, selectedManufacturer, selectedClassification]);

  const uniqueManufacturers =
    manufacturers.length > 0
      ? manufacturers
      : Array.from(
          new Map(
            allShips.map((s) => [s.manufacturer?.code, s.manufacturer])
          ).values()
        ).filter((m): m is { code: string; name: string } => Boolean(m && m.code));

  const uniqueClassifications =
    classifications.length > 0
      ? classifications
      : Array.from(
          new Set(allShips.map((s) => s.classification).filter(Boolean))
        ).sort();

  function getClassificationBadge(classification: string) {
    const cls = (classification || "").toLowerCase();
    if (cls.includes("fighter") || cls.includes("combat") || cls.includes("interceptor")) {
      return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">{classification}</Badge>;
    }
    if (cls.includes("freight") || cls.includes("cargo") || cls.includes("transport")) {
      return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">{classification}</Badge>;
    }
    if (cls.includes("exploration") || cls.includes("expedition") || cls.includes("pathfinder")) {
      return <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">{classification}</Badge>;
    }
    if (cls.includes("stealth") || cls.includes("recon")) {
      return <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">{classification}</Badge>;
    }
    if (cls.includes("mining") || cls.includes("salvage") || cls.includes("industrial")) {
      return <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">{classification}</Badge>;
    }
    return <Badge variant="secondary">{classification || "General"}</Badge>;
  }

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border-border/40 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nave por nombre, modelo o fabricante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-9 rounded-xl bg-muted/40 border-border/40"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedManufacturer}
              onChange={(e) => setSelectedManufacturer(e.target.value)}
              className="native-select px-3 py-2 rounded-xl border border-border/40 bg-muted/40 text-foreground text-xs flex-1 md:w-48"
            >
              <option value="" className="bg-card">Todos los Fabricantes</option>
              {uniqueManufacturers.map((m) => (
                <option key={m.code} value={m.code} className="bg-card">
                  {m.name}
                </option>
              ))}
            </select>

            <select
              value={selectedClassification}
              onChange={(e) => setSelectedClassification(e.target.value)}
              className="native-select px-3 py-2 rounded-xl border border-border/40 bg-muted/40 text-foreground text-xs flex-1 md:w-48"
            >
              <option value="" className="bg-card">Todas las Clasificaciones</option>
              {uniqueClassifications.map((c) => (
                <option key={c} value={c} className="bg-card">
                  {c}
                </option>
              ))}
            </select>

            <div className="flex items-center border border-border/40 rounded-xl overflow-hidden p-0.5 bg-muted/30 shrink-0">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0 rounded-lg"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0 rounded-lg"
                onClick={() => setViewMode("list")}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Badges indicator */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span className="font-medium">
            Mostrando <span className="text-primary font-mono font-bold">{ships.length}</span> naves
          </span>
          {(search || selectedManufacturer || selectedClassification) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setSelectedManufacturer("");
                setSelectedClassification("");
              }}
              className="h-6 text-xs text-muted-foreground hover:text-foreground"
            >
              Limpiar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* Grid or List Display */}
      {isError && allShips.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-muted-foreground space-y-4">
          <AlertTriangle className="h-10 w-10 mx-auto opacity-60 text-red-400" />
          <p className="text-base font-medium text-foreground">No se pudieron cargar las naves.</p>
          <p className="text-xs">Revisa la conexión o inténtalo de nuevo.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl">
            Reintentar
          </Button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="glass-panel border-border/40">
              <CardContent className="p-6 h-56 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-6 rounded-md w-3/4 animate-skeleton" />
                  <div className="h-4 rounded-md w-1/2 animate-skeleton" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-4">
                  <div className="h-3 rounded w-full animate-skeleton" />
                  <div className="h-3 rounded w-full animate-skeleton" />
                  <div className="h-3 rounded w-full animate-skeleton" />
                  <div className="h-3 rounded w-full animate-skeleton" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : ships.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-muted-foreground space-y-3">
          <Rocket className="h-10 w-10 mx-auto opacity-40 text-primary" />
          <p className="text-base font-medium">No se encontraron naves con los filtros seleccionados.</p>
          <p className="text-xs">Prueba borrando la búsqueda o ejecuta una sincronización si la base de datos está vacía.</p>
        </div>
      ) : viewMode === "grid" ? (
        <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ships.map((ship) => (
            <StaggerItem key={ship.id}>
              <Link href={`/ships/${ship.id}`} className="block h-full">
                <Card className="glass-panel glass-panel-hover border-border/40 cursor-pointer h-full group flex flex-col justify-between overflow-hidden hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40 transition-all duration-300">
                <div className="relative h-36 w-full bg-muted/20 border-b border-border/30">
                  <ShipImage ship={ship} fill priority={false} alt={ship.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
                </div>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                        {ship.name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        {ship.manufacturer?.name || "Unknown Manufacturer"}
                      </p>
                    </div>
                    {getClassificationBadge(ship.classification)}
                    {optimizedShipIds.has(ship.id) && (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1">
                        <Wand2 className="h-3 w-3" />
                        Optimizada
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t border-border/30">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      <span>Tripulación: {ship.crew}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>SCM: {ship.scm_speed} m/s</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Casco: {ship.hull_hp ? ship.hull_hp.toLocaleString() : "0"} HP</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Rocket className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <span>Carga: {ship.cargo_capacity} SCU</span>
                    </div>
                    {ship.price_auec ? (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="text-emerald-400 font-semibold">{ship.price_auec.toLocaleString()} aUEC</span>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        /* List View */
        <div className="glass-panel rounded-2xl border-border/40 overflow-hidden divide-y divide-border/30">
          {ships.map((ship) => (
            <Link key={ship.id} href={`/ships/${ship.id}`} className="block hover:bg-muted/30 transition-colors">
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <ShipImage ship={ship} className="w-12 h-12 rounded-lg" alt={ship.name} />
                  <div className="min-w-0">
                    <h3 className="font-bold text-base text-foreground truncate">{ship.name}</h3>
                    <p className="text-xs text-muted-foreground">{ship.manufacturer?.name}</p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-6 text-xs text-muted-foreground">
                  <div><span className="font-mono text-foreground font-semibold">{ship.scm_speed}</span> m/s SCM</div>
                  <div><span className="font-mono text-foreground font-semibold">{ship.hull_hp?.toLocaleString()}</span> HP</div>
                  <div><span className="font-mono text-foreground font-semibold">{ship.cargo_capacity}</span> SCU</div>
                  {ship.price_auec ? (
                    <div><span className="font-mono text-emerald-400 font-semibold">{ship.price_auec.toLocaleString()}</span> aUEC</div>
                  ) : ship.is_buyable ? (
                    <div><span className="text-amber-400 text-[10px]">Disponible</span></div>
                  ) : null}
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  {getClassificationBadge(ship.classification)}
                  {optimizedShipIds.has(ship.id) && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1">
                      <Wand2 className="h-3 w-3" />
                      Optimizada
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
