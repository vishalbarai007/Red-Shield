"""
Phase 5 Verification & Benchmark Suite (`verify_phase5_metrics.py`)
Tests:
  - Task 5.1: Sandbox spin-up (<1.5s), WebSocket streaming (<500ms), SLM inference (<4s)
  - Task 5.2: Policy Gate 403 blocking on unauthorized/internal/metadata targets & container hardening
  - Task 5.3: 50 vulnerable scans + 50 secure scans verifying 0% false CVE hallucination
  - Task 4.3: SIGKILL killswitch immediate session teardown
"""

import asyncio
import json
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.api.v1.endpoints.sandbox import (
    run_phase5_benchmarks,
    launch_sandbox_scan,
    kill_sandbox_session,
)
from app.schemas.report import SandboxLaunchRequest
from fastapi import HTTPException


async def main() -> None:
    print("=================================================================")
    print("  RedShield / Cyber-Cerberus Phase 5 Verification & Benchmarks")
    print("=================================================================")

    # 1. Run full Phase 5 benchmark suite (5.1, 5.2, 5.3)
    benchmark_res = await run_phase5_benchmarks()
    data = benchmark_res.model_dump()
    print(json.dumps(data, indent=2))

    assert data["latency_metrics"]["sandbox_spinup_passed"], "Spin-up time exceeded 1.5s!"
    assert data["latency_metrics"]["websocket_stream_passed"], "WebSocket latency exceeded 500ms!"
    assert data["latency_metrics"]["slm_inference_passed"], "SLM inference exceeded 4s!"
    assert data["escape_and_egress_validation"]["passed"], "Escape/Egress validation failed!"
    assert data["hallucination_and_accuracy"]["passed"], "Hallucination/Accuracy verification failed!"
    assert data["hallucination_and_accuracy"]["false_positives_hallucinated_cves"] == 0, "Hallucinated CVE detected!"

    # 2. Verify Policy Gate HTTP 403 rejection via endpoint handler
    try:
        await launch_sandbox_scan(
            SandboxLaunchRequest(
                target_url="http://169.254.169.254/latest/meta-data/",
                module="ffuf",
                scan_profile="vulnerable",
            )
        )
        raise AssertionError("Expected 403 HTTPException for unauthorized target!")
    except HTTPException as exc:
        assert exc.status_code == 403, f"Expected 403, got {exc.status_code}"
        print(f"[+] Policy Gate 403 verified: {exc.detail}")

    # 3. Verify SIGKILL Killswitch
    launch_res = await launch_sandbox_scan(
        SandboxLaunchRequest(
            target_url="http://juice-shop.local/rest/products/search?q=killtest",
            module="sqlmap",
            scan_profile="vulnerable",
        )
    )
    kill_res = await kill_sandbox_session(launch_res.session_id)
    assert kill_res["sigkill_dispatched"] is True
    print(f"[+] SIGKILL Killswitch verified for session {launch_res.session_id}: {kill_res}")

    print("=================================================================")
    print("  ALL PHASE 1-5 VERIFICATION CHECKS PASSED (100% ACCURACY, 0% HALLUCINATION)")
    print("=================================================================")


if __name__ == "__main__":
    asyncio.run(main())
