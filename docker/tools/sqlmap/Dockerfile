# RedShield Diagnostic Container: SQLi Telemetry Simulator (Academic Safe Sandbox)
FROM python:3.12-slim

LABEL maintainer="RedShield / Cyber-Cerberus Academic Project"
LABEL description="Isolated non-root diagnostic container emitting structured SQLi audit logs for SLM parsing"

# Create non-root sandbox user and group
RUN groupadd -r sandboxuser && useradd -r -g sandboxuser -u 10001 -s /sbin/nologin sandboxuser

WORKDIR /app

# Create a self-contained diagnostic log emitter script (no offensive binaries installed)
RUN cat << 'EOF' > /app/run_diagnostic.py
import os
import sys
import time

target = os.environ.get("TARGET_URL", "http://juice-shop.local/rest/products/search?q=test")
mode = os.environ.get("SCAN_PROFILE", "vulnerable")

lines = [
    "\x1b[36m[*] Starting RedShield Diagnostic SQLi Telemetry Auditor v1.0 (Safe Academic Mode)\x1b[0m",
    f"\x1b[90m[*] Target Endpoint: {target}\x1b[0m",
    "\x1b[32m[+] Policy Gate Verification: PASSED (Authorized Lab Scope)\x1b[0m",
    "\x1b[33m[*] Inspecting query parameter schema and error handling behavior...\x1b[0m",
]

if mode == "benign" or "secure" in target:
    lines.extend([
        "\x1b[32m[+] Parameter 'q' uses parameterized prepared statements.\x1b[0m",
        "\x1b[32m[INFO] No database error signatures or timing anomalies observed.\x1b[0m",
        "\x1b[36m[*] Diagnostic complete: 0 vulnerabilities detected.\x1b[0m",
    ])
else:
    lines.extend([
        "\x1b[33m[INFO] Testing parameter 'q' for unescaped syntax reflection...\x1b[0m",
        "\x1b[31m[CRITICAL] Parameter 'q' appears vulnerable to Boolean/Error-based SQL Injection\x1b[0m",
        "    Type: error-based SQLi (SQLite/PostgreSQL syntax error leak)",
        "    Title: Unsanitized query parameter concatenation in /rest/products/search",
        "    Parameter: q (GET)",
        "    Evidence Marker: [DIAGNOSTIC-PROBE-SQLI-ERROR-500: near \"'\": syntax error]",
        "    Reference: CWE-89 / CVE-2023-40175 / MITRE ATT&CK T1190 (Exploit Public-Facing Application)",
        "\x1b[36m[*] Diagnostic complete: 1 confirmed finding logged for SLM extraction.\x1b[0m",
    ])

for line in lines:
    print(line, flush=True)
    time.sleep(0.08)
EOF

RUN chown -R sandboxuser:sandboxuser /app && chmod 555 /app/run_diagnostic.py

USER sandboxuser

ENTRYPOINT ["python3", "-u", "/app/run_diagnostic.py"]
