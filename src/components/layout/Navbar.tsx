"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import VersionSelector from "@/components/VersionSelector";
import SyncIndicator from "@/components/sync/SyncIndicator";
import UpdateModal from "@/components/layout/UpdateModal";
import {
  Wand2,
  GitCompare,
  Upload,
  Rocket,
  Menu,
  X,
  Compass,
  LayoutDashboard,
  ArrowUpCircle,
  Moon,
  Sun,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { isDark, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/ships", label: "Naves", icon: Rocket },
    { href: "/optimizer", label: "Optimizador", icon: Wand2 },
    { href: "/compare", label: "Comparador", icon: GitCompare },
    { href: "/import", label: "Importar", icon: Upload },
  ];

  const isActive = (path: string) => {
    if (path === "/ships" && pathname.startsWith("/ships")) return true;
    return pathname === path;
  };

  return (
    <>
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-2xl sticky top-0 z-50 transition-all duration-300 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.9)]">
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Compass className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/80 to-primary bg-clip-text text-transparent group-hover:to-primary transition-colors">
                SC Loadout Advisor
              </span>
              <span className="text-[10px] text-muted-foreground font-mono leading-none tracking-widest uppercase">
                Star Citizen Tools
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-0.5 bg-card/70 p-1 rounded-2xl border border-border/50 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} className="relative">
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-primary shadow-md shadow-primary/30"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Button
                    variant={active ? "ghost" : "ghost"}
                    size="sm"
                    className={`relative gap-2 rounded-xl text-xs font-medium transition-colors ${
                      active
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right Section: Sync & Versions & Updates & Theme Toggle */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUpdateModalOpen(true)}
              className="gap-1.5 text-xs rounded-full border-primary/30 text-primary hover:bg-primary/10"
            >
              <ArrowUpCircle className="h-3.5 w-3.5" />
              <span>Actualizaciones</span>
            </Button>
            <div className="h-4 w-[1px] bg-border/60" />
            <VersionSelector />
            <div className="h-4 w-[1px] bg-border/60" />
            <SyncIndicator />
            <div className="h-4 w-[1px] bg-border/60" />
            <Button
              variant="outline"
              size="sm"
               onClick={() => {
                 setTheme(!isDark);
               }}
              className="gap-1.5 text-xs rounded-full border-primary/30 text-primary hover:bg-primary/10"
            >
               {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
               <span className="ml-1">{isDark ? "Modo Claro" : "Modo Oscuro"}</span>
            </Button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setUpdateModalOpen(true)}
              className="rounded-lg h-8 w-8 text-primary border-primary/30"
            >
              <ArrowUpCircle className="h-4 w-4" />
            </Button>
            <SyncIndicator />
            <div className="h-4 w-[1px] bg-border/60" />
             <Button
               variant="outline"
               size="icon"
               onClick={() => {
                 setTheme(!isDark);
               }}
               className="rounded-lg h-8 w-8 text-primary border-primary/30"
             >
               {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
             </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border/40 bg-card/95 backdrop-blur-xl px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={active ? "default" : "ghost"}
                      className="w-full justify-start gap-3 rounded-xl"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
            <div className="pt-2 border-t border-border/40 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Versión activa:</span>
                <VersionSelector />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Tema:</span>
                <span className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
               onClick={() => {
                 setTheme(!isDark);
               }}
                    className="text-primary border-primary/40"
                   >
                     {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                   </Button>
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setUpdateModalOpen(true);
                }}
                className="w-full gap-2 rounded-xl border-primary/40 text-primary"
              >
                <ArrowUpCircle className="h-4 w-4" />
                Centro de Actualizaciones
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Update Modal */}
      <UpdateModal
        open={updateModalOpen}
        onOpenChange={setUpdateModalOpen}
      />
    </>
  );
}