"use client";

import {
  ArrowUp,
  CheckCircle2,
  Loader2,
  Package as PackageIcon,
  Wrench,
} from "lucide-react";
import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import type { Package } from "@/lib/types";

interface OutdatedInfo {
  current: string;
  latest: string;
  wanted: string;
}

interface PackageCardProps {
  description: string;
  index: number;
  onUpdateSuccess?: () => void;
  outdatedInfo?: OutdatedInfo;
  package: Package;
}

export function PackageCard({
  description,
  package: pkg,
  index,
  onUpdateSuccess,
  outdatedInfo,
}: PackageCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const isProduction = pkg.type === "production";
  const hasUpdate =
    outdatedInfo != null && outdatedInfo.wanted !== outdatedInfo.latest;

  const statusColor = hasUpdate
    ? "var(--color-status-warning)"
    : "var(--color-status-fresh)";

  const handleUpdate = async () => {
    if (!pkg.name || isUpdating) {
      return;
    }
    setIsUpdating(true);
    try {
      const res = await fetch("/api/packages/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: pkg.name }),
      });
      if (res.ok) {
        onUpdateSuccess?.();
      } else {
        setIsUpdating(false);
      }
    } catch {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="package-card group"
      data-index={index}
      ref={cardRef}
      style={{ "--index": index } as React.CSSProperties}
    >
      <Card className="relative cursor-default overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-foreground/5 hover:shadow-xl">
        {/* Left border accent — only visible when update is available */}
        {hasUpdate && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-[3px] rounded-l-[calc(var(--radius)_-_1px)]"
            style={{ backgroundColor: "var(--color-status-warning)" }}
          />
        )}

        {/* Subtle inner hover glow, tinted by package type */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 rounded-4xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${
            isProduction
              ? "bg-package-production/5"
              : "bg-package-development/5"
          }`}
        />

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          {/* Header row — icon left, badge right */}
          <div className="flex items-center justify-between gap-3">
            {/* Icon container */}
            <div
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 transition-colors duration-300 group-hover:bg-muted"
              style={{
                boxShadow: `inset 0 0 0 2px ${statusColor}`,
              }}
            >
              {isProduction ? (
                <PackageIcon className="h-5 w-5 text-foreground/60 transition-colors duration-300 group-hover:text-foreground" />
              ) : (
                <Wrench className="h-5 w-5 text-foreground/60 transition-colors duration-300 group-hover:text-foreground" />
              )}
            </div>

            {/* Type badge — always visible, right side */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-xs leading-none ${
                isProduction
                  ? "bg-package-production/15 text-package-production"
                  : "bg-package-development/15 text-package-development"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isProduction
                    ? "bg-package-production"
                    : "bg-package-development"
                }`}
              />
              {isProduction ? "Production" : "Development"}
            </span>
          </div>

          {/* Package name + version line */}
          <div className="flex flex-col gap-1.5">
            <h3
              className="truncate font-heading text-foreground text-lg leading-tight sm:text-xl"
              title={pkg.name}
            >
              {pkg.name}
            </h3>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {/* Current version */}
              <span className="font-mono text-muted-foreground text-sm">
                {pkg.version}
              </span>

              {/* Update available — inline pill */}
              {hasUpdate && outdatedInfo && (
                <span className="inline-flex items-center gap-1 rounded-full bg-status-warning/10 px-2 py-0.5 font-mono text-status-warning text-xs">
                  <ArrowUp className="h-2.5 w-2.5 shrink-0" />
                  {outdatedInfo.latest}
                </span>
              )}

              {/* Up-to-date — green badge */}
              {outdatedInfo && !hasUpdate && (
                <span className="inline-flex items-center gap-1 rounded-full bg-status-fresh/10 px-2 py-0.5 font-medium text-status-fresh text-xs">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  Current
                </span>
              )}
            </div>
          </div>

          {/* Footer — description left, update button right */}
          <div className="mt-auto flex items-start gap-3 border-border/50 border-t pt-3">
            {hasUpdate ? (
              <>
                <p className="flex-1 text-muted-foreground text-xs leading-relaxed">
                  {description}
                </p>
                <button
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-status-warning/15 px-3 py-1.5 font-medium text-status-warning text-xs transition-all duration-200 hover:bg-status-warning/25 hover:shadow-[0_0_12px_-2px_var(--color-status-warning)] disabled:cursor-wait disabled:opacity-60"
                  disabled={isUpdating}
                  onClick={handleUpdate}
                  type="button"
                >
                  {isUpdating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ArrowUp className="h-3 w-3" />
                  )}
                  Update
                </button>
              </>
            ) : (
              <>
                <p className="flex-1 text-muted-foreground text-xs leading-relaxed">
                  {description}
                </p>
                {/* Spacer — matches the natural height of the update button row
                    so cards without updates align with cards that have them */}
                <div
                  aria-hidden="true"
                  className="h-[28px] w-[72px] shrink-0"
                />
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
