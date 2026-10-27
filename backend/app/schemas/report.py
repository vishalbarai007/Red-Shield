"""
Pydantic Schemas for the SLM Structured Audit Report, Sandbox Launch Requests,
Policy Gate Targets, and Phase 5 Validation Benchmarks.
"""

from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel, Field


class SLMVulnerabilityReport(BaseModel):
    """
    Strict JSON Schema enforced by the Local SLM Inference Engine.
    Matches the reference implementation specification.
    """

    vulnerability_detected: bool = Field(
        ..., description="True ONLY if the log explicitly confirms a verified vulnerability."
    )
    vulnerability_type: Literal["SQLi", "XSS", "SSRF", "None"] = Field(
        "None", description="Confirmed vulnerability category or 'None'."
    )
    severity: Literal["Critical", "High", "Medium", "Low", "Benign"] = Field(
        "Benign", description="Computed severity badge for UI rendering."
    )
    cve_id: Optional[str] = Field(
        None, description="Explicit CVE identifier if present in evidence, else null."
    )
    cwe_id: Optional[str] = Field(
        None, description="Mapped CWE identifier (e.g., CWE-89, CWE-79, CWE-918), else null."
    )
    mitre_technique_id: Optional[str] = Field(
        None, description="Mapped MITRE ATT&CK Technique ID (e.g., T1190, T1059.007), else null."
    )
    confidence_score: float = Field(
        0.0, ge=0.0, le=1.0, description="Deterministic confidence score between 0.0 and 1.0."
    )
    evidence_payload: Optional[str] = Field(
        None, description="Exact diagnostic marker or evidence confirmed in the tool log."
    )
    vulnerable_parameter: Optional[str] = Field(
        None, description="Target query/body/DOM parameter confirmed vulnerable."
    )
    summary: str = Field(
        ..., description="Concise, factual audit summary grounded strictly in log output."
    )


class SandboxLaunchRequest(BaseModel):
    target_url: str = Field(
        ...,
        description="Target URL to verify against the Policy Gate and run diagnostic module against.",
        examples=["http://juice-shop.local/rest/products/search?q=test"],
    )
    module: Literal["sqlmap", "xsstrike", "ffuf"] = Field(
        "sqlmap",
        description="Selected diagnostic sandbox module (sqlmap, xsstrike, or ffuf).",
    )
    scan_profile: Literal["vulnerable", "benign"] = Field(
        "vulnerable",
        description="Simulation profile ('vulnerable' for positive test case, 'benign' for hardened/clean target).",
    )
    auth_token: Optional[str] = Field(
        None, description="Optional authorization token for Policy Gate verification."
    )
    timeout_seconds: Optional[int] = Field(
        60, ge=5, le=120, description="Hard execution timeout in seconds."
    )


class SandboxLaunchResponse(BaseModel):
    session_id: str
    status: str
    target_url: str
    module: str
    scan_profile: str
    websocket_url: str
    policy_message: str
    container_security: Dict[str, Any]
    timestamp: float


class PolicyTargetCreateRequest(BaseModel):
    target_pattern: str
    scope_name: str
    auth_token: str
    status: Literal["ACTIVE", "REVOKED"] = "ACTIVE"


class BenchmarkSummaryResponse(BaseModel):
    timestamp: float
    latency_metrics: Dict[str, Any]
    escape_and_egress_validation: Dict[str, Any]
    hallucination_and_accuracy: Dict[str, Any]
    overall_passed: bool
