#!/usr/bin/env python3
"""Audit 5: Build check"""

import json
import subprocess
import sys
from pathlib import Path

AUDIT_RESULTS = Path(__file__).parent / ".audit_results"

def main():
    result = {"tool": "build", "status": None, "message": "", "errors": []}

    proc = subprocess.run(
        ["bun", "run", "build"],
        capture_output=True,
        text=True,
    )

    if proc.returncode == 0:
        result["status"] = "pass"
        result["message"] = "Build completed successfully"
    else:
        result["status"] = "fail"
        result["message"] = "Build failed"
        for line in proc.stdout.splitlines():
            line = line.strip()
            if line:
                result["errors"].append(line)
        for line in proc.stderr.splitlines():
            line = line.strip()
            if line:
                result["errors"].append(line)

    output_path = AUDIT_RESULTS / "build.json"
    output_path.write_text(json.dumps(result, indent=2))

    print(json.dumps(result, indent=2))
    return 0 if result["status"] == "pass" else 1

if __name__ == "__main__":
    sys.exit(main())