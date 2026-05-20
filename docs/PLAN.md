# PLAN.md — Status: Completed

This document was the implementation plan for the nextjs-starter project. It is preserved here as a record. See [INIT.md](INIT.md) for the current project reference, and [README.md](../README.md) for the user-facing overview.

---

## What Was Built

### Phase 1: Starter Template

All `src/` files were generated as defined in INIT.md. The project became a full-featured Next.js 16 starter with a **built-in package dependency dashboard** on the home page — not a minimal hello-world. Key additions beyond the initial plan:

- **Package management UI** at `/` — reads `package.json` and `bun outdated` at build time, displays all deps with update status, supports per-package and bulk updates via API routes
- **API routes** (`/api/packages/status|versions|update|update-all`) for the dashboard
- **`src/lib/site.config.ts`** — centralized author/socials/app metadata (not in original plan)
- **`src/lib/types.ts`** — shared TypeScript types for the packages domain
- **`src/lib/packages.ts`** — `sortPackages` and `parseBunOutdated` utilities
- **`src/components/footer.tsx`** — `Footer` and `FooterLarge` components
- **`src/components/packages/`** — StatusBadge, PageHeader, PackageCard, PackagesGrid, FilterBar
- **Error, loading, and 404 pages** (`src/app/error.tsx`, `loading.tsx`, `not-found.tsx`)
- **SEO routes** (`robots.ts`, `sitemap.ts`, `opengraph-image.tsx`, `icon.tsx`)

### Phase 2: WAT Infrastructure — `/update-starter`

Completed as planned. The skill, workflow, and all Python tools were built and are fully functional.

| Component | Location | Status |
|---|---|---|
| Skill definition | `.claude/skills/update-starter/SKILL.md` | Implemented |
| Bootstrap tool | `tools/bootstrap_skill.py` | Implemented |
| Update deps tool | `tools/update_deps.py` | Implemented |
| Audit: deps | `tools/audit_deps.py` | Implemented |
| Audit: types | `tools/audit_types.py` | Implemented |
| Audit: security | `tools/audit_security.py` | Implemented |
| Audit: lint | `tools/audit_lint.py` (self-heal via `ultracite fix`) | Implemented |
| Audit: build | `tools/audit_build.py` | Implemented |
| Report generator | `tools/generate_report.py` | Implemented |
| Workflow SOP | `workflows/update-starter.md` | Implemented |

---

## Architecture

```
nextjs-starter/
├── .claude/
│   ├── CLAUDE.md               # Ultracite code standards (not in original plan)
│   └── skills/update-starter/
│       ├── SKILL.md           # Invoked via /update-starter
│       └── evals/evals.json   # Eval definitions
├── workflows/
│   └── update-starter.md      # SOP — read this first, always
├── tools/
│   ├── bootstrap_skill.py    # Registers skill in ~/.claude/skills/
│   ├── update_deps.py         # List or apply selective package updates
│   ├── audit_deps.py          # CVE scan + bun outdated lag check
│   ├── audit_types.py         # tsc --noEmit --strict
│   ├── audit_security.py      # ignoreBuildErrors, hardcoded secrets, CSP headers
│   ├── audit_lint.py           # ultracite check (self-heal on failure)
│   ├── audit_build.py          # bun run build
│   ├── generate_report.py      # Collates and prints results
│   └── .audit_results/          # Created at runtime, gitignored
└── src/                        # The actual starter template
    ├── app/                    # App Router (layout, pages, API routes)
    ├── components/             # UI (packages/, ui/, providers/, footer)
    └── lib/                    # Utils (utils, types, packages, site.config)
```

---

## Design Principles (unchanged)

1. **No hardcoded paths** — paths are derived from `Path(__file__).parent`, `Path.cwd()`, `Path.home()`
2. **Skills + MCPs for live truth** — do not hardcode tool versions, flags, or config schemas
3. **Fail fast and loudly** — any audit failure stops the sequence and reports clearly
4. **Idempotent bootstrap** — running `/update-starter` twice never breaks anything
5. **Self-healing** — when an audit fails due to a fixable issue (e.g., lint), the tool attempts auto-fix before reporting failure
6. **Audit results land in `tools/.audit_results/`** — structured JSON per tool, no stdout parsing
7. **User controls updates** — `update_deps.py --interactive` detects TTY: real terminal shows checklist, Claude Code falls back to `AskUserQuestion`

---

## Tool Reference

All tools share a common interface:
- **Input**: none (operates on current directory)
- **Output**: JSON to stdout, exit code 0 on pass, non-zero on fail
- **Results**: written to `tools/.audit_results/<tool>.json`

| Tool | Purpose | Key Logic |
|------|---------|-----------|
| `bootstrap_skill.py` | Register `/update-starter` in `~/.claude/skills/` | Copy SKILL.md to `~/.claude/skills/update-starter/` |
| `update_deps.py` | List outdated, interactive select, or apply updates | `--list` runs `bun outdated`; `--interactive` TTY or exit 3 (non-TTY); `--update pkg1...` runs `bun add pkg@latest` |
| `audit_deps.py` | CVE vuln + version lag scan | Reads `update_deps.json`, then `npm audit --json` + `bun outdated` |
| `audit_types.py` | Type safety | Parse `bunx tsc --noEmit --strict` output, deduplicate errors, cap at 10 |
| `audit_security.py` | Secure config | Grep for hardcoded secrets, `ignoreBuildErrors`, `.env` in gitignore |
| `audit_lint.py` | Clean code | Run `bun run lint` (ultracite check), detect failures, cap at 20 diagnostics |
| `audit_build.py` | Buildable | Run `bun run build`, capture full output on failure |
| `generate_report.py` | Summary | Read `tools/.audit_results/*.json`, print formatted PASS/FAIL |

---

## Verification Checklist

### Phase 1 ✅
- [x] `bun install` succeeds
- [x] `bun run dev` starts
- [x] `bunx tsc --noEmit` zero errors
- [x] All source files created and functional

### Phase 2 ✅
- [x] Clone to a new directory and `/update-starter` bootstraps skill
- [x] All 5 audits run and pass on clean project
- [x] Self-healing: lint failure triggers `ultracite fix` before reporting
- [x] Non-TTY environment: `AskUserQuestion` used for package selection
- [x] Audit results written to `tools/.audit_results/` in structured JSON

---

## Known Deviations from Original Plan

1. **Home page is a packages dashboard** — not a static "Hello World" page. This was a deliberate addition during Phase 1: the `src/app/page.tsx` server component reads `package.json` and `bun outdated` at build time and renders the interactive packages UI.

2. **`src/lib/site.config.ts`** — added as a centralized place for author/socials metadata, referenced by layout, footer, and opengraph-image.

3. **Lint self-healing** — if `audit_lint.py` finds issues, it runs `ultracite fix` and rechecks before reporting failure.

4. **`components.json` shadcn base** — uses `base-luma` preset (not `base`), which sets up `@base-ui/react` as the primitive library for UI components.