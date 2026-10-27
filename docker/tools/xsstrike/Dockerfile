# RedShield Diagnostic Container: XSS Reflection Telemetry Simulator (Academic Safe Sandbox)
FROM python:3.12-slim

LABEL maintainer="RedShield / Cyber-Cerberus Academic Project"
LABEL description="Isolated non-root diagnostic container emitting structured XSS reflection audit logs for SLM parsing"

# Create non-root sandbox user and group
RUN groupadd -r sandboxuser && useradd -r -g sandboxuser -u 10001 -s /sbin/nologin sandboxuser

WORKDIR /app

# Create a self-contained diagnostic log emitter script (no offensive binaries installed)
RUN cat << 'EOF' > /app/run_diagnostic.py
import os
import sys
import time

target = os.environ.get("TARGET_URL", "http://juice-shop.local/#/search?q=test")
mode = os.environ.get("SCAN_PROFILE", "vulnerable")

lines = [
    "\x1b[36m[*] Starting RedShield Diagnostic DOM/Reflected Context Auditor v1.0 (Safe Academic Mode)\x1b[0m",
    f"\x1b[90m[*] Target Endpoint: {target}\x1b[0m",
    "\x1b[32m[+] Policy Gate Verification: PASSED (Authorized Lab Scope)\x1b[0m",
    "\x1b[33m[*] Auditing Content-Security-Policy (CSP) and HTML entity encoding...\x1b[0m",
]

if mode == "benign" or "secure" in target:
    lines.extend([
        "\x1b[32m[+] Strict Content-Security-Policy header present.\x1b[0m",
        "\x1b[32m[+] All canary markers properly HTML-encoded in DOM response.\x1b[0m",
        "\x1b[36m[*] Diagnostic complete: 0 vulnerabilities detected.\x1b[0m",
    ])
else:
    lines.extend([
        "\x1b[33m[INFO] Analyzing reflection context for parameter 'q'...\x1b[0m",
        "\x1b[31m[HIGH] Confirmed Unescaped DOM/Reflected XSS Sink Detected!\x1b[0m",
        "    Type: Cross-Site Scripting (XSS)",
        "    Parameter: q (DOM/Query Sink)",
        "    Confidence: 0.94",
        "    Evidence Marker: [DIAGNOSTIC-CANARY-REFLECTED-UNESCAPED: <cerberus-xss-audit-canary/>]",
        "    Reference: CWE-79 / CVE-2023-29489 / MITRE ATT&CK T1059.007",
        "\x1b[36m[*] Diagnostic complete: 1 confirmed finding logged for SLM extraction.\x1b[0m",
    ])

for line in lines:
    print(line, flush=True)
    time.sleep(0.08)
EOF

RUN chown -R sandboxuser:sandboxuser /app && chmod 555 /app/run_diagnostic.py

USER sandboxuser

ENTRYPOINT ["python3", "-u", "/app/run_diagnostic.py"]
