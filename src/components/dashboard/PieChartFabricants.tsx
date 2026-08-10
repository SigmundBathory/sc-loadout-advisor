"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLOR } from "@/lib/chartColors";

interface ManufacturerData {
  name: string;
  count: number;
  color?: string;
}

export default function PieChartFabricants({ data }: { data: ManufacturerData[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="product-card p-5 sm:p-6">
      <p className="section-kicker">Inventario de flota</p>
      <h3 className="text-base font-semibold text-foreground mt-1 mb-4">Distribución por fabricante</h3>
      <div className="flex items-center gap-6">
        <div className="w-40 h-40 shrink-0 rounded-full bg-muted/20">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={3}
                dataKey="count"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLOR(index)} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 shadow-xl">
                      <p className="font-medium text-sm">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.count} naves ({Math.round((d.count / total) * 100)}%)
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((item, i) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: CHART_COLOR(i) }}
                />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <span className="font-mono font-medium">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
