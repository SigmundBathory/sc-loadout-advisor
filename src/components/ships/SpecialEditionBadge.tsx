import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { detectSpecialEdition, type SpecialEditionType } from "@/lib/utils/imagePipeline";
import { Sparkles, Shield, Star, Crown, Award, Gem, Zap } from "lucide-react";

const EDITION_CONFIG: Record<SpecialEditionType, {
  label: string;
  style: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  wikelo: {
    label: "Wikelo",
    style: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    icon: Sparkles,
  },
  pyam: {
    label: "PYAM",
    style: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: Crown,
  },
  alliance: {
    label: "Alianza",
    style: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    icon: Shield,
  },
  bis: {
    label: "Best in Show",
    style: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    icon: Star,
  },
  citizencon: {
    label: "CitizenCon",
    style: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    icon: Award,
  },
  heartseeker: {
    label: "Heartseeker",
    style: "bg-red-500/20 text-red-300 border-red-500/30",
    icon: Zap,
  },
  other: {
    label: "Edición Especial",
    style: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    icon: Gem,
  },
};

const VARIANT_LABELS: Record<string, string> = {
  Stealth: "Stealth",
  Military: "Military",
  Industrial: "Industrial",
  Indust: "Industrial",
  Mod: "Mod",
  Competition: "Competition",
  Medic: "Medic",
  Milt: "Military",
  Civet: "Civet",
  Civilian: "Civilian",
  Grad02: "Grad",
};

function getVariantLabel(class_name?: string): string | null {
  if (!class_name) return null;
  const cn = class_name.toLowerCase();
  for (const [key, label] of Object.entries(VARIANT_LABELS)) {
    if (cn.endsWith(`_${key.toLowerCase()}`) || cn.includes(`_${key.toLowerCase()}_`)) {
      return label;
    }
  }
  return null;
}

export function SpecialEditionBadge({
  ship,
  className,
}: {
  ship: { name?: string; class_name?: string };
  className?: string;
}) {
  const editionType = detectSpecialEdition(ship);
  if (!editionType) return null;

  const config = EDITION_CONFIG[editionType];
  const Icon = config.icon;
  const variant = getVariantLabel(ship.class_name);

  return (
    <Badge
      variant="secondary"
      className={cn(
        "border gap-1 shrink-0",
        config.style,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}{variant ? ` \u2022 ${variant}` : ""}
    </Badge>
  );
}

/**
 * Detect if a ship is a special edition (reusable hook-free version)
 */
export function isSpecialEdition(ship: { name?: string; class_name?: string }): boolean {
  return detectSpecialEdition(ship) !== null;
}

export default SpecialEditionBadge;
