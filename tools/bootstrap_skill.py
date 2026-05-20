#!/usr/bin/env python3
"""Register /update-starter skill in ~/.claude/skills/"""

import json
import shutil
import subprocess
import sys
from pathlib import Path

SRC_SKILL = Path(__file__).parent.parent / ".claude" / "skills" / "update-starter" / "SKILL.md"
DST_SKILL = Path.home() / ".claude" / "skills" / "update-starter" / "SKILL.md"
AUDIT_RESULTS = Path(__file__).parent / ".audit_results"

def main():
    result = {"tool": "bootstrap_skill", "status": None, "message": ""}

    if not SRC_SKILL.exists():
        result["status"] = "fail"
        result["message"] = f"Source skill not found: {SRC_SKILL}"
        print(json.dumps(result))
        return 1

    if not DST_SKILL.exists():
        DST_SKILL.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(SRC_SKILL, DST_SKILL)
        src_evals = SRC_SKILL.parent / "evals"
        dst_evals = DST_SKILL.parent / "evals"
        if src_evals.is_dir():
            shutil.copytree(src_evals, dst_evals)
        result["status"] = "pass"
        result["message"] = "Skill registered."
    else:
        result["status"] = "pass"
        result["message"] = "Skill already registered."

    # Always ensure .audit_results dir exists
    AUDIT_RESULTS.mkdir(parents=True, exist_ok=True)

    print(json.dumps(result, indent=2))
    return 0

if __name__ == "__main__":
    sys.exit(main())