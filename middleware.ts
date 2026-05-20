import { type NextRequest, NextResponse } from "next/server";

// In-memory rate limiting store
const rateLimitStore = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 30;
const CLEANUP_INTERVAL_MS = 60_000; // Cleanup expired entries once per minute
let lastCleanup = 0;

function cleanupExpiredEntries(now: number) {
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    for (const [ip, record] of rateLimitStore.entries()) {
      if (record.reset <= now) {
        rateLimitStore.delete(ip);
      }
    }
    lastCleanup = now;
  }
}

export function middleware(request: NextRequest) {
  // Only rate limit API routes
  const url = request.url;
  if (!url?.includes("/api/")) {
    return NextResponse.next();
  }

  // Proactively cleanup expired entries to prevent memory leak
  cleanupExpiredEntries(Date.now());

  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  // Use first IP from forwarded-for chain, or real-ip, or a placeholder
  const ip = forwardedFor
    ? forwardedFor.split(",")[0].trim()
    : (realIp ?? "anonymous");
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (record && record.reset > now) {
    if (record.count >= MAX_REQUESTS) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((record.reset - now) / 1000)),
            "Cache-Control": "no-store",
          },
        }
      );
    }
    record.count++;
  } else {
    rateLimitStore.set(ip, { count: 1, reset: now + WINDOW_MS });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
