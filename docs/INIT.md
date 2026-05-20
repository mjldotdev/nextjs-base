# px-0: Next.js Starter

Full-featured Next.js 16 starter with a built-in **package dependency dashboard**, production audits, and the WAT toolchain (Workflows, Agents, Tools).

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 + React 19, App Router |
| Package Manager | Bun |
| Language | TypeScript 6 (strict mode) |
| Path Alias | `@/*` → `./src/*` |
| Styling | Tailwind CSS v4 (CSS-first, no config file) + CSS variables |
| UI Primitives | `@base-ui/react` |
| UI Components | shadcn v4 (`base-luma` style) with CVA + tailwind-merge |
| Animation | GSAP 3 + ScrollTrigger + Lenis smooth scroll |
| Theming | `next-themes` (dark/light/system) + CSS token-based design |
| Linting/Formatting | Ultracite (Biome-based, zero-config) |
| Icons | Lucide React |
| Forms | `@tanstack/react-form` |
| Email | Resend + React Email |
| Analytics | Vercel Analytics |
| SEO | Full OG, Twitter card, robots, sitemap via App Router |

## Initialize Project

```bash
# Create project directory and navigate to it
mkdir -p my-project && cd my-project

# Create Next.js app with Bun
bunx create-next-app@latest . --typescript --tailwind --biome --app --src-dir --import-alias "@/*" --use-bun

# Initialize ultracite (Biome linting framework)
bunx ultracite@latest init --pm bun --linter biome --frameworks react next --agents claude gemini --editors vscode antigravity --hooks claude

# Install core animation deps
bun add gsap @gsap/react lenis

# Install styling & UI deps
bun add tailwindcss@4 @tailwindcss/postcss
bun add tw-animate-css class-variance-authority clsx tailwind-merge
bunx --bun shadcn@latest init --template next --base base --preset luma

# Install Base UI primitives (shadcn's underlying component library)
bun add @base-ui/react

# Install providers & analytics
bun add next-themes @vercel/analytics

# Install form handling
bun add @tanstack/react-form

# Install email
bun add resend @react-email/components

# Install shadcn components
bunx --bun shadcn@latest add button card input select
```

## Project Structure

```
my-project/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout (fonts, theme, smooth scroll)
│   │   ├── page.tsx               # Packages dashboard (async server component)
│   │   ├── page-client.tsx        # PackagesClient (interactive UI, dynamic)
│   │   ├── globals.css            # Tailwind v4: design tokens + @theme inline
│   │   ├── error.tsx             # Error boundary
│   │   ├── loading.tsx           # Loading skeleton
│   │   ├── not-found.tsx         # 404 page
│   │   ├── robots.ts             # robots.txt
│   │   ├── sitemap.ts            # sitemap.xml
│   │   └── api/packages/
│   │       ├── status/route.ts   # GET outdated count
│   │       ├── versions/route.ts # GET all packages with versions
│   │       ├── update/route.ts   # POST update single package
│   │       └── update-all/route.ts # POST update all packages
│   ├── components/
│   │   ├── ui/                   # shadcn components (button, card, input, select)
│   │   ├── providers/
│   │   │   ├── theme-provider.tsx
│   │   │   └── scroll-provider.tsx
│   │   ├── packages/
│   │   │   ├── status-badge.tsx
│   │   │   ├── page-header.tsx
│   │   │   ├── package-card.tsx
│   │   │   ├── packages-grid.tsx
│   │   │   └── filter-bar.tsx
│   │   └── footer.tsx
│   └── lib/
│       ├── utils.ts              # cn() — clsx + tailwind-merge
│       ├── types.ts              # Package, OutdatedPackage, PackageStatus
│       ├── packages.ts           # sortPackages, parseBunOutdated
│       └── site.config.ts        # Author, socials, app metadata
├── tools/
│   ├── bootstrap_skill.py      # Register /update-starter skill
│   ├── update_deps.py          # List/interactive-select/apply package updates
│   ├── audit_deps.py           # npm audit CVE + bun outdated lag check
│   ├── audit_types.py          # tsc --noEmit --strict
│   ├── audit_security.py       # ignoreBuildErrors, hardcoded secrets, CSP
│   ├── audit_lint.py           # ultracite check
│   ├── audit_build.py          # bun run build
│   └── generate_report.py      # Unified PASS/FAIL report
├── workflows/
│   └── update-starter.md        # /update-starter SOP
├── .claude/
│   ├── CLAUDE.md               # Code standards (Ultracite)
│   └── skills/update-starter/
│       └── SKILL.md            # /update-starter skill definition
├── .vscode/
│   ├── extensions.json         # Recommended extensions
│   └── settings.json          # Workspace settings (Biome formatter default)
├── next.config.ts              # Security headers, typed routes, image domains
├── postcss.config.js           # @tailwindcss/postcss (Tailwind v4)
├── biome.jsonc                # ultracite/biome presets
├── components.json            # shadcn v4 config
├── package.json
├── tsconfig.json
└── INIT.md
```

## Configuration Files

### next.config.ts

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  productionBrowserSourceMaps: false,
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.unsplash.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://resend.com; frame-ancestors 'none';" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
```

### src/lib/site.config.ts

Central site configuration loaded by layout, footer, and opengraph-image.

```ts
export const siteConfig = {
  name: "Next.js Base",
  tagline: "Production-ready · TypeScript · Tailwind CSS v4 · shadcn v4",
  description: "Production-ready Next.js 16 + React 19 starter...",
  author: {
    name: "mjldotdev",
    url: "https://mjldotdev.vercel.app",
    twitter: "@mjldotdev",
  },
  socials: [
    { label: "GitHub", href: "https://github.com/mjldotdev", icon: "github" },
    { label: "LinkedIn", href: "https://linkedin.com/in/mjldotdev", icon: "linkedin" },
    { label: "X", href: "https://x.com/mjldotdev", icon: "x" },
  ],
  links: { home: "/" },
} as const;
```

## app/layout.tsx

Root layout with Google Fonts (DM Sans, Instrument Serif, JetBrains Mono), theme provider, scroll provider, analytics, and full SEO metadata (OG, Twitter, robots).

```tsx
import type { Metadata, Viewport } from "next";
import { Analytics } from "@/components/analytics";
import ScrollProvider from "@/components/providers/scroll-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { siteConfig } from "@/lib/site.config";
import "@/app/globals.css";
import { DM_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-instrument-serif", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover", userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  // ... full OG, Twitter cards, robots, keywords, authors, creator, publisher
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      className={cn("font-sans", dmSans.variable, instrumentSerif.variable, jetbrainsMono.variable)}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <link href="data:image/svg+xml,..." rel="icon" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
          <ScrollProvider>{children}</ScrollProvider>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## app/page.tsx

Server component that reads `package.json` and runs `bun outdated` at build time, then passes data to the interactive `PackagesClient`.

```tsx
import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Footer } from "@/components/footer";
import { parseBunOutdated, sortPackages } from "@/lib/packages";
import type { Package } from "@/lib/types";

export const metadata: Metadata = { description: "..." };

const PackagesClient = dynamic(() => import("./packages-client").then(m => m.PackagesClient));

async function parsePackageJson(): Promise<{ dependencies: Package[]; devDependencies: Package[] }> {
  const content = await fs.readFile(path.join(process.cwd(), "package.json"), "utf-8");
  const pkg = JSON.parse(content);
  // Returns arrays of { name, version, type: "production" | "development" }
}

async function getOutdatedPackages() {
  const { execFileSync } = await import("node:child_process");
  const stdout = execFileSync("bun", ["outdated"], { maxBuffer: Infinity });
  return parseBunOutdated(stdout);
}

export default async function HomePage() {
  const { dependencies, devDependencies } = await parsePackageJson();
  const outdatedPackages = await getOutdatedPackages();
  const allPackages = sortPackages([...dependencies, ...devDependencies], outdatedPackages);

  return (
    <div className="page-gradient min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 ...">
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
```

## app/globals.css

Tailwind v4 CSS-first config. Imports Lenis scroll CSS, `tailwindcss`, `tw-animate-css`, and `shadcn/tailwind.css`. Large `@theme inline` block defines all design tokens plus package/status colors. Mobile viewport fix via `100dvh` in `.page-gradient`.

```css
@import "lenis/dist/lenis.css";
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-heading: var(--font-instrument-serif);
  --font-sans: var(--font-dm-sans);
  --font-mono: var(--font-jetbrains-mono);
  /* All color tokens: background, foreground, primary, secondary, muted,
     destructive, border, input, ring, card, popover, accent, chart-1-5,
     sidebar-*, radius-sm/md/lg/xl/2xl/3xl/4xl */
  /* Status colors for the packages dashboard */
  --color-package-production: oklch(55% 0.2 280);
  --color-status-fresh: oklch(0.72 0.19 155);
  --color-status-warning: oklch(0.8 0.18 75);
  ...
}

:root { /* Light mode — all oklch() values */ }
.dark { /* Dark mode — all oklch() values */ }

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
  html { @apply font-sans scrollbar-gutter-stable; }
  .page-gradient {
    background: radial-gradient(ellipse 1200px 900px at 50% -200px, ...) var(--background);
  }
  .dark .page-gradient { /* darker radial gradients */ }
}
```

## Mobile Viewport Fix

Mobile browsers have a dynamic viewport bug where the address bar auto-hides during scroll. `100vh` doesn't account for this. The `page-gradient` class uses the shell's `min-height: 100dvh` to render correctly on all mobile browsers:

| Unit | Description |
|---|---|
| `dvh` | Dynamic viewport height — adjusts in real-time |
| `svh` | Small viewport height — safe minimum |
| `lvh` | Large viewport height — when toolbar is hidden |

The `body` in globals.css renders at `--viewport-height` (mapped to `100dvh`) via the `.page-gradient` container on the page.

## Providers

### components/providers/theme-provider.tsx

```tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### components/providers/scroll-provider.tsx

Sets up Lenis smooth scroll + GSAP ScrollTrigger integration.

```tsx
"use client";

import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export default function ScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    const update = (time: number) => { lenis.raf(time * 1000); };
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(update); lenis.destroy(); };
  }, []);
  return <>{children}</>;
}
```

## Components

### components/analytics.tsx

```tsx
import { Analytics } from "@vercel/analytics/react";
export { Analytics };
```

### components/footer.tsx

`Footer` (minimal) and `FooterLarge` (three-column). Both read from `siteConfig.socials` and render inline SVG icons for GitHub, LinkedIn, and X.

## API Routes

All routes live in `src/app/api/packages/`:

| Route | Method | Purpose |
|---|---|---|
| `/api/packages/status` | GET | Runs `bun outdated`, returns `{ status, outdatedCount, outdatedPackages }` |
| `/api/packages/versions` | GET | Reads `package.json`, returns all packages as `{ name, version, type }[]` |
| `/api/packages/update` | POST | Updates a single package: `bun add name@latest --exact` |
| `/api/packages/update-all` | POST | Updates all packages at once |

## .env.example

```bash
# Resend
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_DOMAIN=yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Run Commands

```bash
# Development
bun run dev

# Build
bun run build

# Start production server
bun run start

# Lint + format
bun run lint      # check only (ultracite check)
bun run check     # alias for lint
bun run fix       # auto-fix (ultracite fix)
```

## .vscode Configuration

#### .vscode/extensions.json

```json
{
  "recommendations": ["biomejs.biome", "bradlc.vscode-tailwindcss", "anthropic.claude-code"]
}
```

#### .vscode/settings.json

Biome as the default formatter for all languages, with `source.fixAll.biome` and `source.organizeImports.biome` running explicitly on save.