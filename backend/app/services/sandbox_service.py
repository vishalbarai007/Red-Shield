"""
Task 2.1 & Task 2.2: Sandbox Orchestration Service (`sandbox_service.py`)
Coordinates:
  1. Policy Gate authorization check
  2. Ephemeral Docker container execution & timeout enforcement
  3. Dual-path log splitting (Real-time WebSocket/Socket.IO broadcast + in-memory buffer)
  4. Post-execution ANSI sanitization and Local SLM structured JSON report extraction
  5. Persistence to SQLite (`sandbox_audit.db`)
"""

import asyncio
import time
import uuid
from typing import Dict, Any, List, Optional, Callable, Awaitable

from app.core.config import SANDBOX_TIMEOUT_SECONDS
from app.core.policy_gate import policy_gate
from app.schemas.report import SLMVulnerabilityReport
from app.services.docker_manager import docker_manager
from app.services.log_sanitizer import sanitize_terminal_output
from app.services.slm_engine import slm_engine


class SandboxSessionState:
    def __init__(
        self,
        session_id: str,
        target_url: str,
        module: str,
        scan_profile: str,
        timeout_seconds: int,
    ) -> None:
        self.session_id = session_id
        self.target_url = target_url
        self.module = module
        self.scan_profile = scan_profile
        self.timeout_seconds = timeout_seconds
        self.status: str = "RUNNING"
        self.created_at: float = time.time()
        self.completed_at: Optional[float] = None
        self.execution_time_ms: float = 0.0
        self.slm_inference_ms: float = 0.0
        self.logs: List[str] = []
        self.subscribers: List[asyncio.Queue] = []
        self.report: Optional[Dict[str, Any]] = None


class SandboxOrchestrationService:
    """Manages active & historical sandbox sessions, WebSocket queues, and SLM report extraction."""

    def __init__(self) -> None:
        self.sessions: Dict[str, SandboxSessionState] = {}
        self.session_logs: Dict[str, List[str]] = {}
        self._sio_emitter: Optional[Callable[[str, Any], Awaitable[None]]] = None

    def register_socketio_emitter(
        self, emitter: Callable[[str, Any], Awaitable[None]]
    ) -> None:
        self._sio_emitter = emitter

    async def _broadcast_sio(self, event: str, payload: Any) -> None:
        if self._sio_emitter is not None:
            try:
                await self._sio_emitter(event, payload)
            except Exception:
                pass

    def create_session(
        self,
        target_url: str,
        module: str = "sqlmap",
        scan_profile: str = "vulnerable",
        timeout_seconds: int = SANDBOX_TIMEOUT_SECONDS,
    ) -> SandboxSessionState:
        session_id = f"sbx-{uuid.uuid4().hex[:10]}"
        state = SandboxSessionState(
            session_id=session_id,
            target_url=target_url,
            module=module,
            scan_profile=scan_profile,
            timeout_seconds=timeout_seconds,
        )
        self.sessions[session_id] = state
        self.session_logs[session_id] = state.logs
        return state

    async def execute_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        state = self.sessions.get(session_id)
        if state is None:
            return None

        t_start = time.perf_counter()
        await self._broadcast_sio(
            "sandbox_status",
            {
                "session_id": session_id,
                "status": "RUNNING",
                "target_url": state.target_url,
                "module": state.module,
            },
        )

        async for chunk in docker_manager.stream_execution(
            session_id=session_id,
            module=state.module,
            target_url=state.target_url,
            scan_profile=state.scan_profile,
            timeout_seconds=state.timeout_seconds,
        ):
            state.logs.append(chunk)
            # Push to all WebSocket subscribers for `/ws/sandbox/{session_id}`
            for q in list(state.subscribers):
                await q.put(chunk)
            # Also push to Socket.IO listeners (`sandbox_log` and `terminal_output`)
            await self._broadcast_sio(
                "sandbox_log",
                {
                    "session_id": session_id,
                    "chunk": chunk,
                    "timestamp": time.time(),
                },
            )
            await self._broadcast_sio("terminal_output", {"output": chunk})

        state.execution_time_ms = (time.perf_counter() - t_start) * 1000.0
        raw_log = "".join(state.logs)
        sanitized_log = sanitize_terminal_output(raw_log)

        # Run Local SLM Inference Engine
        slm_report, slm_ms, _ = slm_engine.parse_log(raw_log)
        state.slm_inference_ms = slm_ms
        state.completed_at = time.time()

        if "SIGKILL" in raw_log:
            state.status = "ABORTED"
        elif "TIMEOUT" in raw_log:
            state.status = "TIMEOUT"
        else:
            state.status = "COMPLETED"

        report_dict = slm_report.model_dump()
        full_record = {
            "session_id": session_id,
            "target_url": state.target_url,
            "module": state.module,
            "scan_profile": state.scan_profile,
            "status": state.status,
            **report_dict,
            "raw_log": raw_log,
            "sanitized_log": sanitized_log,
            "execution_time_ms": round(state.execution_time_ms, 2),
            "slm_inference_ms": round(state.slm_inference_ms, 2),
            "created_at": state.created_at,
        }
        state.report = full_record

        # Persist to SQLite via PolicyGate
        policy_gate.save_audit_report(full_record)

        # Notify WebSocket subscribers that stream + report are complete
        eof_payload = f"\x1b[32m[+] [SLM-PARSER] Structured JSON Report generated in {state.slm_inference_ms:.2f}ms (Severity: {report_dict['severity']})\x1b[0m\r\n"
        for q in list(state.subscribers):
            await q.put(eof_payload)
            await q.put(None)  # EOF sentinel

        await self._broadcast_sio("terminal_output", {"output": eof_payload})
        await self._broadcast_sio("sandbox_report", full_record)
        await self._broadcast_sio(
            "sandbox_status",
            {
                "session_id": session_id,
                "status": state.status,
                "target_url": state.target_url,
                "module": state.module,
            },
        )
        return full_record

    async def kill_session(self, session_id: str) -> bool:
        killed = await docker_manager.kill_session(session_id)
        state = self.sessions.get(session_id)
        if state is not None and state.status == "RUNNING":
            state.status = "ABORTED"
        return killed

    def subscribe(self, session_id: str) -> Optional[asyncio.Queue]:
        state = self.sessions.get(session_id)
        if state is None:
            return None
        q: asyncio.Queue = asyncio.Queue()
        # Replay any already buffered lines so late-joining WebSockets don't miss output
        for line in state.logs:
            q.put_nowait(line)
        if state.status in ("COMPLETED", "ABORTED", "TIMEOUT"):
            q.put_nowait(None)
        else:
            state.subscribers.append(q)
        return q

    def unsubscribe(self, session_id: str, q: asyncio.Queue) -> None:
        state = self.sessions.get(session_id)
        if state and q in state.subscribers:
            state.subscribers.remove(q)


sandbox_service = SandboxOrchestrationService()
