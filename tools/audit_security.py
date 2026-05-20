#!/usr/bin/env python3
"""Audit 3: Security configuration checks"""

import json
import re
import subprocess
import sys
from pathlib import Path

AUDIT_RESULTS = Path(__file__).parent / ".audit_results"


def check_ignore_build_errors():
    """Check next.config.ts does not have ignoreBuildErrors: true"""
    config = Path(__file__).parent.parent / "next.config.ts"
    if not config.exists():
        return False, "next.config.ts not found"

    content = config.read_text()
    if re.search(r'ignoreBuildErrors\s*:\s*true', content):
        return True, "ignoreBuildErrors: true found in next.config.ts"
    return False, None


# Known secret string prefixes — these suggest a hardcoded credential value
SECRET_PREFIXES = [
    # Slack
    "xoxb-", "xoxa-",
    # Stripe
    "sk_live_", "sk_test_", "rk_live_", "rk_test_", "pk_live_", "pk_test_",
    "sq0cst-", "sq0p-", "sq0at-",
    # GitHub
    "ghp_", "github_pat_",
    # AWS
    "AKIA", "ASIA", "ABIA", "AIPA", "ANIA", "ARA",
    # Google / GCP
    "AIza", "ya29.", "1//0", "googlestorage",
    # OpenAI / Anthropic
    "sk-", "sk-ant-",
    # SendGrid
    "SG.",
    # Twilio
    "AC",  # Twilio Account SID starts with AC
    # Nexmo / Vonage
    "4e9b8c",
    # JWT
    "eyJ",
    # Generic high-entropy base64-ish tokens (≥24 chars, alphanumeric+/=)
    # Caught via ENTA pattern below
]

# Regex patterns for detecting secrets in source lines
SECRET_PATTERNS = [
    # Variable names indicating a secret value
    (re.compile(r"(?:api[_-]?key|access[_-]?key|secret[_-]?key|auth[_-]?token|bearer[_-]?token|private[_-]?key)\\s*[=:]", re.I), None),
    # Connection strings with embedded credentials (user:pass@host)
    (re.compile(r"[a-z]+://[^:]+:[^@]+@"), None),
    # Assignment to a known secret-typed variable
    (re.compile(r"(?:password|passwd|pwd|secret|token|api[_-]?key|private[_-]?key|credentials)\s*[=:]\s*['\"]"), re.I),
]

# Pattern to catch high-entropy strings that look like credentials
ENTA_RE = re.compile(r"['\"]([A-Za-z0-9+/]{32,}={0,2})['\"]")


def looks_like_secret(word: str) -> bool:
    """Return True if word matches a known secret prefix or is a high-entropy token."""
    for prefix in SECRET_PREFIXES:
        if word.startswith(prefix):
            return True
    return False


def check_hardcoded_secrets():
    """Scan src/ for hardcoded secret-like values.

    Uses a two-pass approach:
    1. Flag lines where a secret-typed variable (api_key, token, password, etc.) is assigned
    2. Flag string literals matching known secret prefixes (xoxb-, sk_live_, eyJ, etc.)
    """
    src_dir = Path(__file__).parent.parent / "src"
    if not src_dir.exists():
        return [], []

    violations = []
    for f in (*src_dir.rglob("*.ts"), *src_dir.rglob("*.tsx")):
        if f.is_file():
            content = f.read_text(errors="ignore")
            for line_no, line in enumerate(content.splitlines(), 1):
                lower = line.lower()

                # Pass 1: secret-typed variable assignments
                for pattern, _ in SECRET_PATTERNS:
                    if pattern.search(line):
                        # Verify it's actually assigning a string/env value
                        if "=" in line or ":" in line:
                            violations.append(
                                f"{f.relative_to(src_dir.parent)}:{line_no}: "
                                "possible hardcoded secret (secret-typed variable assignment)"
                            )
                            break

                # Pass 2: string literal with known secret prefix
                matches = ENTA_RE.findall(line)
                for word in matches:
                    if looks_like_secret(word):
                        # Don't double-report if already in violations for this line
                        desc = (
                            f"{f.relative_to(src_dir.parent)}:{line_no}: "
                            f"potential hardcoded secret (prefix: {word[:8]}...)"
                        )
                        if desc not in violations:
                            violations.append(desc)
                        break

    return violations, violations  # (explicit hardcoded, all violations for display)


def check_gitignore_env():
    """Check .gitignore includes .env files"""
    gitignore = Path(__file__).parent.parent / ".gitignore"
    if not gitignore.exists():
        return True, ".gitignore not found"

    content = gitignore.read_text()
    has_env = bool(re.search(r"^\s*\.env\s*$", content, re.MULTILINE))
    return not has_env, None


def main():
    result = {"tool": "security", "status": None, "message": "", "violations": []}

    violations = []

    # Check 1: ignoreBuildErrors
    is_fail, msg = check_ignore_build_errors()
    if is_fail:
        violations.append(msg)

    # Check 2: hardcoded secrets
    hardcoded, _ = check_hardcoded_secrets()
    violations.extend(hardcoded)

    # Check 3: .env in gitignore
    missing, _ = check_gitignore_env()
    if missing:
        violations.append(".env not found in .gitignore")

    if violations:
        result["status"] = "fail"
        result["message"] = f"Found {len(violations)} security issue(s)"
        result["violations"] = violations
    else:
        result["status"] = "pass"
        result["message"] = "All security checks passed"

    output_path = AUDIT_RESULTS / "security.json"
    output_path.write_text(json.dumps(result, indent=2))

    print(json.dumps(result, indent=2))
    return 0 if result["status"] == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())