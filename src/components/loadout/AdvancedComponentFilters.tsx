"use client";

import { useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Filter, ArrowUpDown } from "lucide-react";
import type { Component } from "@/lib/types";

interface AdvancedComponentFiltersProps {
  components: Component[];
  onFilterChange: (filteredComponents: Component[]) => void;
  slotType?: string;
  maxSize?: number;
}

interface FilterCriteria {
  search: string;
  minDps: number;
  maxDps: number;
  minPrice: number;
  maxPrice: number;
  manufacturer: string;
  minSize: number;
  maxSize: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
}

export default function AdvancedComponentFilters({
  components,
  onFilterChange,
  slotType,
  maxSize = 12,
}: AdvancedComponentFiltersProps) {
  const [filters, setFilters] = useState<FilterCriteria>({
    search: "",
    minDps: 0,
    maxDps: 5000,
    minPrice: 0,
    maxPrice: 1000000,
    manufacturer: "",
    minSize: 1,
    maxSize: maxSize,
    sortBy: "dps",
    sortDirection: "desc",
  });

  const manufacturers = useMemo(() => {
    const mfgSet = new Set<string>();
    components.forEach((c) => {
      if (c.manufacturer?.code) mfgSet.add(c.manufacturer.code);
      if (c.manufacturer?.name) mfgSet.add(c.manufacturer.name);
    });
    return Array.from(mfgSet).sort();
  }, [components]);

  // Obtener los rangos máximos de los componentes
  const maxValues = useMemo(() => {
    let maxDps = 0;
    let maxPrice = 0;
    
    components.forEach((c) => {
      const dps = c.stats.dps || c.stats.alpha || 0;
      if (dps > maxDps) maxDps = dps;
      
      const price = c.price_auec || 0;
      if (price > maxPrice) maxPrice = price;
    });
    
    return {
      maxDps: Math.ceil(maxDps * 1.1),
      maxPrice: Math.ceil(maxPrice * 1.1),
    };
  }, [components]);

  // Aplicar filtros
  const filteredComponents = useMemo(() => {
    return components.filter((comp) => {
      // Filtro por búsqueda
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const nameMatch = comp.name.toLowerCase().includes(searchLower);
        const classNameMatch = comp.class_name.toLowerCase().includes(searchLower);
        const mfgMatch = comp.manufacturer?.name?.toLowerCase().includes(searchLower);
        if (!nameMatch && !classNameMatch && !mfgMatch) return false;
      }

      // Filtro por DPS
      const dps = comp.stats.dps || comp.stats.alpha || 0;
      if (dps < filters.minDps || dps > filters.maxDps) return false;

      // Filtro por precio
      const price = comp.price_auec || 0;
      if (price < filters.minPrice || price > filters.maxPrice) return false;

      // Filtro por fabricante
      if (filters.manufacturer) {
        const mfgCode = comp.manufacturer?.code?.toLowerCase();
        const mfgName = comp.manufacturer?.name?.toLowerCase();
        const filterLower = filters.manufacturer.toLowerCase();
        if (!mfgCode?.includes(filterLower) && !mfgName?.includes(filterLower)) return false;
      }

      // Filtro por tamaño
      if (comp.size < filters.minSize || comp.size > filters.maxSize) return false;

      // Filtro por tipo de slot (si está especificado)
      if (slotType) {
        const compTypeLower = comp.type.toLowerCase();
        const slotTypeLower = slotType.toLowerCase();
        // Mapear tipos de slots a tipos de componentes
        const typeMap: Record<string, string[]> = {
          weapon: ["weapon"],
          turret: ["weapon"],
          shield: ["shield"],
          power_plant: ["powerplant", "power_plant"],
          powerplant: ["powerplant", "power_plant"],
          cooler: ["cooler"],
          quantum_drive: ["quantumdrive", "quantum_drive"],
          quantumdrive: ["quantumdrive", "quantum_drive"],
          radar: ["radar"],
          flight_controller: ["flightcontroller", "flight_controller"],
          flightcontroller: ["flightcontroller", "flight_controller"],
          life_support: ["lifesupport", "life_support"],
          lifesupport: ["lifesupport", "life_support"],
          missile: ["missile", "missilerack"],
        };
        const validTypes = typeMap[slotTypeLower] || [slotTypeLower];
        if (!validTypes.includes(compTypeLower)) return false;
      }

      return true;
    });
  }, [components, filters, slotType, maxSize]);

  // Ordenar componentes
  const sortedComponents = useMemo(() => {
    return [...filteredComponents].sort((a, b) => {
      let aVal = 0;
      let bVal = 0;

      switch (filters.sortBy) {
        case "dps":
          aVal = a.stats.dps || a.stats.alpha || 0;
          bVal = b.stats.dps || b.stats.alpha || 0;
          break;
        case "price":
          aVal = a.price_auec || 0;
          bVal = b.price_auec || 0;
          break;
        case "hp":
          aVal = a.stats.hp || a.stats.max_hp || 0;
          bVal = b.stats.hp || b.stats.max_hp || 0;
          break;
        case "regen":
          aVal = a.stats.regen_rate || 0;
          bVal = b.stats.regen_rate || 0;
          break;
        case "output":
          aVal = a.stats.output || 0;
          bVal = b.stats.output || 0;
          break;
        case "cooling":
          aVal = a.stats.cooling_rate || 0;
          bVal = b.stats.cooling_rate || 0;
          break;
        case "speed":
          aVal = a.stats.travel_speed || 0;
          bVal = b.stats.travel_speed || 0;
          break;
        case "name":
          return filters.sortDirection === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        default:
          return 0;
      }

      if (filters.sortDirection === "asc") {
        return aVal - bVal;
      }
      return bVal - aVal;
    });
  }, [filteredComponents, filters]);

  // Aplicar filtros cuando cambian
  useMemo(() => {
    onFilterChange(sortedComponents);
  }, [sortedComponents, onFilterChange]);

  const handleFilterChange = useCallback((key: keyof FilterCriteria, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: "",
      minDps: 0,
      maxDps: maxValues.maxDps,
      minPrice: 0,
      maxPrice: maxValues.maxPrice,
      manufacturer: "",
      minSize: 1,
      maxSize: maxSize,
      sortBy: "dps",
      sortDirection: "desc",
    });
  }, [maxValues.maxDps, maxValues.maxPrice, maxSize]);

  const sortOptions = [
    { key: "dps", label: "DPS" },
    { key: "price", label: "Precio" },
    { key: "hp", label: "HP" },
    { key: "regen", label: "Regeneración" },
    { key: "output", label: "Salida de energía" },
    { key: "cooling", label: "Enfriamiento" },
    { key: "speed", label: "Velocidad" },
    { key: "name", label: "Nombre" },
  ];

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar componente por nombre..."
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="pl-10"
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFilterChange("search", "")}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filtros por stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* DPS Range */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <label>DPS: {filters.minDps} - {filters.maxDps}</label>
            <span className="text-muted-foreground">
              Max: {maxValues.maxDps.toLocaleString()}
            </span>
          </div>
          <Slider
            value={[filters.minDps, filters.maxDps]}
            onValueChange={(value: number[]) => {
              handleFilterChange("minDps", value[0]);
              handleFilterChange("maxDps", value[1]);
            }}
            min={0}
            max={maxValues.maxDps}
            step={10}
            className="h-4"
          />
        </div>

        {/* Price Range */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <label>Precio: {filters.minPrice.toLocaleString()} - {filters.maxPrice.toLocaleString()} aUEC</label>
            <span className="text-muted-foreground">
              Max: {maxValues.maxPrice.toLocaleString()}
            </span>
          </div>
          <Slider
            value={[filters.minPrice, filters.maxPrice]}
            onValueChange={(value: number[]) => {
              handleFilterChange("minPrice", value[0]);
              handleFilterChange("maxPrice", value[1]);
            }}
            min={0}
            max={maxValues.maxPrice}
            step={1000}
            className="h-4"
          />
        </div>

        {/* Fabricante */}
        <div className="space-y-2">
          <label className="text-sm">Fabricante</label>
          <Select
            value={filters.manufacturer}
            onValueChange={(value) => handleFilterChange("manufacturer", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos los fabricantes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los fabricantes</SelectItem>
              {manufacturers.map((mfg) => (
                <SelectItem key={mfg} value={mfg}>
                  {mfg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tamaño */}
        <div className="space-y-2">
          <label className="text-sm">Tamaño: {filters.minSize} - {filters.maxSize}</label>
          <Slider
            value={[filters.minSize, filters.maxSize]}
            onValueChange={(value: number[]) => {
              handleFilterChange("minSize", value[0]);
              handleFilterChange("maxSize", value[1]);
            }}
            min={1}
            max={maxSize}
            step={1}
            className="h-4"
          />
        </div>
      </div>

      {/* Ordenación */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">Ordenar por:</span>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => handleFilterChange("sortBy", value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.key} value={opt.key}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant={filters.sortDirection === "desc" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            handleFilterChange(
              "sortDirection",
              filters.sortDirection === "desc" ? "asc" : "desc"
            )
          }
          className="gap-1"
        >
          <ArrowUpDown className="h-3 w-3" />
          {filters.sortDirection === "desc" ? "Desc" : "Asc"}
        </Button>
      </div>

      {/* Botón para resetear filtros */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetFilters}
          className="gap-1"
        >
          <X className="h-3 w-3" />
          Resetear Filtros
        </Button>
      </div>

      {/* Contador de resultados */}
      <div className="text-sm text-muted-foreground">
        Mostrando {sortedComponents.length} de {components.length} componentes
      </div>
    </div>
  );
}
