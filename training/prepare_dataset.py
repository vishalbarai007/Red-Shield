"""
Task 3.4: Dataset Preparation for Local SLM LoRA/QLoRA Fine-Tuning (`prepare_dataset.py`)
Generates 300 curated security diagnostic tool logs (150 positive findings across SQLi, XSS, SSRF
and 150 benign/error/timeout logs) paired with strict ground-truth CVE/CWE and MITRE ATT&CK JSON outputs.
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, List

DATASET_DIR = Path(__file__).resolve().parent / "datasets"
OUTPUT_FILE = DATASET_DIR / "security_logs_sft.jsonl"

SYSTEM_PROMPT = """[SYSTEM]
You are a deterministic security log parsing engine. Your job is to extract confirmed vulnerability findings from the raw tool execution logs provided.
CRITICAL CONSTRAINTS:
1. Do NOT assume, infer, or hallucinate vulnerabilities not explicitly verified in the log.
2. If the tool failed, encountered an error, or found no vulnerability, output "vulnerability_detected": false.
3. Output MUST be valid JSON adhering exactly to the schema below.

JSON SCHEMA:
{
  "vulnerability_detected": boolean,
  "vulnerability_type": "SQLi" | "XSS" | "SSRF" | "None",
  "cve_id": string or null,
  "cwe_id": string or null,
  "mitre_technique_id": string or null,
  "confidence_score": float (0.0 to 1.0),
  "evidence_payload": string or null,
  "vulnerable_parameter": string or null,
  "summary": string
}"""


def build_example(raw_log: str, label: Dict[str, Any]) -> Dict[str, Any]:
    prompt = f"{SYSTEM_PROMPT}\n\n[RAW TOOL LOG]\n{raw_log}\n[/RAW TOOL LOG]"
    completion = json.dumps(label, ensure_ascii=False)
    return {
        "prompt": prompt,
        "completion": completion,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"[RAW TOOL LOG]\n{raw_log}\n[/RAW TOOL LOG]"},
            {"role": "assistant", "content": completion},
        ],
    }


def generate_dataset(num_samples: int = 300) -> List[Dict[str, Any]]:
    samples: List[Dict[str, Any]] = []
    params = ["q", "id", "user_id", "search", "category", "redirect_uri", "imageUrl", "webhook"]

    for i in range(num_samples):
        param = params[i % len(params)]
        case_type = i % 6

        if case_type == 0:  # Positive SQLi
            cve = f"CVE-2023-{40100 + (i % 90)}"
            raw_log = (
                f"[*] Starting RedShield Diagnostic SQLi Telemetry Auditor v1.0\n"
                f"[*] Target Endpoint: http://juice-shop.local/api/items?{param}=10\n"
                f"[CRITICAL] Parameter '{param}' appears vulnerable to Boolean/Error-based SQL Injection\n"
                f"    Type: error-based SQLi\n"
                f"    Parameter: {param} (GET)\n"
                f"    Evidence Marker: [DIAGNOSTIC-PROBE-SQLI-ERROR-500: syntax error near '{param}']\n"
                f"    Reference: CWE-89 / {cve} / MITRE ATT&CK T1190"
            )
            label = {
                "vulnerability_detected": True,
                "vulnerability_type": "SQLi",
                "severity": "Critical",
                "cve_id": cve,
                "cwe_id": "CWE-89",
                "mitre_technique_id": "T1190",
                "confidence_score": 0.96,
                "evidence_payload": f"[DIAGNOSTIC-PROBE-SQLI-ERROR-500: syntax error near '{param}']",
                "vulnerable_parameter": param,
                "summary": f"Confirmed SQL Injection (SQLi) on parameter '{param}' mapped to CWE-89 and MITRE ATT&CK T1190.",
            }
        elif case_type == 1:  # Positive XSS
            cve = f"CVE-2023-{29400 + (i % 90)}"
            raw_log = (
                f"[*] Starting RedShield Diagnostic DOM/Reflected Context Auditor v1.0\n"
                f"[*] Target Endpoint: http://juice-shop.local/#/search?{param}=test\n"
                f"[HIGH] Confirmed Unescaped DOM/Reflected XSS Sink Detected!\n"
                f"    Type: Cross-Site Scripting (XSS)\n"
                f"    Parameter: {param} (DOM/Query Sink)\n"
                f"    Evidence Marker: [DIAGNOSTIC-CANARY-REFLECTED-UNESCAPED: <cerberus-xss-audit-canary/>]\n"
                f"    Reference: CWE-79 / {cve} / MITRE ATT&CK T1059.007"
            )
            label = {
                "vulnerability_detected": True,
                "vulnerability_type": "XSS",
                "severity": "High",
                "cve_id": cve,
                "cwe_id": "CWE-79",
                "mitre_technique_id": "T1059.007",
                "confidence_score": 0.94,
                "evidence_payload": "[DIAGNOSTIC-CANARY-REFLECTED-UNESCAPED: <cerberus-xss-audit-canary/>]",
                "vulnerable_parameter": param,
                "summary": f"Confirmed Cross-Site Scripting (XSS) reflection sink on parameter '{param}' mapped to CWE-79 and MITRE ATT&CK T1059.007.",
            }
        elif case_type == 2:  # Positive SSRF
            cve = f"CVE-2024-{21800 + (i % 90)}"
            raw_log = (
                f"[*] Starting RedShield Endpoint & SSRF Surface Diagnostic v1.0\n"
                f"[*] Target Endpoint: http://juice-shop.local/profile/image/url\n"
                f"[HIGH] Confirmed Server-Side Request Forgery (SSRF) Unvalidated Redirect/Fetch!\n"
                f"    Type: SSRF\n"
                f"    Parameter: {param} (POST)\n"
                f"    Evidence Marker: [DIAGNOSTIC-SSRF-LOOPBACK-FETCH-200: http://127.0.0.1:3000/ftp]\n"
                f"    Reference: CWE-918 / {cve} / MITRE ATT&CK T1190"
            )
            label = {
                "vulnerability_detected": True,
                "vulnerability_type": "SSRF",
                "severity": "High",
                "cve_id": cve,
                "cwe_id": "CWE-918",
                "mitre_technique_id": "T1190",
                "confidence_score": 0.92,
                "evidence_payload": "[DIAGNOSTIC-SSRF-LOOPBACK-FETCH-200: http://127.0.0.1:3000/ftp]",
                "vulnerable_parameter": param,
                "summary": f"Confirmed Server-Side Request Forgery (SSRF) on parameter '{param}' mapped to CWE-918 and MITRE ATT&CK T1190.",
            }
        elif case_type == 3:  # Benign SQLi scan
            raw_log = (
                f"[*] Starting RedShield Diagnostic SQLi Telemetry Auditor v1.0\n"
                f"[*] Target Endpoint: http://dvwa.local/secure/items?{param}=10\n"
                f"[+] Parameter '{param}' uses parameterized prepared statements.\n"
                f"[INFO] all tested parameters do not appear to be injectable.\n"
                f"[*] Diagnostic complete: 0 vulnerabilities detected."
            )
            label = {
                "vulnerability_detected": False,
                "vulnerability_type": "None",
                "severity": "Benign",
                "cve_id": None,
                "cwe_id": None,
                "mitre_technique_id": None,
                "confidence_score": 0.0,
                "evidence_payload": None,
                "vulnerable_parameter": None,
                "summary": "No confirmed vulnerabilities detected in tool execution log.",
            }
        elif case_type == 4:  # Benign XSS scan
            raw_log = (
                f"[*] Starting RedShield Diagnostic DOM/Reflected Context Auditor v1.0\n"
                f"[+] Strict Content-Security-Policy header present.\n"
                f"[INFO] No reflection or DOM sink found.\n"
                f"[*] Diagnostic complete: 0 vulnerabilities detected."
            )
            label = {
                "vulnerability_detected": False,
                "vulnerability_type": "None",
                "severity": "Benign",
                "cve_id": None,
                "cwe_id": None,
                "mitre_technique_id": None,
                "confidence_score": 0.0,
                "evidence_payload": None,
                "vulnerable_parameter": None,
                "summary": "No confirmed vulnerabilities detected in tool execution log.",
            }
        else:  # Timeout or SIGKILL Aborted scan
            raw_log = (
                f"[*] Starting RedShield Endpoint & SSRF Surface Diagnostic v1.0\n"
                f"[!] [SIGKILL] Session aborted by operator killswitch. Container removed."
            )
            label = {
                "vulnerability_detected": False,
                "vulnerability_type": "None",
                "severity": "Benign",
                "cve_id": None,
                "cwe_id": None,
                "mitre_technique_id": None,
                "confidence_score": 0.0,
                "evidence_payload": None,
                "vulnerable_parameter": None,
                "summary": "Execution aborted via operator SIGKILL killswitch before completion; no vulnerability confirmed.",
            }

        samples.append(build_example(raw_log, label))

    return samples


def main() -> None:
    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    samples = generate_dataset(300)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for item in samples:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
    print(f"[+] Wrote {len(samples)} ground-truth SFT training examples to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
