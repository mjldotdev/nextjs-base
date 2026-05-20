#!/usr/bin/env python3
"""Audit: Dependency vulnerability scan (npm audit) + version lag check (bun outdated).

This audit reads update_deps.json for context (what was updated).
It does NOT call update_deps.py — update and audit are separate steps.
"""

import json
import subprocess
import sys
from pathlib import Path

AUDIT_RESULTS = Path(__file__).parent / ".audit_results"
PACKAGE_JSON = Path(__file__).parent.parent / "package.json"
UPDATE_DEPS_RESULT = Path(__file__).parent / ".audit_results" / "update_deps.json"


def parse_bun_outdated(stdout: str) -> list[str]:
    """Parse bun outdated table, return list of package names with newer versions available."""
    packages = []
    for line in stdout.strip().split("\n"):
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 5:
            continue
        name = parts[1]
        update_ver = parts[3]
        if name in ("Package", "") or update_ver.startswith("-"):
            continue
        packages.append(name)
    return packages


def run_bun_outdated() -> list[str]:
    """Run bun outdated, return list of packages with updates available."""
    proc = subprocess.run(
        ["bun", "outdated"],
        capture_output=True,
        text=True,
    )
    if proc.returncode not in (0, 1):
        return []
    return parse_bun_outdated(proc.stdout)


def read_update_context() -> dict:
    """Read update_deps.json if it exists, for context in the report."""
    if UPDATE_DEPS_RESULT.exists():
        return json.loads(UPDATE_DEPS_RESULT.read_text())
    return {}


def main():
    result = {
        "tool": "deps",
        "status": None,
        "message": "",
        "details": [],
    }

    # Attach update context if available
    update_ctx = read_update_context()
    if update_ctx.get("updated_packages"):
        result["details"].append(f"Updated: {', '.join(update_ctx['updated_packages'])}")
    elif update_ctx.get("mode") == "skip":
        result["details"].append("No packages were selected for update")
    elif update_ctx.get("mode") == "list" and not update_ctx.get("outdated_packages"):
        result["details"].append("All packages already up to date")

    # Check version lag — packages with newer versions available
    outdated = run_bun_outdated()
    if outdated:
        result["details"].append(f"Version lag: {', '.join(outdated)} has newer versions")

    # CVE scan — npm audit
    proc = subprocess.run(
        ["npm", "audit", "--audit-level=moderate", "--json"],
        capture_output=True,
        text=True,
    )

    try:
        data = json.loads(proc.stdout)
    except json.JSONDecodeError:
        result["status"] = "fail"
        result["message"] = "Failed to parse npm audit output"
        output(result)
        return 1

    vulnerabilities = data.get("metadata", {}).get("vulnerabilities", {})
    high_critical = sum(
        (v.get("high", 0) + v.get("critical", 0)) if isinstance(v, dict) else 0
        for k, v in vulnerabilities.items()
    )

    if high_critical > 0:
        result["status"] = "fail"
        result["message"] = f"Found {high_critical} HIGH/CRITICAL vulnerabilities"
        for vuln_type, data_v in vulnerabilities.items():
            if not isinstance(data_v, dict):
                continue
            for severity in ["high", "critical"]:
                count = data_v.get(severity, 0)
                if count > 0:
                    result["details"].append(f"  {severity}: {count} {vuln_type}")
    else:
        result["status"] = "pass"
        result["message"] = "No HIGH/CRITICAL vulnerabilities found"

    output(result)
    return 0 if result["status"] == "pass" else 1


def output(result: dict):
    AUDIT_RESULTS.mkdir(parents=True, exist_ok=True)
    output_path = AUDIT_RESULTS / "deps.json"
    output_path.write_text(json.dumps(result, indent=2))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    sys.exit(main())