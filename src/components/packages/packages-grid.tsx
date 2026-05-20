"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { PackageCard } from "./package-card";

gsap.registerPlugin(ScrollTrigger);

export const PACKAGE_DESCRIPTIONS: Record<string, string> = {
  "@base-ui/react":
    "Headless UI components for building accessible interfaces.",
  "@gsap/react": "Professional-grade animation for React powered by GSAP.",
  "@tailwindcss/postcss": "Utility-first CSS with PostCSS integration.",
  "class-variance-authority": "Typed component variant utilities.",
  clsx: "Conditionally joining class names.",
  gsap: "High-performance animation and tweening engine.",
  lenis: "Smooth scrolling library with momentum and easing.",
  "lucide-react": "Pixel-perfect icon library for React.",
  next: "Full-stack React framework for production.",
  "next-themes": "Zero-config dark mode for Next.js.",
  react: "UI library for building component-based interfaces.",
  "react-dom": "DOM rendering entry point for React.",
  shadcn: "Beautifully designed components built with Radix UI.",
  "tailwind-merge": "Merge Tailwind class strings intelligently.",
  "tw-animate-css": "Tailwind-first CSS animation utilities.",
  "@biomejs/biome": "All-in-one linter and formatter for the web.",
  "@react-email/components": "Pre-built email components for React Email.",
  "@tanstack/react-form": "Scalable, type-safe form management.",
  "@types/node": "TypeScript definitions for Node.js.",
  "@types/react": "TypeScript definitions for React.",
  "@types/react-dom": "TypeScript definitions for React DOM.",
  "@vercel/analytics": "Privacy-first web analytics for Vercel.",
  resend: "Email API for developers — simple and reliable.",
  tailwindcss: "Utility-first CSS framework for rapid UI.",
  typescript: "Typed superset of JavaScript.",
  ultracite: "Zero-config code quality preset via Biome.",
};

export type { OutdatedPackage, Package } from "@/lib/types";

import type { OutdatedPackage, Package } from "@/lib/types";

interface PackagesGridProps {
  className?: string;
  onUpdateSuccess?: () => void;
  outdatedPackages: Record<string, OutdatedPackage>;
  packages: Package[];
}

export function PackagesGrid({
  packages,
  className = "",
  onUpdateSuccess,
  outdatedPackages,
}: PackagesGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Staggered reveal animation for cards
    const cards = gridRef.current?.querySelectorAll(".package-card");
    if (!cards || cards.length === 0) {
      return;
    }

    // Initial state - hidden and slightly below
    gsap.set(cards, {
      opacity: 0,
      y: 40,
    });

    // Create the animation timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: gridRef.current,
        start: "top 85%",
        once: true,
      },
    });

    const scrollTriggers: ScrollTrigger[] = [];
    if (tl.scrollTrigger) {
      scrollTriggers.push(tl.scrollTrigger);
    }

    tl.to(cards, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out",
      stagger: {
        amount: 0.6,
        from: "start",
      },
    });

    return () => {
      for (const st of scrollTriggers) {
        st.kill();
      }
    };
  }, []);

  return (
    <section className={className}>
      {/* Packages Grid - mobile: 1 col, tablet: 2 cols, desktop: 3 cols */}
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
        ref={gridRef}
      >
        {packages.map((pkg, index) => (
          <PackageCard
            description={
              PACKAGE_DESCRIPTIONS[pkg.name] ||
              (pkg.type === "production"
                ? "Production dependency"
                : "Development dependency")
            }
            index={index}
            key={`${pkg.type}-${pkg.name}`}
            onUpdateSuccess={onUpdateSuccess}
            outdatedInfo={outdatedPackages[pkg.name]}
            package={pkg}
          />
        ))}
      </div>
    </section>
  );
}
