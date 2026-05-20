#!/usr/bin/env python3
"""Audit 2: TypeScript strict mode check"""

import json
import re
import subprocess
import sys
from pathlib import Path

AUDIT_RESULTS = Path(__file__).parent / ".audit_results"


def extract_errors(stdout: str, stderr: str) -> list[str]:
    """Extract clean error lines from tsc output.

    Handles two formats:
    1. file(line,col): error TS1234: message  (most common)
    2. error TS1234: message  (no file, unlikely but handle it)

    Deduplicates by full message to avoid repeated hits on same error.
    """
    ERROR_RE = re.compile(
        r"([^\s].*?\.(?:tsx?|jsx?|mjsx?|mts?|cts?))"  # file path
        r"(?:\((\d+),(\d+)\))?"  # optional (line,col)
        r":\s*error\s+TS\d+.*",  # error code and rest
        re.IGNORECASE,
    )
    # Fallback: simple TS error code scan
    TS_ERROR_RE = re.compile(r"error\s+TS\d+.*", re.IGNORECASE)

    errors = []
    seen = set()
    for source in (stdout, stderr):
        for raw_line in source.splitlines():
            line = raw_line.strip()
            if not line:
                continue
            # Skip empty or purely decorative lines
            if line.startswith("::") or line.startswith("  "):
                continue
            match = ERROR_RE.search(line)
            if match:
                msg = ERROR_RE.sub(r"\1:\2", line).strip()
                if msg not in seen:
                    seen.add(msg)
                    errors.append(msg)
            elif TS_ERROR_RE.search(line) and not any(
                x in line for x in ("Checked", "Check", "Watching", "Reading")
            ):
                # Strip ansi codes if any
                msg = re.sub(r"\x1b\[[0-9;]*[mK]", "", line).strip()
                if msg not in seen:
                    seen.add(msg)
                    errors.append(msg)

    return errors[:10]  # cap at 10 unique errors


def main():
    result = {"tool": "types", "status": None, "message": "", "errors": []}

    proc = subprocess.run(
        ["bunx", "tsc", "--noEmit", "--strict"],
        capture_output=True,
        text=True,
    )

    if proc.returncode == 0:
        result["status"] = "pass"
        result["message"] = "TypeScript: zero errors"
    else:
        errors = extract_errors(proc.stdout, proc.stderr)
        if errors:
            result["status"] = "fail"
            result["message"] = "TypeScript errors found"
            result["errors"] = errors
        else:
            # Exit non-zero but nothing parsed — include raw output for debugging
            result["status"] = "fail"
            result["message"] = "TypeScript exited non-zero (raw output logged)"
            result["errors"] = [
                re.sub(r"\x1b\[[0-9;]*[mK]", "", l).strip()
                for l in (proc.stdout + proc.stderr).splitlines()
                if l.strip()
            ][:10]

    output_path = AUDIT_RESULTS / "types.json"
    output_path.write_text(json.dumps(result, indent=2))

    print(json.dumps(result, indent=2))
    return 0 if result["status"] == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())