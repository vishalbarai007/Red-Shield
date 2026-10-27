"""
Central Configuration for the Red-Shield Exploitation Sandbox
and Local SLM Log Parsing Engine.
"""

import os
from pathlib import Path
from typing import Dict, Any, List

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = BASE_DIR / "sandbox_audit.db"

# Task 1.2: Hardened Docker Container Security Baselines
CONTAINER_SECURITY_BASELINE: Dict[str, Any] = {
    "mem_limit": "512m",
    "cpu_quota": 50000,  # 0.5 CPU core (out of 100000 cpu_period)
    "cpu_period": 100000,
    "network_mode": "bridge",
    "cap_drop": ["ALL"],
    "read_only": True,
    "security_opt": ["no-new-privileges:true"],
}

# Supported Diagnostic Sandbox Modules
TOOL_IMAGE_MAP: Dict[str, str] = {
    "sqlmap": "redshield-tool-sqlmap:latest",
    "xsstrike": "redshield-tool-xsstrike:latest",
    "ffuf": "redshield-tool-ffuf:latest",
}

# Execution & Context Window Boundaries
SANDBOX_TIMEOUT_SECONDS: int = int(os.environ.get("SANDBOX_TIMEOUT_SECONDS", "60"))
MAX_LOG_WINDOW_CHARS: int = int(os.environ.get("MAX_LOG_WINDOW_CHARS", "6000"))

# Local SLM Configuration (Qwen-2.5-3B-Instruct / Llama-3.2-3B-Instruct)
SLM_MODEL_ID: str = os.environ.get("SLM_MODEL_ID", "Qwen/Qwen2.5-3B-Instruct")
SLM_LORA_ADAPTER_PATH: str = os.environ.get(
    "SLM_LORA_ADAPTER_PATH", str(BASE_DIR.parent / "training" / "outputs" / "redshield-slm-lora")
)
SLM_USE_LOCAL_WEIGHTS: bool = os.environ.get("SLM_USE_LOCAL_WEIGHTS", "false").lower() == "true"

# Default Authorized Lab Targets for the Decoupled Policy Gate
DEFAULT_AUTHORIZED_TARGETS: List[Dict[str, str]] = [
    {
        "target_pattern": "http://juice-shop.local",
        "scope_name": "OWASP Juice Shop Local Lab",
        "auth_token": "AUTH-TOKEN-JUICE-2026",
        "status": "ACTIVE",
    },
    {
        "target_pattern": "http://dvwa.local",
        "scope_name": "DVWA Vulnerable Testbed",
        "auth_token": "AUTH-TOKEN-DVWA-2026",
        "status": "ACTIVE",
    },
    {
        "target_pattern": "http://localhost:3000",
        "scope_name": "Local Loopback Test Service",
        "auth_token": "AUTH-TOKEN-LOCAL-3000",
        "status": "ACTIVE",
    },
    {
        "target_pattern": "http://127.0.0.1:8080",
        "scope_name": "Local Diagnostic Microservice",
        "auth_token": "AUTH-TOKEN-LOCAL-8080",
        "status": "ACTIVE",
    },
    {
        "target_pattern": "http://192.168.1.105",
        "scope_name": "Lab Range Target Asset 105",
        "auth_token": "AUTH-TOKEN-LAB-105",
        "status": "ACTIVE",
    },
]
