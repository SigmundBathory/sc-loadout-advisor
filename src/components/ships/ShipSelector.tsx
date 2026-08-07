"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, LayoutGrid, List, Rocket, Users, Shield, Zap, X, DollarSign, Wand2, AlertTriangle, ArrowUpDown, ShoppingBag } from "lucide-react";
import type { Ship } from "@/lib/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useShips, useOptimizedShipIds } from "@/lib/api/client";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { ShipImage } from "@/components/ui/ProgressiveImage";
import { ClassBadge } from "@/components/ships/ClassBadge";
import { SpecialEditionBadge } from "@/components/ships/SpecialEditionBadge";

interface ShipSelectorProps {
  initialShips?: Ship[];
  manufacturers?: { code: string; name: string }[];
  classifications?: string[];
}

type SortKey = "name" | "dps" | "hull" | "price";

export default function ShipSelector({
  initialShips = [],
  manufacturers = [],
  classifications = [],
}: ShipSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedManufacturer, setSelectedManufacturer] = useState(searchParams.get("mfr") || "");
  const [selectedClassification, setSelectedClassification] = useState(searchParams.get("cls") || "");
  const [viewMode, setViewMode] = useState<"grid" | "list">((searchParams.get("view") as "grid" | "list") || "grid");
  const [sortKey, setSortKey] = useState<SortKey>((searchParams.get("sort") as SortKey) || "name");
  const [buyableOnly, setBuyableOnly] = useState(searchParams.get("buyable") === "1");
  const [visibleCount, setVisibleCount] = useState(30);

  const updateUrl = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/ships?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Request withDps so we can sort by combat power.
  const { data, isLoading, isError, refetch } = useShips(true);
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
    if (buyableOnly) {
      filtered = filtered.filter((s) => s.is_buyable || s.price_auec);
    }

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sortKey) {
        case "dps":
          return (b.dps || 0) - (a.dps || 0);
        case "hull":
          return (b.hull_hp || 0) - (a.hull_hp || 0);
        case "price":
          // ships without price go last
          const pa = a.price_auec || Infinity;
          const pb = b.price_auec || Infinity;
          return pa - pb;
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return sorted;
  }, [allShips, search, selectedManufacturer, selectedClassification, buyableOnly, sortKey]);

  const paginatedShips = useMemo(() => ships.slice(0, visibleCount), [ships, visibleCount]);

  useEffect(() => { setVisibleCount(30); }, [ships]);

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

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "name", label: "Nombre" },
    { key: "dps", label: "DPS" },
    { key: "hull", label: "Casco" },
    { key: "price", label: "Precio" },
  ];

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
              onChange={(e) => { setSearch(e.target.value); updateUrl("q", e.target.value); }}
              className="pl-10 pr-9 rounded-xl bg-muted/40 border-border/40"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); updateUrl("q", ""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedManufacturer}
              onChange={(e) => { setSelectedManufacturer(e.target.value); updateUrl("mfr", e.target.value); }}
              className="native-select px-3 py-2 rounded-xl border border-border/40 bg-muted/40 text-foreground text-xs flex-1 md:w-44"
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
              onChange={(e) => { setSelectedClassification(e.target.value); updateUrl("cls", e.target.value); }}
              className="native-select px-3 py-2 rounded-xl border border-border/40 bg-muted/40 text-foreground text-xs flex-1 md:w-44"
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
                onClick={() => { setViewMode("grid"); updateUrl("view", "grid"); }}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0 rounded-lg"
                onClick={() => { setViewMode("list"); updateUrl("view", "list"); }}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Secondary row: sort + buyable toggle + count */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>Ordenar:</span>
            </div>
            <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5 border border-border/40">
              {sortOptions.map((o) => (
                <button
                  key={o.key}
                  onClick={() => { setSortKey(o.key); updateUrl("sort", o.key); }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    sortKey === o.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setBuyableOnly((v) => !v); updateUrl("buyable", buyableOnly ? "" : "1"); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                buyableOnly
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "text-muted-foreground border-border/40 hover:text-foreground"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Comprables
            </button>
          </div>

          <span className="text-xs text-muted-foreground font-medium">
            <span className="text-primary font-mono font-bold">{ships.length}</span> naves
          </span>
        </div>

        {(search || selectedManufacturer || selectedClassification || buyableOnly) && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setSelectedManufacturer("");
                setSelectedClassification("");
                setBuyableOnly(false);
              }}
              className="h-6 text-xs text-muted-foreground hover:text-foreground"
            >
              Limpiar Filtros
            </Button>
          </div>
        )}
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
          {paginatedShips.map((ship) => (
            <StaggerItem key={ship.id}>
              <Link href={`/ships/${ship.id}`} className="block h-full">
                <Card className="glass-panel glass-panel-hover border-border/40 cursor-pointer h-full group flex flex-col justify-between overflow-hidden hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40 transition-all duration-300">
                  <div className="relative h-36 w-full bg-muted/20 border-b border-border/30">
                    <ShipImage ship={ship} fill priority={false} alt={ship.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
                  </div>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                          {ship.name}
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium">
                          {ship.manufacturer?.name || "Unknown Manufacturer"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {optimizedShipIds.has(ship.id) && (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1">
                            <Wand2 className="h-3 w-3" />
                            Optimizada
                          </Badge>
                        )}
                      </div>
                    </div>
                    <SpecialEditionBadge ship={ship} />

                    <div className="flex items-center justify-between gap-2">
                      <ClassBadge classification={ship.classification} />
                      {ship.price_auec ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold font-mono">
                          <DollarSign className="h-3.5 w-3.5 shrink-0" />
                          {ship.price_auec.toLocaleString()}
                        </span>
                      ) : ship.is_buyable ? (
                        <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                          <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                          Disponible
                        </span>
                      ) : null}
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
          {paginatedShips.map((ship) => (
            <Link key={ship.id} href={`/ships/${ship.id}`} className="block hover:bg-muted/30 transition-colors">
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <ShipImage ship={ship} className="w-12 h-12 rounded-lg" alt={ship.name} />
                  <div className="min-w-0">
                    <h3 className="font-bold text-base text-foreground truncate">{ship.name}</h3>
                    <p className="text-xs text-muted-foreground">{ship.manufacturer?.name}</p>
                    <SpecialEditionBadge ship={ship} className="mt-1" />
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
                  <ClassBadge classification={ship.classification} />
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

      {visibleCount < ships.length && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" className="rounded-xl" onClick={() => setVisibleCount((v) => v + 30)}>
            Cargar más ({ships.length - visibleCount} restantes)
          </Button>
        </div>
      )}
    </div>
  );
}
