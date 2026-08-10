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
    <div className="product-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="section-kicker">Atajos de misión</p>
          <h3 className="text-base font-semibold text-foreground mt-1">Acciones rápidas</h3>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Control deck</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const isSync = action.href === "#sync";

          if (isSync) {
            return (
              <button
                key={action.label}
                onClick={onSync}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/35 border border-border/30 hover:bg-muted/65 hover:border-primary/30 transition-all group"
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
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/35 border border-border/30 hover:bg-muted/65 hover:border-primary/30 transition-all group"
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
