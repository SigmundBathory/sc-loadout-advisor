import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StarBackground from "@/components/layout/StarBackground";
import QueryProvider from "@/components/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative bg-background text-foreground overflow-x-hidden">
        <TooltipProvider>
          <QueryProvider>
            <StarBackground />
            <Navbar />
            <div className="flex-1 flex flex-col">{children}</div>
            <Footer />
          </QueryProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}

