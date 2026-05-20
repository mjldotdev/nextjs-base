import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Footer } from "@/components/footer";
import {
  type OutdatedPackage,
  parseBunOutdated,
  sortPackages,
} from "@/lib/packages";
import type { Package } from "@/lib/types";

export const metadata: Metadata = {
  description:
    "A production-ready Next.js 16 starter with TypeScript, Tailwind CSS v4, shadcn components, GSAP animations, and automated audit workflow.",
};

const PackagesClient = dynamic(() =>
  import("./packages-client").then((m) => m.PackagesClient)
);

async function parsePackageJson(): Promise<{
  dependencies: Package[];
  devDependencies: Package[];
}> {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  let packageJson: Record<string, unknown>;

  try {
    const content = await fs.readFile(packageJsonPath, "utf-8");
    packageJson = JSON.parse(content);
  } catch {
    return { dependencies: [], devDependencies: [] };
  }

  const rawDeps = packageJson.dependencies;
  const rawDevDeps = packageJson.devDependencies;

  const dependencies: Package[] = Object.entries(
    rawDeps != null && typeof rawDeps === "object" ? rawDeps : {}
  ).map(([name, version]) => ({
    name,
    version: (version as string) ?? "0.0.0",
    type: "production" as const,
  }));

  const devDependencies: Package[] = Object.entries(
    rawDevDeps != null && typeof rawDevDeps === "object" ? rawDevDeps : {}
  ).map(([name, version]) => ({
    name,
    version: (version as string) ?? "0.0.0",
    type: "development" as const,
  }));

  return { dependencies, devDependencies };
}

async function getOutdatedPackages(): Promise<Record<string, OutdatedPackage>> {
  try {
    const { execFileSync } = await import("node:child_process");
    const stdout = execFileSync("bun", ["outdated"], {
      cwd: process.cwd(),
      encoding: "utf-8",
      maxBuffer: Number.POSITIVE_INFINITY,
    });
    return parseBunOutdated(stdout);
  } catch {
    return {};
  }
}

export default async function HomePage() {
  const { dependencies, devDependencies } = await parsePackageJson();
  const outdatedPackages = await getOutdatedPackages();
  const allPackages = sortPackages(
    [...dependencies, ...devDependencies],
    outdatedPackages
  );

  return (
    <div className="page-gradient min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-16 sm:px-6 lg:px-8 lg:py-20">
        <PackagesClient
          initialOutdatedPackages={outdatedPackages}
          packageCount={dependencies.length + devDependencies.length}
          packages={allPackages}
        />
      </div>
      <Footer />
    </div>
  );
}
