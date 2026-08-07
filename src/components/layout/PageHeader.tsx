import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Breadcrumb from "@/components/Breadcrumb";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: { label: string; href?: string }[];
  /** Optional right-aligned action slot (buttons, badges, etc.). */
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/**
 * Unified page header used by every section. Replaces the ad-hoc ClientHeader
 * and the duplicated dashboard <header> so the app reads as one product.
 * The global Navbar already provides primary navigation; this only shows the
 * page title, a breadcrumb and an optional contextual action.
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  action,
  icon,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <Breadcrumb items={breadcrumb} />
      )}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight font-heading text-foreground truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
