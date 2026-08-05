import Link from "next/link";
import { Compass, ExternalLink, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/30 backdrop-blur-md mt-auto py-8 text-xs text-muted-foreground">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/20 text-primary">
                <Compass className="h-4 w-4" />
              </div>
              <span className="font-bold text-foreground text-sm">SC Loadout Advisor</span>
            </div>
            <p className="max-w-md text-muted-foreground leading-relaxed">
              Herramienta profesional e interactiva para la configuración, comparación y optimización analítica de naves y componentes en Star Citizen.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Herramientas</h4>
            <ul className="space-y-1.5 font-medium">
              <li>
                <Link href="/ships" className="hover:text-primary transition-colors">
                  Explorador de Naves
                </Link>
              </li>
              <li>
                <Link href="/optimizer" className="hover:text-primary transition-colors">
                  Optimizador Automático
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-primary transition-colors">
                  Comparador Multiloadout
                </Link>
              </li>
              <li>
                <Link href="/import" className="hover:text-primary transition-colors">
                  Importador de Datos (PTU)
                </Link>
              </li>
            </ul>
          </div>

          {/* Sources & Community */}
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Fuentes de Datos</h4>
            <ul className="space-y-1.5 font-medium">
              <li>
                <a
                  href="https://star-citizen.wiki"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1"
                >
                  Star Citizen Wiki API <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://uexcorp.space"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1"
                >
                  UEX Corp API <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.erkul.games"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1"
                >
                  Erkul Games <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} SC Loadout Advisor. No oficial. Este proyecto no está afiliado con Cloud Imperium Games Corp.</p>
          <p className="flex items-center gap-1 font-medium">
            Desarrollado con <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500/20 inline" /> para la comunidad de Star Citizen
          </p>
        </div>
      </div>
    </footer>
  );
}
