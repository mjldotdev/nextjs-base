"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { FilterBar, type FilterType } from "@/components/packages/filter-bar";
import { PackagesGrid } from "@/components/packages/packages-grid";
import { PageHeaderClient } from "@/components/packages/page-header";
import { type OutdatedPackage, sortPackages } from "@/lib/packages";
import type { Package } from "@/lib/types";

type PackageStatus = "loading" | "fresh" | "warning" | "stale";

interface StatusResult {
  outdatedCount: number | null;
  outdatedPackages: OutdatedPackage[];
  status: PackageStatus;
}

interface PackagesClientProps {
  initialOutdatedPackages: Record<string, OutdatedPackage>;
  packageCount: number;
  packages: Package[];
}

export function PackagesClient({
  packages: initialPackages,
  initialOutdatedPackages,
  packageCount,
}: PackagesClientProps & { packages: Package[] }) {
  const router = useRouter();
  const [outdatedPackages, setOutdatedPackages] = useState<
    Record<string, OutdatedPackage>
  >(initialOutdatedPackages);
  const [outdatedCount, setOutdatedCount] = useState<number | null>(
    Object.keys(initialOutdatedPackages).length ?? null
  );
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const [packages, setPackages] = useState<Package[]>(initialPackages);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const [statusRes, versionsRes] = await Promise.all([
        fetch("/api/packages/status"),
        fetch("/api/packages/versions"),
      ]);

      if (statusRes.ok) {
        const data: StatusResult = await statusRes.json();
        setOutdatedPackages(
          data.outdatedPackages.reduce<Record<string, OutdatedPackage>>(
            (acc, pkg) => {
              acc[pkg.name] = pkg;
              return acc;
            },
            {}
          )
        );
        setOutdatedCount(data.outdatedCount);
      }

      if (versionsRes.ok) {
        const versionsData = await versionsRes.json();
        setPackages(versionsData.packages);
      }
    } catch {
      setOutdatedCount(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const updateAll = useCallback(async () => {
    if (isUpdatingAll) {
      return;
    }
    setIsUpdatingAll(true);
    try {
      const res = await fetch("/api/packages/update-all", { method: "POST" });
      if (res.ok) {
        await checkStatus();
        setIsUpdatingAll(false);
        router.refresh();
      } else {
        setIsUpdatingAll(false);
      }
    } catch {
      setIsUpdatingAll(false);
    }
  }, [isUpdatingAll, checkStatus, router]);

  const handlePackageUpdate = useCallback(async () => {
    await checkStatus();
    router.refresh();
  }, [checkStatus, router]);

  const sortedPackages = sortPackages(packages, outdatedPackages);

  const filteredPackages = sortedPackages.filter((pkg) => {
    const matchesSearch = pkg.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || pkg.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <>
      <PageHeaderClient
        isChecking={isChecking}
        isUpdatingAll={isUpdatingAll}
        onRefresh={checkStatus}
        onUpdateAll={updateAll}
        outdatedCount={outdatedCount ?? undefined}
        packageCount={packageCount}
      />
      <div className="mt-1 mb-6">
        <FilterBar
          filterType={filterType}
          onFilterChange={setFilterType}
          onSearchChange={setSearchQuery}
          searchQuery={searchQuery}
        />
      </div>
      <PackagesGrid
        onUpdateSuccess={handlePackageUpdate}
        outdatedPackages={outdatedPackages}
        packages={filteredPackages}
      />
    </>
  );
}
