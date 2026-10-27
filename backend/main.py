import time
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints.sandbox import router as sandbox_router, ws_router as sandbox_ws_router
from app.services.sandbox_service import sandbox_service

# Initialize Socket.IO Async Server with CORS allowance for frontend
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    logger=False,
    engineio_logger=False
)

# Initialize FastAPI application
fastapi_app = FastAPI(
    title="Cyber-Cerberus / RedShield API",
    description="Locally-hosted, Multi-Modal Red Team Operations Suite & Exploitation Sandbox C2 Backend",
    version="1.2.0"
)

# Configure CORS Middleware for standard REST endpoints
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Sandbox REST and WebSocket routers
fastapi_app.include_router(sandbox_router, prefix="/api/v1/sandbox", tags=["Exploitation Sandbox & SLM"])
fastapi_app.include_router(sandbox_ws_router, tags=["Sandbox WebSocket Stream"])


# Register Socket.IO broadcast bridge with SandboxOrchestrationService
async def _sio_broadcast(event: str, payload: object) -> None:
    await sio.emit(event, payload)


sandbox_service.register_socketio_emitter(_sio_broadcast)


@fastapi_app.get("/health")
async def health_check():
    return {
        "status": "online",
        "system": "Cyber-Cerberus Operations Suite (RedShield Sandbox Active)",
        "mode": "Operational",
        "timestamp": time.time()
    }


@fastapi_app.get("/")
async def root():
    return {
        "message": "Cyber-Cerberus Red Team C2 & RedShield Sandbox Engine is operational.",
        "websocket_endpoint": "/socket.io/",
        "sandbox_ws_endpoint": "/ws/sandbox/{session_id}",
        "sandbox_rest_prefix": "/api/v1/sandbox",
        "health_check": "/health"
    }


# Socket.IO Event Handlers
@sio.event
async def connect(sid, environ):
    print(f"[+] Client connected: SID={sid}")
    await sio.emit("server_status", {
        "connected": True,
        "message": "Cyber-Cerberus Command & Control Bridge Established.",
        "timestamp": time.time()
    }, to=sid)


@sio.event
async def disconnect(sid):
    print(f"[-] Client disconnected: SID={sid}")


@sio.on("ping")
async def handle_ping(sid, data=None):
    client_timestamp = None
    if isinstance(data, dict):
        client_timestamp = data.get("timestamp")

    server_time = time.time()
    response = {
        "status": "pong",
        "client_timestamp": client_timestamp,
        "server_timestamp": server_time,
        "message": "PONG: Cyber-Cerberus C2 Active"
    }
    await sio.emit("pong", response, to=sid)


@sio.on("sandbox_kill")
async def handle_sandbox_kill(sid, data=None):
    """Handle SIGKILL abort events sent over Socket.IO."""
    session_id = data.get("session_id") if isinstance(data, dict) else str(data)
    if session_id:
        await sandbox_service.kill_session(session_id)
        await sio.emit(
            "terminal_output",
            {"output": f"\r\n\x1b[31m[!] SIGKILL dispatched for session {session_id}\x1b[0m\r\n"},
            to=sid,
        )


@sio.on("terminal_command")
async def handle_terminal_command(sid, data=None):
    """Echo/respond to shell commands over WebSocket"""
    cmd = data.get("command", "").strip() if isinstance(data, dict) else str(data).strip()
    response_output = f"[cerberus-c2] Executed: {cmd}\r\n"
    if cmd == "help":
        response_output = (
            "\r\n=== Cyber-Cerberus C2 & RedShield Sandbox Subsystem ===\r\n"
            "Available commands:\r\n"
            "  help      - Show this help message\r\n"
            "  status    - Show suite telemetry, Policy Gate & SLM status\r\n"
            "  recon     - Quick reconnaissance status\r\n"
            "  policy    - List authorized Policy Gate targets\r\n"
            "  clear     - Clear terminal buffer\r\n"
        )
    elif cmd == "status":
        response_output = (
            "\r\n[SYSTEM STATUS] Cyber-Cerberus v1.2.0 (RedShield Sandbox + SLM)\r\n"
            "  Engine: Ready (Docker Hardened Baseline: 512MB RAM, 0.5 CPU, read_only, cap_drop=ALL)\r\n"
            "  Bridge: Socket.IO / ASGI + Native WS (/ws/sandbox/{session_id}) on :5000\r\n"
            "  SLM Parser: Constrained Zero-Hallucination Evidence Engine Ready\r\n"
        )
    elif cmd == "policy":
        from app.core.policy_gate import policy_gate

        targets = policy_gate.list_targets()
        lines = ["\r\n[POLICY GATE] Authorized Target Scopes:"]
        for t in targets:
            lines.append(f"  - {t['target_pattern']} ({t['scope_name']}) [{t['status']}]")
        response_output = "\r\n".join(lines) + "\r\n"
    elif cmd == "recon":
        response_output = "\r\n[RECON] Use the Sandbox Control Panel above to launch an authorized diagnostic scan.\r\n"

    await sio.emit("terminal_output", {"output": response_output}, to=sid)


# Combine ASGI Application (Socket.IO + FastAPI)
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
