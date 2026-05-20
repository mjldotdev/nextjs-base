import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function POST(_request: NextRequest) {
  try {
    const packageJsonPath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

    const names = [
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {}),
    ];

    // execFileSync is synchronous — blocks until the command completes.
    // Shell injection is prevented by passing args as an array (not a string).
    execFileSync(
      "bun",
      ["add", ...names.map((n) => `${n}@latest`), "--exact"],
      { cwd: process.cwd(), encoding: "utf-8" }
    );

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const error = err as Error & { stderr?: string };
    // Log details server-side only - never expose raw stderr to clients
    console.error(
      "[update-all/route] bun add all failed:",
      error.stderr || error.message
    );
    return NextResponse.json(
      {
        error:
          "All packages update failed. Check the package names and try again.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
