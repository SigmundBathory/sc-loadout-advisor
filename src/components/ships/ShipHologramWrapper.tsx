"use client";

import ShipHologram from "@/components/ships/ShipHologram";
import type { Ship } from "@/lib/types";

interface ShipHologramWrapperProps {
  ship: Ship;
  className?: string;
  size?: number;
}

export default function ShipHologramWrapper({ ship, className = "", size = 350 }: ShipHologramWrapperProps) {
  return (
    <div className={`flex justify-center ${className}`}>
      <ShipHologram ship={ship} size={size} />
    </div>
  );
}