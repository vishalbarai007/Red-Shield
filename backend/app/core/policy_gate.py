"""
Decoupled Authorization Policy Gate (Task 2.3)
Verifies that any target URL is explicitly authorized in the local SQLite policy store
before allowing the Sandbox Controller to spawn a container.
Also persists structured SLM audit reports for compliance traceability.
"""

import json
import sqlite3
import time
from typing import Dict, Any, List, Optional, Tuple
from urllib.parse import urlparse

from app.core.config import DB_PATH, DEFAULT_AUTHORIZED_TARGETS

# Blocked / forbidden host patterns (e.g., cloud metadata, external root DNS, unauthorized ranges)
FORBIDDEN_HOSTS = {
    "169.254.169.254",
    "metadata.google.internal",
    "10.0.0.1",
    "prod.internal",
    "gov.in",
    "bank.com",
}


class PolicyGate:
    """Decoupled Authorization Policy Gate & Audit Persistence Manager."""

    def __init__(self, db_path: str = str(DB_PATH)) -> None:
        self.db_path = db_path
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._get_conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS authorized_targets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    target_pattern TEXT UNIQUE NOT NULL,
                    scope_name TEXT NOT NULL,
                    auth_token TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'ACTIVE',
                    created_at REAL NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS audit_reports (
                    session_id TEXT PRIMARY KEY,
                    target_url TEXT NOT NULL,
                    module TEXT NOT NULL,
                    scan_profile TEXT NOT NULL,
                    status TEXT NOT NULL,
                    vulnerability_detected INTEGER NOT NULL,
                    vulnerability_type TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    cve_id TEXT,
                    cwe_id TEXT,
                    mitre_technique_id TEXT,
                    confidence_score REAL NOT NULL,
                    evidence_payload TEXT,
                    vulnerable_parameter TEXT,
                    summary TEXT NOT NULL,
                    raw_log TEXT,
                    sanitized_log TEXT,
                    execution_time_ms REAL,
                    slm_inference_ms REAL,
                    created_at REAL NOT NULL
                )
                """
            )
            # Seed default lab targets if not present
            for item in DEFAULT_AUTHORIZED_TARGETS:
                conn.execute(
                    """
                    INSERT OR IGNORE INTO authorized_targets
                    (target_pattern, scope_name, auth_token, status, created_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        item["target_pattern"],
                        item["scope_name"],
                        item["auth_token"],
                        item["status"],
                        time.time(),
                    ),
                )
            conn.commit()

    def verify_target(self, target_url: str, auth_token: Optional[str] = None) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Verify whether `target_url` is cleared by the Authorization Gate.
        Returns: (is_authorized, reason, matched_policy)
        """
        if not target_url or not target_url.strip():
            return False, "Target URL cannot be empty.", None

        normalized = target_url.strip()
        parsed = urlparse(normalized if "://" in normalized else f"http://{normalized}")
        hostname = (parsed.hostname or "").lower()

        if not hostname:
            return False, f"Malformed target URL: '{target_url}'", None

        # Immediate block on forbidden internal/metadata/external domains
        for forbidden in FORBIDDEN_HOSTS:
            if hostname == forbidden or hostname.endswith(f".{forbidden}"):
                return (
                    False,
                    f"Egress Policy Violation: Host '{hostname}' is explicitly blacklisted by sandbox boundary policy.",
                    None,
                )

        if "unverified" in normalized.lower() or "flagged" in normalized.lower() or "blocked" in normalized.lower():
            return (
                False,
                f"Target '{target_url}' is flagged as unverified/suspicious by the Authorization Policy Gate.",
                None,
            )

        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT * FROM authorized_targets WHERE status = 'ACTIVE'"
            ).fetchall()

        for row in rows:
            pattern = row["target_pattern"].lower()
            pattern_host = urlparse(pattern if "://" in pattern else f"http://{pattern}").hostname or pattern
            if normalized.lower().startswith(pattern) or hostname == pattern_host:
                if auth_token and auth_token != row["auth_token"]:
                    return (
                        False,
                        f"Authorization token mismatch for scope '{row['scope_name']}'.",
                        None,
                    )
                return (
                    True,
                    f"Target verified under active scope '{row['scope_name']}' ({row['auth_token']}).",
                    dict(row),
                )

        return (
            False,
            f"Target '{target_url}' (host: {hostname}) has no active authorization token in Policy Gate.",
            None,
        )

    def list_targets(self) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT id, target_pattern, scope_name, auth_token, status, created_at FROM authorized_targets ORDER BY id ASC"
            ).fetchall()
            return [dict(r) for r in rows]

    def add_authorized_target(
        self, target_pattern: str, scope_name: str, auth_token: str, status: str = "ACTIVE"
    ) -> Dict[str, Any]:
        now = time.time()
        with self._get_conn() as conn:
            conn.execute(
                """
                INSERT INTO authorized_targets (target_pattern, scope_name, auth_token, status, created_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(target_pattern) DO UPDATE SET
                    scope_name=excluded.scope_name,
                    auth_token=excluded.auth_token,
                    status=excluded.status
                """,
                (target_pattern.strip(), scope_name.strip(), auth_token.strip(), status.upper(), now),
            )
            conn.commit()
        return {
            "target_pattern": target_pattern.strip(),
            "scope_name": scope_name.strip(),
            "auth_token": auth_token.strip(),
            "status": status.upper(),
            "created_at": now,
        }

    def save_audit_report(self, record: Dict[str, Any]) -> None:
        with self._get_conn() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO audit_reports (
                    session_id, target_url, module, scan_profile, status,
                    vulnerability_detected, vulnerability_type, severity,
                    cve_id, cwe_id, mitre_technique_id, confidence_score,
                    evidence_payload, vulnerable_parameter, summary,
                    raw_log, sanitized_log, execution_time_ms, slm_inference_ms, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record["session_id"],
                    record["target_url"],
                    record["module"],
                    record.get("scan_profile", "vulnerable"),
                    record.get("status", "COMPLETED"),
                    1 if record["vulnerability_detected"] else 0,
                    record["vulnerability_type"],
                    record.get("severity", "Benign"),
                    record.get("cve_id"),
                    record.get("cwe_id"),
                    record.get("mitre_technique_id"),
                    float(record.get("confidence_score", 0.0)),
                    record.get("evidence_payload"),
                    record.get("vulnerable_parameter"),
                    record["summary"],
                    record.get("raw_log", ""),
                    record.get("sanitized_log", ""),
                    float(record.get("execution_time_ms", 0.0)),
                    float(record.get("slm_inference_ms", 0.0)),
                    record.get("created_at", time.time()),
                ),
            )
            conn.commit()

    def list_audit_reports(self, limit: int = 25) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            rows = conn.execute(
                """
                SELECT session_id, target_url, module, scan_profile, status,
                       vulnerability_detected, vulnerability_type, severity,
                       cve_id, cwe_id, mitre_technique_id, confidence_score,
                       evidence_payload, vulnerable_parameter, summary,
                       execution_time_ms, slm_inference_ms, created_at
                FROM audit_reports
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
            result = []
            for r in rows:
                d = dict(r)
                d["vulnerability_detected"] = bool(d["vulnerability_detected"])
                result.append(d)
            return result


policy_gate = PolicyGate()
