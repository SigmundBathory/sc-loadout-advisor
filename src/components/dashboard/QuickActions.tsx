"use client";

import { RefreshCw, Download, Plus, Wand2, ArrowLeftRight, Settings } from "lucide-react";
import Link from "next/link";

const actions = [
  { icon: RefreshCw, label: "Sync", href: "#sync", color: "text-blue-400" },
  { icon: Download, label: "Importar", href: "/import", color: "text-purple-400" },
  { icon: Plus, label: "Nuevo Loadout", href: "/ships", color: "text-green-400" },
  { icon: Wand2, label: "Optimizar", href: "/optimizer", color: "text-yellow-400" },
  { icon: ArrowLeftRight, label: "Comparar", href: "/compare", color: "text-cyan-400" },
  { icon: Settings, label: "Config", href: "/import", color: "text-orange-400" },
];

export default function QuickActions({ onSync }: { onSync?: () => void }) {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Acciones Rápidas</h3>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const isSync = action.href === "#sync";

          if (isSync) {
            return (
              <button
                key={action.label}
                onClick={onSync}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className={`p-2 rounded-lg bg-muted ${action.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs text-muted-foreground">{action.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className={`p-2 rounded-lg bg-muted ${action.color} group-hover:scale-110 transition-transform`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs text-muted-foreground">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
