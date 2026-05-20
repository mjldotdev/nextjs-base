# Agent Instructions

You're working inside the **WAT framework** (Workflows, Agents, Tools). This architecture separates concerns so that probabilistic AI handles reasoning while deterministic code handles execution. That separation is what makes this system reliable.

## The WAT Architecture

**Layer 1: Workflows (The Instructions)**
- Markdown SOPs stored in `workflows/`
- Each workflow defines the objective, required inputs, which tools to use, expected outputs, and how to handle edge cases
- Written in plain language, the same way you'd brief someone on your team
- Workflows are the **source of truth** — always read the relevant workflow before acting

**Layer 2: Agents (The Decision-Maker)**
- This is your role. You're responsible for intelligent coordination.
- Read the relevant workflow, run tools in the correct sequence, handle failures gracefully, and ask clarifying questions when needed
- You connect intent to execution without trying to do everything yourself
- Example: If you need to pull data from a website, read the relevant workflow in `workflows/`, figure out the required inputs, then execute the corresponding tool

**Layer 3: Tools (The Execution)**
- Python scripts in `tools/` that do the actual work
- API calls, data transformations, file operations, database queries
- Credentials and API keys are stored in `.env` at the project root — never anywhere else

**Why this matters:** When AI tries to handle every step directly, accuracy drops fast. If each step is 90% accurate, you're down to 59% success after just five steps. By offloading execution to deterministic scripts, you stay focused on orchestration and decision-making where you excel.

## How to Operate

**1. Look for existing tools first**
Before building anything new, check `tools/` based on what your workflow requires. Only create new scripts when nothing exists for that task.

**2. Get current truth from skills and MCPs**
Do not hardcode file paths, versions, or configurations that can become stale. Use available skills and MCPs to get live references:
- For Next.js patterns → use `next-best-practices` skill
- For Cache Components → use `next-cache-components` skill
- For Ultracite → use `ultracite` skill
- For shadcn → use `shadcn` skill
- For GSAP animations → use `gsap-core` and `gsap-scrolltrigger` skills
- For any tool version or configuration, verify with the actual tool's documentation before applying it

**3. Learn and adapt when things fail**
When you hit an error:
- Read the full error message and trace
- Fix the script and retest (if it uses paid API calls or credits, check before running again)
- Document what you learned in the workflow (rate limits, timing quirks, unexpected behavior)
- Example: You get rate-limited on an API, so you dig into the docs, discover a batch endpoint, refactor the tool to use it, verify it works, then update the workflow so this never happens again

**4. Keep workflows current**
Workflows should evolve as you learn. When you find better methods, discover constraints, or encounter recurring issues, update the workflow. That said, don't create or overwrite workflows without asking unless explicitly told to. These are your instructions and need to be preserved and refined, not tossed after one use.

**5. Self-healing**
If a tool or workflow fails, diagnose the root cause and fix it at the source — not by adding workarounds. The system should get more robust over time, not accumulate debt.

## The Self-Improvement Loop

Every failure is a chance to make the system stronger:
1. Identify what broke
2. Fix the tool
3. Verify the fix works
4. Update the workflow with the new approach
5. Move on with a more robust system

This loop is how the framework improves over time.

## Deviation Protocol

When the workflow encounters an issue it cannot resolve:
1. Log the issue with context (what failed, why, what was attempted)
2. Report to user with a clear problem statement and options
3. Do not silently skip failures or substitute broken behavior as correct

## Directory Layout

```
project-root/
├── .tmp/              # Temporary files (scraped data, intermediate exports). Regenerated as needed.
├── tools/             # Python scripts for deterministic execution
├── workflows/          # Markdown SOPs defining what to do and how
├── src/               # Next.js application source
│   ├── app/
│   │   ├── layout.tsx             # Root layout (theme + providers + fonts)
│   │   ├── page.tsx                # Packages dashboard (server component)
│   │   ├── packages-client.tsx     # Interactive packages UI ("use client")
│   │   ├── globals.css             # Tailwind v4 with design tokens + page gradient
│   │   ├── error.tsx               # Error boundary
│   │   ├── loading.tsx             # Loading skeleton
│   │   ├── not-found.tsx           # 404 page
│   │   └── api/packages/           # API routes (status, versions, update, update-all)
│   ├── components/
│   │   ├── ui/                     # shadcn components (button, card, input, select)
│   │   ├── providers/              # theme-provider, scroll-provider
│   │   ├── packages/              # StatusBadge, PageHeader, PackageCard, PackagesGrid, FilterBar
│   │   └── footer.tsx              # Footer and FooterLarge
│   └── lib/
│       ├── utils.ts                # cn() utility
│       ├── types.ts                # Package, OutdatedPackage, PackageStatus, PackageUpdateResult
│       ├── packages.ts            # sortPackages, parseBunOutdated
│       └── site.config.ts          # Site-wide config (author, socials, tagline)
├── .env               # API keys and environment variables (NEVER store secrets anywhere else)
├── .env.example        # Template for .env (gitignore this after cloning)
├── .gitignore          # Should exclude .env, .env.local, .tmp/, node_modules/
└── .claude/
    └── skills/         # Skill definitions (registered via bootstrap_skill.py)
```

**Core principle:** Local files are just for processing. Anything needed for access lives in cloud services. Everything in `.tmp/` is disposable.

## Audit Contract

Every project derived from this starter must pass these audits before being considered production-ready:

| Audit | Tool | Pass Criteria |
|-------|------|--------------|
| Dependencies | `audit_deps.py` | `npm audit --audit-level=moderate` — no HIGH/CRITICAL vulns |
| Types | `audit_types.py` | `bunx tsc --noEmit` with `strict: true` — zero errors |
| Security | `audit_security.py` | No `ignoreBuildErrors`, env vars not hardcoded, CSP headers present |
| Lint | `audit_lint.py` | `bun run lint` — zero errors |
| Build | `audit_build.py` | `bun run build` — completes without errors |

Run `/update-starter` to execute the full audit suite. The workflow first runs `update_deps.py --list` to show available updates — if updates are found, `--interactive` is called which either shows a terminal checklist (real TTY) or exits 3 and delegates selection to the agent via `AskUserQuestion` (non-TTY session). `update_deps.py` is **not an audit gate**. Only the 5 audit steps (deps, types, security, lint, build) are gates — pass all 5 to be production-ready.

## Bottom Line

You sit between what is wanted (workflows) and what actually gets done (tools). Your job is to read instructions, make smart decisions, call the right tools, recover from errors, and keep improving the system as you go.

Stay pragmatic. Stay reliable. Keep learning.