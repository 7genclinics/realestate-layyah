import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  href?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "sky" | "indigo";
  className?: string;
}

const VARIANT_STYLES = {
  default: {
    card: "border-border/80 bg-card hover:border-primary/40",
    iconWrap: "bg-secondary text-secondary-foreground",
    accent: "from-slate-500/10 to-transparent",
  },
  primary: {
    card: "border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card hover:border-primary/40",
    iconWrap: "bg-primary/10 text-primary",
    accent: "from-primary/20 to-transparent",
  },
  success: {
    card: "border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-card hover:border-emerald-500/40",
    iconWrap: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    accent: "from-emerald-500/20 to-transparent",
  },
  warning: {
    card: "border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card to-card hover:border-amber-500/40",
    iconWrap: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    accent: "from-amber-500/20 to-transparent",
  },
  danger: {
    card: "border-rose-500/20 bg-gradient-to-br from-rose-500/5 via-card to-card hover:border-rose-500/40",
    iconWrap: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    accent: "from-rose-500/20 to-transparent",
  },
  sky: {
    card: "border-sky-500/20 bg-gradient-to-br from-sky-500/5 via-card to-card hover:border-sky-500/40",
    iconWrap: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    accent: "from-sky-500/20 to-transparent",
  },
  indigo: {
    card: "border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-card to-card hover:border-indigo-500/40",
    iconWrap: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    accent: "from-indigo-500/20 to-transparent",
  },
};

export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  href,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const styles = VARIANT_STYLES[variant];

  const content = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[10px] border p-5 shadow-xs transition-all duration-200",
        href && "hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        styles.card,
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100",
          styles.accent,
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        {Icon && (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-[8px] transition-transform duration-200 group-hover:scale-105",
              styles.iconWrap,
            )}
          >
            <Icon className="size-4.5" />
          </span>
        )}
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground font-heading">
        {value}
      </p>

      {(hint || trend) && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center font-medium",
                trend.isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400",
              )}
            >
              {trend.value}
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
