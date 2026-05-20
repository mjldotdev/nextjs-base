# update-starter

## Objective

Update selected packages and audit a Next.js project to production-ready state. Run audits in sequence — stop on first failure. Self-healing: fix what can be fixed automatically.

## Inputs

None — operates on the current repo.

## Prerequisites

**Bootstrap skill** — Run `python tools/bootstrap_skill.py` if `~/.claude/skills/update-starter/SKILL.md` does not exist yet. This registers the skill so `/update-starter` works in future sessions.

## Steps

### 1. Select packages (interactive)

Run `python tools/update_deps.py --interactive`.

Exit handling:

- **Exit code 3**: Outdated packages found but no TTY available. `update_deps.json` written with `status: "interactive-required"` and `outdated_packages` populated. Use `AskUserQuestion` for selection:
  - Options (ordered):
    - `Update All (recommended)` — description: `Updates all {n} outdated packages`
    - Individual packages: `{name}  {current} → {latest}` — description: `Latest: {latest}`
  - Multi-select: `true`
  - If "Update All" is among selected answers: run `python tools/update_deps.py --update` with ALL `outdated_packages` names
  - If user selects individual packages only: run `python tools/update_deps.py --update {selected_pkg1} {selected_pkg2} ...`
  - If user selects nothing or quits: run `python tools/update_deps.py --skip` — proceed to Step 2
- **Exit code 0**: No outdated packages. `update_deps.json` written with `status: "pass"` and empty `outdated_packages`. Proceed directly to Step 2.

**Terminal (TTY available):**
- Runs `bun outdated`, displays a terminal checklist with `[x]`/`[ ]` checkboxes
- Arrow keys (↑↓) navigate, Space toggles selection, `a` selects all, Enter confirms
- `q` quits without updating
- Updates selected packages immediately, then proceeds to Step 2

### 2. Audit deps

Run `python tools/audit_deps.py`.

- Reads `update_deps.json` for context in the report
- Runs `bun outdated` to detect version lag — packages with newer versions
- Runs `npm audit --audit-level=moderate --json` for CVE scan
- Pass: zero HIGH/CRITICAL vulnerabilities
- Fail: report each violation with type/count

### 3. Audit types

Run `python tools/audit_types.py`.

- Uses `bunx tsc --noEmit --strict`
- Pass: zero TypeScript errors
- Fail: report errors with file:line references

### 4. Audit security

Run `python tools/audit_security.py`.

- Checks: `ignoreBuildErrors` not true in next.config, no hardcoded secrets in src/, .env in gitignore
- Pass: all checks green
- Fail: report each violation

### 5. Audit lint

Run `python tools/audit_lint.py`.

- Runs `bun run lint` (maps to ultracite check)
- Pass: zero lint/format errors
- Fail: report errors

### 6. Audit build

Run `python tools/audit_build.py`.

- Runs `bun run build`
- Pass: build completes with exit code 0
- Fail: report build errors

### 7. Report

Run `python tools/generate_report.py`.

- Reads `tools/.audit_results/*.json` for each audit tool
- Prints `[PASS]` or `[FAIL]` per audit with message
- Lists violations/errors (first 5) for any failures
- If all audits pass: "Production-ready. All audits passed."
- If any audit fails: "Fix failures before deploying to production."

## Outputs

Structured report to stdout. Tool exit codes: 0 = pass, non-zero = fail.

## Edge Cases

- If any audit (deps/types/security/lint/build) exits non-zero, stop the sequence and report current status
- If `bun` is not installed, fail fast with clear message
- If `bun outdated` returns no packages, Step 1 is skipped — proceed directly to Step 2
- If user unchecks all packages in Step 1, write skip status and proceed to Step 2
- If git repo has uncommitted changes, warn but proceed

## Design Principles

1. **User controls updates** — `--interactive` shows checklist, user selects, tool updates only selection
2. **Decoupled update from audit** — `audit_deps.py` does NOT call `update_deps.py`; update is a separate controlled step
3. **`update_deps` is not an audit gate** — it is interactive and optional; only deps/types/security/lint/build are audit gates
4. **True latest update** — `update_deps.py --update` resolves actual latest from npm registry, uses `bun add pkg@^version` — works even when package.json has exact pinned versions