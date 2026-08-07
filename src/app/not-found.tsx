"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="text-6xl font-bold text-muted-foreground/20">404</div>
        <h2 className="text-xl font-semibold">Página no encontrada</h2>
        <p className="text-sm text-muted-foreground">
          La página que buscas no existe o ha sido movida.
        </p>
        <div className="flex gap-3 mt-2">
          <Link href="/">
            <Button variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Inicio
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    </div>
  );
}
