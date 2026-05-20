#!/usr/bin/env python3
"""Audit 4: Lint check via ultracite"""

import json
import re
import subprocess
import sys
from pathlib import Path

AUDIT_RESULTS = Path(__file__).parent / ".audit_results"

ANSI_ESCAPE = re.compile(r"\x1b\[[0-9;]*m")


def strip_ansi(text: str) -> str:
    return ANSI_ESCAPE.sub("", text)


def is_diagnostic_line(line: str) -> bool:
    """Return True if line contains an actual lint error/warning diagnostic.

    Biome outputs file:line:col references for errors and warnings.
    Skip info-only lines like "Checked N files in Xms".
    """
    line = strip_ansi(line)
    return bool(re.search(r":\d+:\d+\s+(ERROR|WARNING|INFO)\s+", line))


def filter_errors(stdout: str, stderr: str) -> list[str]:
    """Extract only meaningful error/warning lines, skip info/banner text."""
    errors = []
    for source in (stdout, stderr):
        for line in source.splitlines():
            line = line.strip()
            if not line:
                continue
            stripped = strip_ansi(line)
            # Skip banner/info lines that don't look like diagnostics
            if is_diagnostic_line(stripped):
                errors.append(stripped)
            # Also catch biome's summary lines that have errors
            elif re.search(r"^(error|warning|Error|Warning)", stripped, re.IGNORECASE):
                errors.append(stripped)
    # Deduplicate while preserving order
    seen = set()
    unique = []
    for e in errors:
        if e not in seen:
            seen.add(e)
            unique.append(e)
    return unique[:20]  # cap at 20 lines


def main():
    result = {"tool": "lint", "status": None, "message": "", "errors": []}

    proc = subprocess.run(
        ["bun", "run", "lint"],
        capture_output=True,
        text=True,
    )

    if proc.returncode == 0:
        result["status"] = "pass"
        result["message"] = "Lint: zero errors"
    else:
        filtered = filter_errors(proc.stdout, proc.stderr)
        if filtered:
            result["status"] = "fail"
            result["message"] = "Lint errors found"
            result["errors"] = filtered
        else:
            # Exit non-zero but no parsed errors — include raw output for debug
            result["status"] = "fail"
            result["message"] = "Lint exited non-zero (see raw output)"
            result["errors"] = [s.strip() for s in proc.stdout.splitlines() if s.strip()][:10]

    output_path = AUDIT_RESULTS / "lint.json"
    output_path.write_text(json.dumps(result, indent=2))

    print(json.dumps(result, indent=2))
    return 0 if result["status"] == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())