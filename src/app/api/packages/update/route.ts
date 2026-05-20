import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Pre-compiled regex for npm package name validation (performance)
// Allows scoped packages (@scope/name) and regular packages
const NPM_PACKAGE_NAME_REGEX = /^(?:@[a-z0-9-._~]+\/)?[a-z0-9-._~]+$/i;

function getKnownPackages(): Set<string> {
  const pkg = JSON.parse(
    readFileSync(join(process.cwd(), "package.json"), "utf-8")
  );
  const all = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ];
  return new Set(all);
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Invalid package name" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Validate npm package name format (defense in depth)
    if (!NPM_PACKAGE_NAME_REGEX.test(name)) {
      return NextResponse.json(
        { error: "Invalid package name format" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const knownPackages = getKnownPackages();
    if (!knownPackages.has(name)) {
      return NextResponse.json(
        { error: "Unknown package" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // execFileSync is synchronous — blocks until the command completes.
    // Shell injection is prevented by passing args as an array (not a string).
    execFileSync("bun", ["add", `${name}@latest`, "--exact"], {
      cwd: process.cwd(),
      encoding: "utf-8",
    });

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const error = err as Error & { stderr?: string };
    // Log details server-side only - never expose raw stderr to clients
    console.error(
      `[update/route] bun add ${name} failed:`,
      error.stderr || error.message
    );
    return NextResponse.json(
      {
        error: "Package update failed. Check the package names and try again.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
