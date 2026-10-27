# RedShield Diagnostic Container: Endpoint & SSRF Telemetry Simulator (Academic Safe Sandbox)
FROM alpine:3.20

LABEL maintainer="RedShield / Cyber-Cerberus Academic Project"
LABEL description="Isolated non-root diagnostic container emitting structured SSRF/Endpoint audit logs for SLM parsing"

# Create non-root sandboxuser
RUN addgroup -S sandboxuser && adduser -S -G sandboxuser -u 10001 sandboxuser

WORKDIR /app

RUN cat << 'EOF' > /app/run_diagnostic.sh
#!/bin/sh
TARGET="${TARGET_URL:-http://juice-shop.local/profile/image/url}"
MODE="${SCAN_PROFILE:-vulnerable}"

printf "\033[36m[*] Starting RedShield Endpoint & SSRF Surface Diagnostic v1.0 (Safe Academic Mode)\033[0m\n"
printf "\033[90m[*] Target Endpoint: %s\033[0m\n" "$TARGET"
printf "\033[32m[+] Policy Gate Verification: PASSED (Authorized Lab Scope)\033[0m\n"
sleep 0.1

if [ "$MODE" = "benign" ]; then
    printf "\033[32m[+] Outbound URL parameter 'imageUrl' strictly validates allowlisted hostnames.\033[0m\n"
    printf "\033[36m[*] Diagnostic complete: 0 vulnerabilities detected.\033[0m\n"
else
    printf "\033[33m[INFO] Auditing URL fetch parameter 'imageUrl' against loopback/metadata policy...\033[0m\n"
    sleep 0.1
    printf "\033[31m[HIGH] Confirmed Server-Side Request Forgery (SSRF) Unvalidated Redirect/Fetch!\033[0m\n"
    printf "    Type: SSRF\n"
    printf "    Parameter: imageUrl (POST)\n"
    printf "    Evidence Marker: [DIAGNOSTIC-SSRF-LOOPBACK-FETCH-200: http://127.0.0.1:3000/ftp]\n"
    printf "    Reference: CWE-918 / CVE-2024-21893 / MITRE ATT&CK T1190\n"
    printf "\033[36m[*] Diagnostic complete: 1 confirmed finding logged for SLM extraction.\033[0m\n"
fi
EOF

RUN chown -R sandboxuser:sandboxuser /app && chmod 555 /app/run_diagnostic.sh

USER sandboxuser

ENTRYPOINT ["/bin/sh", "/app/run_diagnostic.sh"]
