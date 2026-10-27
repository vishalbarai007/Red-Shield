"""
Task 2.2, 2.3 & Phase 5: REST & WebSocket Route Definitions (`sandbox.py`)
Provides:
  - POST /api/v1/sandbox/launch (with Policy Gate verification -> 403 if blocked)
  - POST /api/v1/sandbox/{session_id}/kill (SIGKILL container teardown)
  - GET  /api/v1/sandbox/reports (Historical SLM structured JSON reports)
  - GET  /api/v1/sandbox/{session_id} (Session status + report)
  - GET  /api/v1/sandbox/policy/targets & POST /api/v1/sandbox/policy/authorize
  - POST /api/v1/sandbox/parse-log (Direct SLM log parsing endpoint)
  - POST /api/v1/sandbox/benchmark (Phase 5 Latency, Escape/Egress, and 50+50 Hallucination Validation)
  - WS   /ws/sandbox/{session_id} (Real-time xterm.js log multiplexer)
"""

import asyncio
import json
import time
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from app.core.config import CONTAINER_SECURITY_BASELINE, SANDBOX_TIMEOUT_SECONDS
from app.core.policy_gate import policy_gate
from app.schemas.report import (
    SandboxLaunchRequest,
    SandboxLaunchResponse,
    PolicyTargetCreateRequest,
    BenchmarkSummaryResponse,
)
from app.services.docker_manager import docker_manager, _generate_simulated_tool_lines
from app.services.log_sanitizer import sanitize_terminal_output
from app.services.sandbox_service import sandbox_service
from app.services.slm_engine import slm_engine

router = APIRouter()
ws_router = APIRouter()


class DirectLogParseRequest(BaseModel):
    raw_log: str


@router.post("/launch", response_model=SandboxLaunchResponse)
async def launch_sandbox_scan(req: SandboxLaunchRequest) -> SandboxLaunchResponse:
    """
    1. Verify target URL against Decoupled Authorization Policy Gate.
    2. Return 403 Target Blocked if unverified or blacklisted.
    3. Create and launch ephemeral sandbox session if verified.
    """
    is_allowed, reason, _ = policy_gate.verify_target(req.target_url, req.auth_token)
    if not is_allowed:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "403 Target Blocked",
                "reason": reason,
                "target_url": req.target_url,
            },
        )

    session = sandbox_service.create_session(
        target_url=req.target_url,
        module=req.module,
        scan_profile=req.scan_profile,
        timeout_seconds=req.timeout_seconds or SANDBOX_TIMEOUT_SECONDS,
    )

    # Fire-and-forget asynchronous container execution
    asyncio.create_task(sandbox_service.execute_session(session.session_id))

    return SandboxLaunchResponse(
        session_id=session.session_id,
        status=session.status,
        target_url=session.target_url,
        module=session.module,
        scan_profile=session.scan_profile,
        websocket_url=f"/ws/sandbox/{session.session_id}",
        policy_message=reason,
        container_security=docker_manager.get_security_config(),
        timestamp=session.created_at,
    )


@router.post("/{session_id}/kill")
async def kill_sandbox_session(session_id: str) -> Dict[str, Any]:
    """Immediately send SIGKILL to abort and remove the active container."""
    killed = await sandbox_service.kill_session(session_id)
    return {
        "session_id": session_id,
        "sigkill_dispatched": True,
        "container_terminated": killed,
        "status": "ABORTED",
        "timestamp": time.time(),
    }


@router.get("/reports")
async def list_reports(limit: int = 25) -> Dict[str, Any]:
    """Return structured JSON audit reports persisted in SQLite."""
    reports = policy_gate.list_audit_reports(limit=limit)
    return {
        "count": len(reports),
        "slm_engine": slm_engine.get_engine_info(),
        "reports": reports,
    }


@router.get("/policy/targets")
async def get_authorized_targets() -> Dict[str, Any]:
    """List all target scopes registered in the Decoupled Authorization Policy Gate."""
    return {
        "targets": policy_gate.list_targets(),
        "container_security_baseline": CONTAINER_SECURITY_BASELINE,
    }


@router.post("/policy/authorize")
async def add_authorized_target(req: PolicyTargetCreateRequest) -> Dict[str, Any]:
    """Register or update an authorized target scope in the Policy Gate."""
    record = policy_gate.add_authorized_target(
        target_pattern=req.target_pattern,
        scope_name=req.scope_name,
        auth_token=req.auth_token,
        status=req.status,
    )
    return {"message": "Target scope updated in Policy Gate.", "target": record}


@router.post("/parse-log")
async def parse_raw_log_endpoint(req: DirectLogParseRequest) -> Dict[str, Any]:
    """Sanitize raw terminal log and extract structured JSON report via Local SLM Engine."""
    sanitized = sanitize_terminal_output(req.raw_log)
    report, inference_ms, prompt = slm_engine.parse_log(req.raw_log)
    return {
        "sanitized_log": sanitized,
        "report": report.model_dump(),
        "slm_inference_ms": round(inference_ms, 3),
        "prompt_preview": prompt[:600],
    }


@router.post("/benchmark", response_model=BenchmarkSummaryResponse)
async def run_phase5_benchmarks() -> BenchmarkSummaryResponse:
    """
    Phase 5 Validation & Metric Collection:
      - Task 5.1: Latency & Performance Benchmarking (<1.5s spin-up, <500ms WS latency, <4s SLM inference)
      - Task 5.2: Sandbox Escape & Egress Validation (read-only rootfs, cap_drop=ALL, metadata/external IP block)
      - Task 5.3: Hallucination & Accuracy Verification (50 vulnerable scans + 50 secure scans)
    """
    # 1. Task 5.1: Measure container/session spin-up, WebSocket queue delivery, and SLM inference latency
    t0 = time.perf_counter()
    session = sandbox_service.create_session(
        target_url="http://juice-shop.local/rest/products/search?q=bench",
        module="sqlmap",
        scan_profile="vulnerable",
        timeout_seconds=30,
    )
    spinup_ms = (time.perf_counter() - t0) * 1000.0

    q = sandbox_service.subscribe(session.session_id)
    ws_t0 = time.perf_counter()
    exec_task = asyncio.create_task(sandbox_service.execute_session(session.session_id))
    first_chunk = await asyncio.wait_for(q.get(), timeout=2.0) if q else ""
    ws_first_byte_ms = (time.perf_counter() - ws_t0) * 1000.0
    sandbox_service.unsubscribe(session.session_id, q)  # type: ignore[arg-type]
    completed_record = await exec_task

    slm_ms = completed_record["slm_inference_ms"] if completed_record else 0.0

    latency_metrics = {
        "sandbox_spinup_ms": round(spinup_ms, 3),
        "sandbox_spinup_target_ms": 1500.0,
        "sandbox_spinup_passed": spinup_ms < 1500.0,
        "websocket_stream_latency_ms": round(ws_first_byte_ms, 3),
        "websocket_stream_target_ms": 500.0,
        "websocket_stream_passed": ws_first_byte_ms < 500.0 and bool(first_chunk),
        "slm_inference_ms": round(slm_ms, 3),
        "slm_inference_target_ms": 4000.0,
        "slm_inference_passed": slm_ms < 4000.0,
    }

    # 2. Task 5.2: Sandbox Escape & Egress Policy Validation
    blocked_metadata, metadata_reason, _ = policy_gate.verify_target("http://169.254.169.254/latest/meta-data/")
    blocked_internal, internal_reason, _ = policy_gate.verify_target("http://10.0.0.1/admin")
    blocked_external, external_reason, _ = policy_gate.verify_target("https://unverified-external-site.org/login")
    sec_cfg = docker_manager.get_security_config()

    escape_validation = {
        "read_only_rootfs": sec_cfg.get("read_only") is True,
        "cap_drop_all": sec_cfg.get("cap_drop") == ["ALL"],
        "no_new_privileges": "no-new-privileges:true" in sec_cfg.get("security_opt", []),
        "mem_limit_enforced": sec_cfg.get("mem_limit") == "512m",
        "cpu_quota_enforced": sec_cfg.get("cpu_quota") == 50000,
        "cloud_metadata_egress_blocked": (not blocked_metadata),
        "internal_subnet_egress_blocked": (not blocked_internal),
        "unverified_external_blocked": (not blocked_external),
        "sample_block_reasons": [metadata_reason, internal_reason, external_reason],
    }
    escape_passed = all(
        [
            escape_validation["read_only_rootfs"],
            escape_validation["cap_drop_all"],
            escape_validation["no_new_privileges"],
            escape_validation["cloud_metadata_egress_blocked"],
            escape_validation["internal_subnet_egress_blocked"],
            escape_validation["unverified_external_blocked"],
        ]
    )
    escape_validation["passed"] = escape_passed

    # 3. Task 5.3: 50 Vulnerable Scans + 50 Secure/Benign Scans Hallucination Verification
    modules = ["sqlmap", "xsstrike", "ffuf"]
    true_positives = 0
    false_negatives = 0
    true_negatives = 0
    false_positives_hallucinated = 0

    for i in range(50):
        mod = modules[i % len(modules)]
        vuln_lines = _generate_simulated_tool_lines(
            mod, f"http://juice-shop.local/endpoint/{i}?q=test", "vulnerable"
        )
        vuln_report, _, _ = slm_engine.parse_log("\n".join(vuln_lines))
        if vuln_report.vulnerability_detected and vuln_report.vulnerability_type in ("SQLi", "XSS", "SSRF"):
            true_positives += 1
        else:
            false_negatives += 1

    for i in range(50):
        mod = modules[i % len(modules)]
        benign_lines = _generate_simulated_tool_lines(
            mod, f"http://dvwa.local/secure/endpoint/{i}?q=safe", "benign"
        )
        benign_report, _, _ = slm_engine.parse_log("\n".join(benign_lines))
        if not benign_report.vulnerability_detected and benign_report.cve_id is None:
            true_negatives += 1
        else:
            false_positives_hallucinated += 1

    total_scans = 100
    accuracy = (true_positives + true_negatives) / total_scans
    hallucination_rate = false_positives_hallucinated / 50.0

    hallucination_metrics = {
        "vulnerable_scans_tested": 50,
        "secure_scans_tested": 50,
        "true_positives": true_positives,
        "false_negatives": false_negatives,
        "true_negatives": true_negatives,
        "false_positives_hallucinated_cves": false_positives_hallucinated,
        "overall_accuracy": round(accuracy * 100.0, 2),
        "hallucination_rate_percent": round(hallucination_rate * 100.0, 2),
        "passed": (false_positives_hallucinated == 0 and accuracy >= 0.98),
    }

    overall_passed = (
        latency_metrics["sandbox_spinup_passed"]
        and latency_metrics["websocket_stream_passed"]
        and latency_metrics["slm_inference_passed"]
        and escape_passed
        and hallucination_metrics["passed"]
    )

    return BenchmarkSummaryResponse(
        timestamp=time.time(),
        latency_metrics=latency_metrics,
        escape_and_egress_validation=escape_validation,
        hallucination_and_accuracy=hallucination_metrics,
        overall_passed=overall_passed,
    )


@router.get("/{session_id}")
async def get_sandbox_session(session_id: str) -> Dict[str, Any]:
    """Retrieve live or completed session details, logs, and SLM JSON report."""
    state = sandbox_service.sessions.get(session_id)
    if state is None:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    raw_log = "".join(state.logs)
    return {
        "session_id": state.session_id,
        "status": state.status,
        "target_url": state.target_url,
        "module": state.module,
        "scan_profile": state.scan_profile,
        "execution_time_ms": round(state.execution_time_ms, 2),
        "slm_inference_ms": round(state.slm_inference_ms, 2),
        "raw_log": raw_log,
        "sanitized_log": sanitize_terminal_output(raw_log),
        "report": state.report,
    }


@ws_router.websocket("/ws/sandbox/{session_id}")
async def sandbox_websocket_endpoint(websocket: WebSocket, session_id: str) -> None:
    """
    Task 2.2: Bi-directional WebSocket Log Multiplexer (`/ws/sandbox/{session_id}`).
    Streams container stdout/stderr line-by-line to `xterm.js` and accepts
    `SIGKILL` / `{"action": "kill"}` commands from the operator UI.
    """
    await websocket.accept()
    queue = sandbox_service.subscribe(session_id)
    if queue is None:
        await websocket.send_text(
            f"\x1b[31m[!] Session '{session_id}' not found in Sandbox Controller.\x1b[0m\r\n"
        )
        await websocket.close(code=1008)
        return

    async def _reader() -> None:
        try:
            while True:
                msg = await websocket.receive_text()
                if "kill" in msg.lower() or "sigkill" in msg.lower():
                    await sandbox_service.kill_session(session_id)
        except Exception:
            pass

    reader_task = asyncio.create_task(_reader())
    try:
        while True:
            chunk = await queue.get()
            if chunk is None:
                # Send structured report JSON frame before closing
                state = sandbox_service.sessions.get(session_id)
                if state and state.report:
                    await websocket.send_text(
                        json.dumps({"type": "sandbox_report", "data": state.report})
                    )
                break
            await websocket.send_text(chunk)
    except WebSocketDisconnect:
        pass
    finally:
        reader_task.cancel()
        sandbox_service.unsubscribe(session_id, queue)
