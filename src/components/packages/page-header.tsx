"use client";

import gsap from "gsap";
import { Download, RefreshCw } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

interface PageHeaderClientProps {
  isChecking: boolean;
  isUpdatingAll: boolean;
  onRefresh: () => void;
  onUpdateAll: () => void;
  outdatedCount: number | undefined;
  packageCount: number;
}

export function PageHeaderClient({
  isChecking,
  isUpdatingAll,
  onRefresh,
  onUpdateAll,
  outdatedCount,
  packageCount,
}: PageHeaderClientProps) {
  const iconRef = useRef<HTMLDivElement>(null);

  const badgeStatus = (() => {
    if (isChecking) {
      return "loading";
    }
    if (outdatedCount !== undefined && outdatedCount > 0) {
      return "warning";
    }
    return "fresh";
  })();

  useEffect(() => {
    if (!iconRef.current) {
      return;
    }

    if (isChecking) {
      gsap.to(iconRef.current, {
        rotation: 360,
        duration: 0.8,
        ease: "power2.inOut",
        repeat: -1,
      });
    } else {
      gsap.killTweensOf(iconRef.current);
      gsap.set(iconRef.current, { rotation: 0 });
    }
  }, [isChecking]);

  return (
    <header className="relative mb-12 sm:mb-16">
      <div className="absolute inset-x-0 top-full mt-4 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="text-center sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4">
            <h1 className="font-heading text-4xl text-foreground tracking-tight sm:text-5xl lg:text-6xl">
              Next.js Base
            </h1>
            <StatusBadge outdatedCount={outdatedCount} status={badgeStatus} />
          </div>
          <p className="mt-3 text-lg text-muted-foreground sm:text-xl">
            {packageCount} dependencies tracked
          </p>
        </div>

        <div className="flex justify-center sm:justify-end">
          <div className="flex items-center gap-2">
            <button
              className={cn(
                "group/refresh inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-4xl border border-border/60 bg-card px-4 py-2 font-medium text-foreground text-sm shadow-sm transition-all duration-200",
                "hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-muted/50 hover:shadow-md",
                "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                "disabled:pointer-events-none disabled:opacity-60",
                "active:translate-y-0 active:shadow-sm"
              )}
              disabled={isChecking || isUpdatingAll}
              onClick={onRefresh}
              type="button"
            >
              <div className="flex items-center justify-center" ref={iconRef}>
                <RefreshCw className="h-4 w-4 transition-transform duration-200 group-hover/refresh:rotate-180" />
              </div>
              <span className="hidden sm:inline">
                {isChecking ? "Checking..." : "Check updates"}
              </span>
            </button>
            <button
              className={cn(
                "inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-4xl border border-status-warning/40 bg-status-warning/10 px-4 py-2 font-medium text-sm text-status-warning shadow-sm transition-all duration-200",
                "hover:-translate-y-0.5 hover:border-status-warning/60 hover:bg-status-warning/20 hover:shadow-md",
                "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                "disabled:pointer-events-none disabled:opacity-60",
                "active:translate-y-0 active:shadow-sm"
              )}
              disabled={isChecking || isUpdatingAll || outdatedCount === 0}
              onClick={onUpdateAll}
              type="button"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isUpdatingAll ? "Updating..." : "Update all"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
