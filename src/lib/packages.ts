import type { OutdatedPackage, Package } from "./types";

export type { OutdatedPackage, Package } from "./types";

export function sortPackages(
  packages: Package[],
  outdatedPackages: Record<string, OutdatedPackage>
): Package[] {
  return [...packages].sort((a, b) => {
    const aInfo = outdatedPackages[a.name];
    const bInfo = outdatedPackages[b.name];
    const aHasUpdate = aInfo && aInfo.wanted !== aInfo.latest;
    const bHasUpdate = bInfo && bInfo.wanted !== bInfo.latest;

    if (aHasUpdate && !bHasUpdate) {
      return -1;
    }
    if (!aHasUpdate && bHasUpdate) {
      return 1;
    }

    if (a.type !== b.type) {
      return a.type === "production" ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
  });
}

/**
 * Parse `bun outdated` pipe-table output into a lookup map.
 * Used by both page.tsx (server) and api/packages/status/route.ts.
 */
export function parseBunOutdated(
  stdout: string
): Record<string, OutdatedPackage> {
  const result: Record<string, OutdatedPackage> = {};
  for (const line of stdout.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed?.startsWith("|") || trimmed.includes("---")) {
      continue;
    }
    const cells = trimmed
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 4) {
      continue;
    }
    const [name, current, wanted, latest] = cells;
    if (!(name && current && wanted && latest) || current === "Current") {
      continue;
    }
    const cleanName = name.replace(" (dev)", "");
    result[cleanName] = { name: cleanName, current, wanted, latest };
  }
  return result;
}
