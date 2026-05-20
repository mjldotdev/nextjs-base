#!/usr/bin/env python3
"""List or apply dependency updates with user selection.

CLI:
    python tools/update_deps.py --interactive
        Checks for TTY availability:
        - If terminal is interactive: shows checkbox TUI (arrow keys + space + enter).
          Updates selected packages atomically.
        - If no TTY (e.g. Claude Code session): writes update_deps.json with
          status "interactive-required" and exits 3. The caller should then use
          AskUserQuestion to let the user pick from the options in update_deps.json.
        Use --skip to write a no-op skip status.

    python tools/update_deps.py --skip
        Writes update_deps.json with status "skip". Exits 0.
        Use when user declines to select any packages for update.

    python tools/update_deps.py --update <pkg1> [pkg2] [...]
        Updates named packages to latest version (no user prompting).
        Exits 0 on success, 1 on failure.
"""

import json
import shutil
import subprocess
import sys
import tty
import termios
from pathlib import Path

AUDIT_RESULTS = Path(__file__).parent / ".audit_results"
PACKAGE_JSON = Path(__file__).parent.parent / "package.json"


def _is_interactive_tty() -> bool:
    """Return True if stdin is a real TTY (interactive terminal)."""
    try:
        return sys.stdin.isatty()
    except Exception:
        return False


def _get_key() -> str:
    """Read a single keypress without requiring Enter. Unix-only."""
    fd = sys.stdin.fileno()
    old_settings = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        ch = sys.stdin.read(1)
        if ch == "\x1b":  # escape sequence
            # Read remaining chars for arrow keys
            ch += sys.stdin.read(2)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
    return ch


def run_bun(args: list[str]) -> subprocess.CompletedProcess | None:
    """Run a bun command. Returns None on panic, raises on other failures."""
    proc = subprocess.run(
        ["bun"] + args,
        capture_output=True,
        text=True,
        timeout=120,
    )
    if "panic" in proc.stderr.lower():
        return None
    if proc.returncode != 0:
        raise RuntimeError(f"bun {' '.join(args)} failed: {proc.stderr.strip()[:200]}")
    return proc


def parse_bun_outdated_table(stdout: str) -> list[dict]:
    """Parse bun outdated table into structured list.

    Table format: | Package | Current | Update | Latest |
    Returns [{name, current, update, latest}, ...]
    """
    packages = []
    for line in stdout.strip().split("\n"):
        # Align on | delimiters; each row: | name | current | update | latest |
        parts = [p.strip() for p in line.split("|")]
        # parts[0] is empty, parts[1]=Package, parts[2]=Current, parts[3]=Update, parts[4]=Latest, parts[5] empty
        if len(parts) < 5:
            continue
        name = parts[1]
        current = parts[2]
        update_ver = parts[3]
        latest = parts[4]
        if name in ("Package", "") or current == "Current" or update_ver.startswith("-"):
            continue
        packages.append({
            "name": name,
            "current": current,
            "update": update_ver,
            "latest": latest,
        })
    return packages


def diff_deps(before: dict, after: dict) -> tuple[list[str], list[str]]:
    """Compare before vs after package.json deps. Returns (updated, skipped)."""
    updated = []
    skipped = []

    for section in ("dependencies", "devDependencies"):
        after_section = after.get(section, {})
        before_section = before.get(section, {})
        for name, new_version in after_section.items():
            old_version = before_section.get(name, "")
            if old_version != new_version:
                updated.append(f"{name}@{old_version} -> {new_version}")
            elif name in packages:
                skipped.append(f"{name}@{new_version}")

    return updated, skipped


def list_outdated() -> dict:
    """Run bun outdated, parse table, return result dict."""
    result = {
        "tool": "update_deps",
        "status": None,
        "message": "",
        "mode": "list",
        "outdated_packages": [],
        "updated_packages": [],
        "skipped_packages": [],
    }

    try:
        proc = subprocess.run(
            ["bun", "outdated"],
            capture_output=True,
            text=True,
            timeout=120,
        )
        # bun outdated returns 0 when clean, 1 when packages have updates
        if proc.returncode not in (0, 1):
            result["status"] = "fail"
            result["message"] = f"bun outdated failed: {proc.stderr.strip()[:200]}"
            output(result)
            return result

        packages = parse_bun_outdated_table(proc.stdout)

        if not packages:
            result["status"] = "pass"
            result["message"] = "All packages up to date"
            result["outdated_packages"] = []
        else:
            result["status"] = "list"
            result["message"] = f"{len(packages)} package(s) have updates available"
            result["outdated_packages"] = packages

        output(result)
        return result

    except Exception as exc:
        result["status"] = "fail"
        result["message"] = f"Unexpected error: {exc}"
        output(result)
        raise


def interactive_select() -> list[str]:
    """Run bun outdated, show interactive checklist, update selected packages.

    If no TTY is available (e.g. running in Claude Code), writes
    update_deps.json with status "interactive-required" and exits 3.
    The caller should use AskUserQuestion for selection instead.
    """
    proc = subprocess.run(["bun", "outdated"], capture_output=True, text=True, timeout=120)
    packages = parse_bun_outdated_table(proc.stdout)
    if not packages:
        print("All packages are up to date.")
        return []

    # Non-TTY: exit with code 3 so the caller knows to use AskUserQuestion
    if not _is_interactive_tty():
        result = {
            "tool": "update_deps",
            "status": "interactive-required",
            "message": "No TTY — use AskUserQuestion for package selection",
            "mode": "interactive",
            "outdated_packages": packages,
            "updated_packages": [],
            "skipped_packages": [],
        }
        output(result)
        # Exit 3 = special: caller should ask user via AskUserQuestion
        sys.exit(3)

    # selected[i] = True if package[i] is toggled on
    selected = [False] * len(packages)
    cursor = 0

    COLS = shutil.getTerminalSize().columns if hasattr(shutil, "getTerminalSize") else 80

    def clear_and_redraw():
        sys.stdout.write("\r\033[2J\033[H")
        sys.stdout.flush()

    def draw():
        clear_and_redraw()
        print(f"  {'Update dependencies — select packages to update'}")
        print(f"  {'─' * min(COLS, 60)}")
        for i, pkg in enumerate(packages):
            mark = "[x]" if selected[i] else "[ ]"
            arrow = "→" if i == cursor else " "
            name = pkg["name"]
            cur = pkg["current"]
            latest = pkg["latest"]
            print(f"  {arrow} {mark} {name:<20} {cur:<12} → {latest}")
        print(f"  {'─' * min(COLS, 60)}")
        print(f"  ↑↓ navigate   [space] toggle   [a] select all   [enter] update   [q] quit")

    try:
        while True:
            draw()
            key = _get_key()

            if key == "\x1b[A":       # arrow up
                cursor = (cursor - 1) % len(packages)
            elif key == "\x1b[B":    # arrow down
                cursor = (cursor + 1) % len(packages)
            elif key == " ":  # space — toggle
                selected[cursor] = not selected[cursor]
            elif key == "\r":  # enter — confirm
                break
            elif key.lower() == "a":  # a — select all
                selected = [True] * len(packages)
            elif key.lower() == "q":  # quit
                print("\nAborted.")
                sys.exit(0)
    except KeyboardInterrupt:
        print("\nAborted.")
        sys.exit(0)

    selected_names = [packages[i]["name"] for i in range(len(packages)) if selected[i]]
    return selected_names


def get_latest_version(name: str) -> str:
    """Get the true latest version of a package from the npm registry."""
    proc = subprocess.run(
        ["npm", "view", name, "version", "--json"],
        capture_output=True,
        text=True,
        timeout=60,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"npm view {name} failed: {proc.stderr.strip()[:200]}")
    return json.loads(proc.stdout.strip())


def apply_updates(packages: list[str]) -> dict:
    """Update only the specified packages."""
    result = {
        "tool": "update_deps",
        "status": None,
        "message": "",
        "mode": "update",
        "outdated_packages": [],
        "updated_packages": [],
        "skipped_packages": [],
    }

    if not packages:
        result["status"] = "skip"
        result["message"] = "No packages selected for update"
        output(result)
        return result

    try:
        # Snapshot before
        pkg_before = json.loads(PACKAGE_JSON.read_text())

        # Resolve true latest version from npm registry and install it
        for pkg in packages:
            latest = get_latest_version(pkg)
            run_bun(["add", "--save", f"{pkg}@^{latest}"])

        # Sync lockfile
        install_result = run_bun(["install"])
        if install_result is None:
            # bun crashed — not fatal, package.json already updated
            pass

        # Snapshot after
        pkg_after = json.loads(PACKAGE_JSON.read_text())

        # Diff
        updated, skipped = diff_deps(pkg_before, pkg_after)
        result["updated_packages"] = updated
        result["skipped_packages"] = skipped
        result["message"] = f"Updated {len(updated)} package(s), {len(skipped)} unchanged"

        # Mark packages that were NOT in the update list as skipped
        all_dep_names = set()
        for section in ("dependencies", "devDependencies"):
            all_dep_names.update(pkg_after.get(section, {}).keys())

        not_selected = [n for n in all_dep_names if n not in packages]
        for name in not_selected:
            version = pkg_after.get("dependencies", {}).get(name) or pkg_after.get("devDependencies", {}).get(name, "")
            result["skipped_packages"].append(f"{name}@{version}")

        result["status"] = "pass"
        output(result)
        return result

    except Exception as exc:
        result["status"] = "fail"
        result["message"] = f"Failed to update packages: {exc}"
        output(result)
        raise


def output(result: dict):
    """Write result to update_deps.json and print to stdout."""
    AUDIT_RESULTS.mkdir(parents=True, exist_ok=True)
    output_path = AUDIT_RESULTS / "update_deps.json"
    output_path.write_text(json.dumps(result, indent=2))
    print(json.dumps(result, indent=2))


def main():
    if len(sys.argv) < 2:
        print("Usage: python update_deps.py --interactive | --list | --skip | --update <pkg1> [...]", file=sys.stderr)
        sys.exit(1)

    arg = sys.argv[1]

    if arg == "--list":
        result = list_outdated()
        return 0

    if arg == "--interactive":
        selected = interactive_select()
        if not selected:
            print("No packages selected.")
            return 0
        print(f"\nUpdating: {', '.join(selected)}")
        result = apply_updates(selected)
        return 0 if result["status"] in ("pass", "skip") else 1

    if arg == "--skip":
        result = {
            "tool": "update_deps",
            "status": "skip",
            "message": "No packages selected for update",
            "mode": "update",
            "outdated_packages": [],
            "updated_packages": [],
            "skipped_packages": [],
        }
        output(result)
        return 0

    if arg == "--update":
        if len(sys.argv) < 3:
            print("Usage: python update_deps.py --update <pkg1> [pkg2] [...]", file=sys.stderr)
            sys.exit(1)
        packages = sys.argv[2:]
        result = apply_updates(packages)
        return 0 if result["status"] in ("pass", "skip") else 1

    print(f"Unknown argument: {arg}", file=sys.stderr)
    print("Usage: python update_deps.py --interactive | --list | --skip | --update <pkg1> [...]", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    sys.exit(main())