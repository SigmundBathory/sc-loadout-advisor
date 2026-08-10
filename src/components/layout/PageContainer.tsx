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
    <main className={cn("container mx-auto max-w-[1440px] px-4 sm:px-6 py-6 sm:py-8 space-y-7", className)}>
      {children}
    </main>
  );
}
