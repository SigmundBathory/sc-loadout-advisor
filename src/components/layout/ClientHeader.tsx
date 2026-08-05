"use client";

import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";

interface ClientHeaderProps {
  title: string;
  backHref?: string;
  backLabel?: string;
}

export default function ClientHeader({ title, backHref, backLabel }: ClientHeaderProps) {
  return (
    <div className="border-b border-border/30 bg-card/20 backdrop-blur-sm py-3 mb-6">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {backHref && (
            <>
              <Link
                href={backHref}
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {backLabel || "Volver"}
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            </>
          )}
          <h1 className="text-lg font-bold text-foreground tracking-tight">{title}</h1>
        </div>
      </div>
    </div>
  );
}
