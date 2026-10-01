import time
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize Socket.IO Async Server with CORS allowance for frontend
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    logger=False,
    engineio_logger=False
)

# Initialize FastAPI application
fastapi_app = FastAPI(
    title="Cyber-Cerberus API",
    description="Locally-hosted, Multi-Modal Red Team Operations Suite C2 Backend",
    version="1.0.0"
)

# Configure CORS Middleware for standard REST endpoints
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@fastapi_app.get("/health")
async def health_check():
    return {
        "status": "online",
        "system": "Cyber-Cerberus Operations Suite",
        "mode": "Standby",
        "timestamp": time.time()
    }

@fastapi_app.get("/")
async def root():
    return {
        "message": "Cyber-Cerberus Red Team C2 Engine is operational.",
        "websocket_endpoint": "/socket.io/",
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

@sio.on("terminal_command")
async def handle_terminal_command(sid, data=None):
    """Echo/respond to simulated shell commands over WebSocket"""
    cmd = data.get("command", "").strip() if isinstance(data, dict) else str(data).strip()
    response_output = f"[cerberus-c2] Executed: {cmd}\r\n"
    if cmd == "help":
        response_output = (
            "\r\n=== Cyber-Cerberus C2 Subsystem ===\r\n"
            "Available commands:\r\n"
            "  help      - Show this help message\r\n"
            "  status    - Show suite telemetry & active targets\r\n"
            "  recon     - Quick reconnaissance status\r\n"
            "  clear     - Clear terminal buffer\r\n"
        )
    elif cmd == "status":
        response_output = (
            "\r\n[SYSTEM STATUS] Cyber-Cerberus v1.0.0-alpha\r\n"
            "  Engine: Ready\r\n"
            "  Bridge: Socket.IO / ASGI on :5000\r\n"
            "  Active Modules: Recon, Exploit, Voice Sentinel\r\n"
        )
    elif cmd == "recon":
        response_output = "\r\n[RECON] No active scan target. Navigate to Target Recon tab to arm.\r\n"
        
    await sio.emit("terminal_output", {"output": response_output}, to=sid)

# Combine ASGI Application (Socket.IO + FastAPI)
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
