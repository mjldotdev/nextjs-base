"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string | number };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Only log error digest or message - never the full stack trace client-side
    const errorId = error.digest ? String(error.digest) : error.message;
    console.error("[error]", errorId);
  }, [error]);

  return (
    <div className="page-gradient min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="font-serif text-4xl text-foreground sm:text-5xl">
            Something went wrong
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            An unexpected error occurred.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
              onClick={reset}
              type="button"
            >
              Try again
            </button>
            <a
              className="rounded-md border border-border px-4 py-2 font-medium text-sm transition-colors hover:bg-muted"
              href="/"
            >
              Go home
            </a>
          </div>
          {error.digest && (
            <p className="mt-6 font-mono text-muted-foreground text-xs">
              Error ID: {String(error.digest)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
