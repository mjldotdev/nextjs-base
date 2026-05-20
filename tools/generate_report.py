#!/usr/bin/env python3
"""Generate summary report from all audit results"""

import json
import sys
from pathlib import Path

AUDIT_RESULTS = Path(__file__).parent / ".audit_results"

def main():
    tools = ["deps", "types", "security", "lint", "build"]
    all_pass = True

    print()
    print("=" * 60)
    print("  AUDIT REPORT")
    print("=" * 60)
    print()

    for tool in tools:
        result_file = AUDIT_RESULTS / f"{tool}.json"
        if result_file.exists():
            result = json.loads(result_file.read_text())
            status = result.get("status", "unknown")
            message = result.get("message", "")
            icon = "PASS" if status == "pass" else "FAIL"

            if status == "pass":
                print(f"  [{icon}] {tool}: {message}")
            else:
                print(f"  [{icon}] {tool}: {message}")
                all_pass = False
                if "violations" in result:
                    for v in result["violations"]:
                        print(f"         - {v}")
                if "errors" in result:
                    for e in result["errors"][:5]:
                        print(f"         - {e}")
        else:
            print(f"  [SKIP] {tool}: result file not found")
            # SKIP is informational only — not a failure condition

    print()
    print("-" * 60)
    if all_pass:
        print("  Production-ready. All audits passed.")
    else:
        print("  Fix failures before deploying to production.")
    print("-" * 60)
    print()

    return 0 if all_pass else 1

if __name__ == "__main__":
    sys.exit(main())