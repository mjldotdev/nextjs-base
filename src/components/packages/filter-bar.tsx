"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FilterType = "all" | "production" | "development";

interface FilterBarProps {
  filterType: FilterType;
  onFilterChange: (value: FilterType) => void;
  onSearchChange: (value: string) => void;
  searchQuery: string;
}

export function FilterBar({
  filterType,
  onFilterChange,
  onSearchChange,
  searchQuery,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      {/* Desktop: Category Tags — left side */}
      <div className="hidden flex-wrap items-center gap-2 sm:flex">
        <CategoryPill
          active={filterType === "all"}
          color=""
          label="All"
          onClick={() => onFilterChange("all")}
        />
        <CategoryPill
          active={filterType === "production"}
          color="bg-package-production"
          dotColor="bg-white/70"
          label="Production"
          onClick={() => onFilterChange("production")}
        />
        <CategoryPill
          active={filterType === "development"}
          color="bg-package-development"
          dotColor="bg-white/70"
          label="Development"
          onClick={() => onFilterChange("development")}
        />
      </div>

      {/* Mobile: inline Search + Dropdown */}
      <div className="flex w-full flex-row gap-2 sm:hidden">
        {/* Mobile search — LEFT */}
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="h-9 w-full pl-9"
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            type="search"
            value={searchQuery}
          />
        </div>

        {/* Mobile filter dropdown — RIGHT */}
        <Select
          onValueChange={(v) => onFilterChange(v as FilterType)}
          value={filterType}
        >
          <SelectTrigger className="h-9 w-[140px] shrink-0 capitalize">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent className="w-[120px] rounded-3xl">
            <SelectItem value="all">All Packages</SelectItem>
            <SelectItem value="development">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-package-development" />
                Development
              </span>
            </SelectItem>
            <SelectItem value="production">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-package-production" />
                Production
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Search — right side, pushed to far right */}
      <div className="hidden sm:ml-auto sm:flex sm:items-center sm:gap-4">
        {/* Desktop: Search */}
        <div className="sm:w-full sm:max-w-[280px]">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="h-9 w-full pl-9"
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search packages..."
              type="search"
              value={searchQuery}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryPill({
  active,
  color,
  dotColor,
  label,
  onClick,
}: {
  active: boolean;
  color: string;
  dotColor?: string;
  label: string;
  onClick: () => void;
}) {
  let pillClasses: string;
  if (active && !color) {
    pillClasses = "border-transparent bg-foreground text-background";
  } else if (active && color) {
    pillClasses = `${color} border-transparent text-white`;
  } else {
    pillClasses =
      "border-border/60 bg-transparent text-muted-foreground hover:border-foreground/20 hover:text-foreground";
  }

  return (
    <button
      className={cn(
        "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-medium text-sm transition-all duration-200",
        pillClasses
      )}
      onClick={onClick}
      type="button"
    >
      {color && dotColor && (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
      )}
      {label}
    </button>
  );
}
