import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Shared classification badge used in the ship grid, ship detail and compare
 * views so the color coding stays consistent across the app.
 */
export function ClassBadge({
  classification,
  className,
}: {
  classification: string;
  className?: string;
}) {
  const cls = (classification || "").toLowerCase();
  let style =
    "bg-secondary text-secondary-foreground border-transparent";
  if (cls.includes("fighter") || cls.includes("combat") || cls.includes("interceptor")) {
    style = "bg-red-500/20 text-red-300 border-red-500/30";
  } else if (cls.includes("freight") || cls.includes("cargo") || cls.includes("transport")) {
    style = "bg-amber-500/20 text-amber-300 border-amber-500/30";
  } else if (cls.includes("exploration") || cls.includes("expedition") || cls.includes("pathfinder")) {
    style = "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
  } else if (cls.includes("stealth") || cls.includes("recon")) {
    style = "bg-purple-500/20 text-purple-300 border-purple-500/30";
  } else if (cls.includes("mining") || cls.includes("salvage") || cls.includes("industrial")) {
    style = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  }
  return (
    <Badge variant="secondary" className={cn("border", style, className)}>
      {classification || "General"}
    </Badge>
  );
}
