---
name: update-starter
description: Audit a Next.js project to production-ready state and update packages. Run /update-starter whenever you want to: check for outdated packages, audit a project (deps, types, security, lint, build), or bulletproof a project before shipping. Triggers on: "update my dependencies", "audit this project", "/update-starter", "run the starter workflow", "check if this project is production-ready", "bulletproof this project", or any combined request to update packages AND run the full 5-audit suite.
---

# /update-starter

## What this does

Reads `workflows/update-starter.md` first — always the source of truth. Then executes:

1. List outdated packages
2. Select packages to update (TTY checklist OR AskUserQuestion fallback)
3. Update selected packages to true latest from npm
4. Run 5 audit gates in sequence — **stop on first failure**
5. Report pass/fail

Pass all 5 audits = production-ready.

Also self-heals: when an audit fails, fix the root cause automatically before re-running.

## Workflow steps

Always read `workflows/update-starter.md` before executing.

### Step 1 — List outdated

```bash
python tools/update_deps.py --list
```

- Reads `tools/.audit_results/update_deps.json` for `status`
- `status: "pass"` (all up to date) → skip to Step 5
- `status: "list"` (updates found) → go to Step 3

### Step 3 — Select packages

```bash
python tools/update_deps.py --interactive
```

**Handle by exit code:**
- Exit **0**: packages were already updated by the script → skip to Step 5
- Exit **3**: no TTY available → read `tools/.audit_results/update_deps.json`, get `outdated_packages`, then use `AskUserQuestion` (multiSelect: true) to let the user pick packages. Then run `python tools/update_deps.py --update pkg1 pkg2 ...` on their selection.
- Exit **1**: error → report and stop

**AskUserQuestion format when needed:**
- `multiSelect: true`
- `header: "Select packages to update"`
- `question: "Which packages do you want to update?"`
- `options[i].label`: `{name}  {current} → {latest}`
- `options[i].description`: `Latest: {latest}`

If user deselects all or quits → write `status: "skip"` to `update_deps.json` and go to Step 5.

### Steps 5–9 — Audits (stop on first failure)

Run in order. Each audit exits non-zero on failure.

| Step | Command | What it checks |
|---|---|---|
| 5 | `python tools/audit_deps.py` | CVE scan (npm audit) + version lag |
| 6 | `python tools/audit_types.py` | `tsc --noEmit --strict` zero errors |
| 7 | `python tools/audit_security.py` | No ignoreBuildErrors, no hardcoded secrets |
| 8 | `python tools/audit_lint.py` | `bun run lint` zero errors |
| 9 | `python tools/audit_build.py` | `bun run build` succeeds |

### Step 10 — Report

```bash
python tools/generate_report.py
```

Prints pass/fail per audit.

## Self-healing (fix before re-running)

Run a fix attempt **before** re-running any failed audit. Only re-run the audit if the fix succeeded.

### lint fails → auto-fix

```bash
bun run fix
```

Then re-run `python tools/audit_lint.py`. If still failing after `fix`, report the remaining lint errors — they require manual edits.

### types fail → check for stale .next/ types

Stale generated types from an older Next.js version can cause spurious TS errors that go away after a clean build. Clear the generated types directory and retry:

```bash
rm -rf .next/types .next/dev/types && python tools/audit_types.py
```

If errors persist after clearing, they are real TypeScript errors — report them with file:line references from `tools/.audit_results/types.json`.

### build fail → get better diagnostics

```bash
bun run build 2>&1 | head -80
```

Direct build output has more context than the audit's error capture. Use it to identify the root cause (missing dependency, bad import, config error, etc.).

### security fail → explain each violation

Read `tools/.audit_results/security.json` → `violations` array. For each entry explain:
- What the check found
- Which file and line
- What to do to fix it

### deps fail (CVE vulnerabilities) → identify vulnerable packages

Read `tools/.audit_results/deps.json` → `details` tells you which packages are behind. Run targeted updates on just those packages:

```bash
python tools/update_deps.py --update vulnerable-package another-package
```

Then re-run `python tools/audit_deps.py`.

## Audit results

All results go to `tools/.audit_results/*.json`. Never parse stdout for structured data — read these files.

## Tool exit codes

| Tool | Exit 0 | Exit non-zero |
|---|---|---|
| `update_deps.py --list` | always (write result only) | never |
| `update_deps.py --interactive` (TTY) | updated | error |
| `update_deps.py --interactive` (no TTY) | — | exits 3 (use AskUserQuestion) |
| `update_deps.py --update pkg...` | updated | error |
| `audit_deps.py` | no HIGH/CRITICAL vulns | vulns found |
| `audit_types.py` | zero TypeScript errors | errors present |
| `audit_security.py` | all checks pass | violations found |
| `audit_lint.py` | zero lint errors | errors found |
| `audit_build.py` | build succeeded | build failed |

## Audit gates

Only these 5 are gates — all must pass for production-ready:
`deps` · `types` · `security` · `lint` · `build`

The update step (Steps 1–3) is **not** a gate. A project with no available updates still runs all 5 audits and can be production-ready.