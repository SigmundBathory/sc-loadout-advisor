import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Standard page wrapper: centered container with consistent padding and
 * vertical rhythm. Every section uses this so spacing stays coherent.
 */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("container mx-auto px-4 py-6 space-y-6", className)}>
      {children}
    </main>
  );
}
