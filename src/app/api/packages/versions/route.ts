import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  const packages = [
    ...Object.entries(packageJson.dependencies || {}).map(
      ([name, version]) => ({
        name,
        version,
        type: "production" as const,
      })
    ),
    ...Object.entries(packageJson.devDependencies || {}).map(
      ([name, version]) => ({
        name,
        version,
        type: "development" as const,
      })
    ),
  ];

  return NextResponse.json(
    { packages },
    { headers: { "Cache-Control": "no-store" } }
  );
}
