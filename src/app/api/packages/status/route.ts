import { execFile } from "node:child_process";
import { NextResponse } from "next/server";
import { parseBunOutdated } from "@/lib/packages";

export const dynamic = "force-dynamic";

export async function GET() {
  let stdout = "";

  try {
    const result = await new Promise<{ stdout: string }>((resolve, reject) => {
      execFile("bun", ["outdated"], { cwd: process.cwd() }, (err, stdout) => {
        if (err) {
          reject(err);
        } else {
          resolve({ stdout: stdout ?? "" });
        }
      });
    });
    stdout = result.stdout;
  } catch {
    return NextResponse.json(
      {
        status: "stale",
        error: "Failed to check package status",
        outdatedCount: null,
        outdatedPackages: [],
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const outdatedMap = parseBunOutdated(stdout);
  const outdated = Object.values(outdatedMap);

  if (outdated.length > 0) {
    return NextResponse.json(
      {
        status: "warning",
        outdatedCount: outdated.length,
        outdatedPackages: outdated,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      status: "fresh",
      outdatedCount: 0,
      outdatedPackages: [],
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
