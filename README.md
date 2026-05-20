# Next.js Base

Production-ready Next.js 16 + React 19 starter with App Router, TypeScript strict mode, Tailwind CSS v4, shadcn components, GSAP animations, and an automated audit/update workflow.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 + React 19, App Router |
| Package Manager | Bun |
| Language | TypeScript 6 (strict mode) |
| Styling | Tailwind CSS v4 + CSS variables |
| UI Primitives | `@base-ui/react` |
| UI Components | shadcn v4 (`base-luma` style) with CVA + tailwind-merge |
| Animation | GSAP 3 + ScrollTrigger + Lenis smooth scroll |
| Theming | `next-themes` (dark/light/system) + CSS variable-based tokens |
| Linting/Formatting | Ultracite (Biome-based, zero-config) |
| Icons | Lucide React |
| Forms | `@tanstack/react-form` |
| Email | Resend + React Email (configured, not wired) |
| Analytics | Vercel Analytics |
| Path Alias | `@/*` → `./src/*` |

## Quick Start

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Lint + format
bun run check   # or: bun run fix (auto-fix)
```

## Starting Fresh (Clean Slate)

This starter ships with a full package management UI. To use it as a clean foundation for a new project, strip out the package management files:

**Delete these files/directories:**

```bash
# Package management components
rm -rf src/components/packages/

# Package management API routes
rm -rf src/app/api/packages/

# Package client component
rm -rf src/app/packages-client.tsx

# Package utilities
rm -rf src/lib/packages.ts

# Optional: custom error/loading/not-found pages
rm -f src/app/error.tsx
rm -f src/app/loading.tsx
rm -f src/app/not-found.tsx

# Optional: remove project-specific docs
rm -f GEMINI.md INIT.md PLAN.md

# Optional: keep tools/ and workflows/ if you want /update-starter support
# rm -rf tools/ workflows/
```

**Replace `src/app/page.tsx` with a minimal "Hello World":**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My App",
  description: "Welcome to my Next.js app",
};

export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold">Hello World</h1>
    </main>
  );
}
```

**Update metadata in `src/app/layout.tsx`** to remove the package manager description.

## Project Structure

```
project-root/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout (fonts, theme, smooth scroll)
│   │   ├── page.tsx             # Packages dashboard (async server component)
│   │   ├── packages-client.tsx  # "use client" packages UI shell
│   │   ├── globals.css          # Tailwind v4: design tokens + @theme
│   │   ├── error.tsx            # Error boundary
│   │   ├── loading.tsx          # Loading skeleton
│   │   ├── not-found.tsx        # 404 page
│   │   ├── robots.ts            # robots.txt
│   │   ├── sitemap.ts           # sitemap.xml
│   │   └── api/packages/        # API routes
│   │       ├── status/route.ts  # GET: bun outdated → { outdatedCount }
│   │       ├── versions/route.ts # GET: all packages from package.json
│   │       ├── update/route.ts  # POST: update single package
│   │       └── update-all/route.ts # POST: update all packages
│   ├── components/
│   │   ├── ui/                  # shadcn components (button, card, input, select)
│   │   ├── providers/           # theme-provider, scroll-provider
│   │   ├── packages/            # StatusBadge, PageHeader, PackageCard, PackagesGrid, FilterBar
│   │   └── footer.tsx           # Footer and FooterLarge
│   └── lib/
│       ├── utils.ts             # cn() utility (clsx + tailwind-merge)
│       ├── types.ts             # Package, OutdatedPackage, PackageStatus
│       ├── packages.ts          # sortPackages, parseBunOutdated
│       └── site.config.ts       # Site-wide config (author, socials, tagline)
├── tools/                       # WAT execution tools (Python)
├── workflows/                   # /update-starter SOP
├── .claude/
│   ├── CLAUDE.md               # Ultracite code standards
│   └── skills/update-starter/  # /update-starter skill
├── .env.example
├── components.json              # shadcn v4 configuration
├── next.config.ts
├── biome.jsonc                  # ultracite/biome presets
└── package.json
```

## Features

### Package Dependency Dashboard

The home page (`src/app/page.tsx`) is an **async server component** that reads `package.json` and runs `bun outdated` at build time. It renders an interactive dashboard (`PackagesClient`) that shows:
- All production and development packages with current/wanted/latest versions
- Status badges: Fresh (up-to-date), Warning (updates available), Stale (severely outdated)
- Filter bar: search by name, filter by production/development/all
- Per-package update button and "Update All" action
- GSAP ScrollTrigger entrance animations on the cards

The `src/lib/site.config.ts` stores the author name, social links, tagline, and app metadata in one place — used by the layout, footer, and opengraph image. Edit this file when personalizing the project.

### shadcn UI Components

This project uses shadcn v4 with `@base-ui/react` as the primitive library. Components live in `src/components/ui/` and are composed with `class-variance-authority` (CVA) and `tailwind-merge`.

**Adding a new component:**
```bash
bunx --bun shadcn add <component-name>
```

**Available components:**
- `ui/button` — Multi-variant button with `class-variance-authority` (default, outline, secondary, ghost, destructive, link)
- `ui/card` — Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter
- `ui/input` — Text input styled with Tailwind and `data-slot`
- `ui/select` — Full dropdown (SelectTrigger, SelectContent, SelectItem, etc.)

### GSAP + Lenis Scroll

The `scroll-provider.tsx` sets up smooth scrolling with Lenis and ties it into GSAP's ticker for synchronized ScrollTrigger updates. Components that need scroll animations should import from `gsap` and `gsap/ScrollTrigger` directly.

The `@gsap/react` package (`useGSAP` hook) is available for React-specific GSAP usage.

### Theming

Dark/light/system mode via `next-themes`. Design tokens are CSS variables defined in `globals.css` (Tailwind v4 CSS-native config — no `tailwind.config.ts`). The `.page-gradient` class applies radial gradient backgrounds that adapt to dark mode.

### Footer

`src/components/footer.tsx` exports `Footer` (minimal, centered) and `FooterLarge` (three-column). Both read from `siteConfig.socials` and render inline SVG icons — no icon library dependency.

### Site Configuration

`src/lib/site.config.ts` is the single source of truth for app-wide metadata. Edit this when cloning:
- `siteConfig.name` — app name used in `<title>` template and OG tags
- `siteConfig.author` — author name, URL, Twitter handle
- `siteConfig.socials` — social links rendered in the footer
- `siteConfig.tagline` — shown in FooterLarge

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key for transactional email |
| `EMAIL_DOMAIN` | Verified sender domain in Resend |
| `NEXT_PUBLIC_APP_URL` | App's public URL (default: `http://localhost:3000`) |

## API Routes

The packages dashboard is backed by four API routes under `/api/packages/`:

| Route | Method | Description |
|---|---|---|
| `/api/packages/status` | GET | Runs `bun outdated`, returns `{ status, outdatedCount, outdatedPackages }` |
| `/api/packages/versions` | GET | Reads `package.json`, returns all packages as `{ name, version, type }[]` |
| `/api/packages/update` | POST | Updates a single package via `bun add name@latest --exact`. Body: `{ name: string }`. |
| `/api/packages/update-all` | POST | Updates all packages at once. Body: `{ packages: string[] }`. |

All update routes sanitize errors server-side — stderr is never exposed to the client.

## /update-starter Workflow

The `/update-starter` skill (registered via `/update-starter` in Claude Code) runs the full audit and update pipeline:

```
Step 1  →  python tools/update_deps.py --list
Step 3  →  python tools/update_deps.py --interactive
Step 5  →  audit_deps.py    (npm audit + CVE scan)
Step 6  →  audit_types.py   (bunx tsc --noEmit --strict)
Step 7  →  audit_security.py (ignoreBuildErrors, secrets, .gitignore)
Step 8  →  audit_lint.py     (ultracite check)
Step 9  →  audit_build.py    (bun run build)
Step 10 →  generate_report.py (unified PASS/FAIL)
```

**Package selection in Step 3** adapts to the environment:
- **Real terminal**: checklist TUI (`[x]`/`[ ]` checkbox, arrow keys + space + enter)
- **Claude Code session (no TTY)**: exits with code 3, writes `interactive-required` status to `update_deps.json`. The agent uses `AskUserQuestion` to let you pick.

**Pass all 5 audits to be production-ready.** Run with:
```bash
# First time: bootstrap the skill
python tools/bootstrap_skill.py

# Then use in Claude Code
/update-starter
```

Audit results are written to `tools/.audit_results/*.json`.

## Tool Reference

All tools use the same pattern:
- Exit code `0` = pass, non-zero = fail
- Results written to `tools/.audit_results/<tool>.json`

**`update_deps.py --interactive` exit codes:** `0` = updated, `3` = non-TTY (caller should use `AskUserQuestion`), `1` = error

| Command | What it does |
|---|---|
| `python tools/update_deps.py --list` | List outdated packages |
| `python tools/update_deps.py --interactive` | TTY: checklist UI; no TTY: exits 3 (use AskUserQuestion) |
| `python tools/update_deps.py --update <pkg> [...]` | Update packages to latest (any version) |
| `python tools/audit_deps.py` | CVE scan + version lag |
| `python tools/audit_types.py` | TypeScript strict mode |
| `python tools/audit_security.py` | Security config checks |
| `python tools/audit_lint.py` | Lint/format check |
| `python tools/audit_build.py` | Production build |
| `python tools/generate_report.py` | Unified summary |

## Code Standards

This project enforces code quality via **Ultracite** (Biome-based, zero-config preset).

```bash
bun run check   # Check for issues
bun run fix     # Auto-fix formatting + lint
```

Rules are applied automatically on commit via Ultracite's linting. Key principles:
- shadcn components first — don't build custom if a shadcn component exists
- Use explicit types, prefer `unknown` over `any`
- Use `async/await`, not Promise chains
- Function components only, hooks at top level
- Accessible: semantic HTML, ARIA attributes, keyboard events

See [`.claude/CLAUDE.md`](.claude/CLAUDE.md) for the full code standards document.

## Deployment

```bash
bun run build
bun run start
```

The project uses Bun as the runtime. Vercel Analytics is wired up — deploy to Vercel for best integration.

**Before deploying:**
- Set `NEXT_PUBLIC_APP_URL` to your production URL in the deployment environment
- `next.config.ts` includes 6 security headers (CSP, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy) applied to all routes
- Ensure `RESEND_API_KEY` and `EMAIL_DOMAIN` are set in the production environment (not in the codebase)