"use client";

import { AlertTriangle, CheckCircle, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "loading" | "fresh" | "warning" | "stale";

interface StatusBadgeProps {
  className?: string;
  outdatedCount?: number;
  status: Status;
}

const statusConfig = {
  loading: {
    label: "Checking...",
    icon: Loader2,
    container: "bg-muted text-muted-foreground",
    iconClass: "animate-spin",
  },
  fresh: {
    label: "All up to date",
    icon: CheckCircle,
    container: "bg-status-fresh/10 text-status-fresh",
    iconClass: "",
  },
  warning: {
    label: "Updates available",
    icon: AlertTriangle,
    container: "bg-status-warning/10 text-status-warning",
    iconClass: "",
  },
  stale: {
    label: "Action required",
    icon: XCircle,
    container: "bg-status-stale/10 text-status-stale",
    iconClass: "",
  },
};

export function StatusBadge({
  status,
  outdatedCount,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-medium text-sm transition-colors duration-200",
        config.container,
        className
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn("h-3.5 w-3.5 shrink-0", config.iconClass)}
      />
      <span>
        {status === "warning" && outdatedCount !== undefined
          ? `${outdatedCount} update${outdatedCount === 1 ? "" : "s"} available`
          : config.label}
      </span>
    </div>
  );
}
