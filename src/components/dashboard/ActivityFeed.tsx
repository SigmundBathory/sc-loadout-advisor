"use client";

import { RefreshCw, Download, Save, Clock } from "lucide-react";

interface ActivityEntry {
  time: string;
  action: string;
  detail: string;
  icon: "sync" | "import" | "save" | "default";
}

const iconMap = {
  sync: RefreshCw,
  import: Download,
  save: Save,
  default: Clock,
};

const colorMap = {
  sync: "text-blue-400 bg-blue-500/10",
  import: "text-purple-400 bg-purple-500/10",
  save: "text-green-400 bg-green-500/10",
  default: "text-muted-foreground bg-muted",
};

export default function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Actividad Reciente</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Sin actividad reciente</p>
      ) : (
        <div className="space-y-3">
          {entries.slice(0, 5).map((entry, i) => {
            const Icon = iconMap[entry.icon] || iconMap.default;
            const colors = colorMap[entry.icon] || colorMap.default;

            return (
              <div key={i} className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg ${colors}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{entry.action}</span>{" "}
                    <span className="text-muted-foreground">{entry.detail}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{entry.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
