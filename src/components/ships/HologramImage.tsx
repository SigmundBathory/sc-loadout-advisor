"use client";

import { ShipImage } from "@/components/ui/ProgressiveImage";
import type { Ship } from "@/lib/types";

interface HologramImageProps {
  ship: Ship;
  className?: string;
}

export default function HologramImage({ ship, className = "" }: HologramImageProps) {
  return (
    <div
      className={`
        relative rounded-2xl overflow-hidden
        bg-gradient-to-b from-background/80 via-background/40 to-background/80
        border border-border/30
        shadow-[0_0_40px_rgba(0,212,255,0.08),inset_0_0_40px_rgba(0,212,255,0.03)]
        before:absolute before:inset-0 before:rounded-2xl
        before:bg-[radial-gradient(ellipse_at_center,_rgba(0,212,255,0.06)_0%,_transparent_70%)]
        before:pointer-events-none
        after:absolute after:inset-0 after:rounded-2xl
        after:bg-[linear-gradient(transparent_50%,_rgba(0,212,255,0.02)_50%)]
        after:bg-[length:100%_4px]
        after:pointer-events-none
        ${className}
      `}
      style={{
        aspectRatio: "4/3",
        filter: "drop-shadow(0 0 12px rgba(0,212,255,0.25))",
      }}
    >
      <ShipImage
        ship={{
          image_url: ship.image_url || undefined,
          class_name: ship.class_name,
          name: ship.name,
          manufacturer: ship.manufacturer,
        }}
        alt={ship.name}
        fill
        priority
        className="object-contain"
      />

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.02) 2px, rgba(0,212,255,0.02) 4px)",
          mixBlendMode: "overlay",
        }}
      />

      {/* Corner brackets */}
      <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-md" />
      <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-cyan-400/60 rounded-tr-md" />
      <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-cyan-400/60 rounded-bl-md" />
      <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-cyan-400/60 rounded-br-md" />

      {/* Ship classification watermark */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300/50">
          {ship.classification}
        </span>
      </div>
    </div>
  );
}
