export interface Package {
  name: string;
  type: "production" | "development";
  version: string;
}

export interface OutdatedPackage {
  current: string;
  latest: string;
  name: string;
  wanted: string;
}

export type PackageStatus = "loading" | "fresh" | "warning" | "stale";

export interface PackageUpdateResult {
  success: boolean;
}
