"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useRouter } from "next/navigation";
import { CHART_COLOR } from "@/lib/chartColors";

interface ManufacturerData {
  code: string;
  name: string;
  count: number;
  color?: string;
}

export default function PieChartFabricants({ data }: { data: ManufacturerData[] }) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  const openManufacturer = (index: number) => {
    const manufacturer = data[index];
    if (!manufacturer?.code) return;
    router.push(`/ships?mfr=${encodeURIComponent(manufacturer.code)}`);
  };

  return (
    <div className="product-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-kicker">Inventario de flota</p>
          <h3 className="text-base font-semibold text-foreground mt-1">Distribución por fabricante</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border/40 rounded-full px-2 py-1 whitespace-nowrap">
          Click para explorar
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 mt-4">
        <div className="w-44 h-44 shrink-0 rounded-full bg-muted/20" aria-label="Distribución de naves por fabricante">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={activeIndex === null ? 75 : 78}
                paddingAngle={3}
                dataKey="count"
                onClick={(_, index) => openManufacturer(index)}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className="cursor-pointer outline-none"
              >
                {data.map((item, index) => (
                  <Cell
                    key={`cell-${item.code}`}
                    fill={item.color || CHART_COLOR(index)}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.38}
                    className="transition-opacity duration-200 cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as ManufacturerData;
                  return (
                    <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 shadow-xl">
                      <p className="font-medium text-sm">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.count} naves ({Math.round((d.count / total) * 100)}%)
                      </p>
                      <p className="text-[10px] text-primary mt-1">Abrir modelos de {d.name}</p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 w-full space-y-1.5">
          {data.map((item, i) => (
            <button
              key={item.code}
              type="button"
              onClick={() => openManufacturer(i)}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`w-full flex items-center justify-between gap-3 text-sm rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                activeIndex !== null && activeIndex !== i ? "opacity-50" : ""
              }`}
              aria-label={`Ver naves del fabricante ${item.name}`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color || CHART_COLOR(i) }}
                />
                <span className="text-muted-foreground truncate">{item.name}</span>
              </span>
              <span className="font-mono font-medium shrink-0">{item.count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
