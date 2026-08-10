import type { Metadata } from "next";
import { Geist, Geist_Mono, Rajdhani } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StarBackground from "@/components/layout/StarBackground";
import QueryProvider from "@/components/QueryProvider";
import ThemeInitializer from "@/components/ThemeInitializer";
import PageTransition from "@/components/layout/PageTransition";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Sci-fi HUD display font used for headings, stat values and brand text.
// Rajdhani's geometric, slightly condensed letterforms read like a ship
// console typeface while remaining highly legible at small sizes.
const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SC Loadout Advisor - Star Citizen Tools",
  description:
    "Configura, compara y optimiza loadouts de Star Citizen. Encuentra los mejores componentes, analiza DPS y ubica puntos de compra en el Verse.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${rajdhani.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative bg-background text-foreground overflow-x-hidden">
        <TooltipProvider>
          <QueryProvider>
            <ThemeProvider>
              <StarBackground />
              <Navbar />
              <ThemeInitializer />
              <PageTransition>{children}</PageTransition>
              <Footer />
              <Toaster richColors position="bottom-right" />
            </ThemeProvider>
          </QueryProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}

