import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <div className="page-gradient min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-serif text-8xl text-muted-foreground">404</p>
          <h1 className="mt-4 font-serif text-3xl text-foreground sm:text-4xl">
            Page not found
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
          <div className="mt-8">
            <Link
              className="rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
              href="/"
            >
              Return home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
