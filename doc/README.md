# Cyber-Cerberus: Operational & Technical Documentation

Welcome to the central documentation hub for **Cyber-Cerberus**, a locally-hosted, multi-modal Red Team Operations Suite.

---

## 📚 Documentation Index

| Document | Description |
| :--- | :--- |
| **[Architecture & Blueprint](architecture.md)** | Deep technical specification of Next.js 16 frontend, FastAPI ASGI backend, Socket.IO streaming bridge, component boundaries, and security models. |
| **[User Flow & Journey](user_flow.md)** | Step-by-step operator workflows, state diagrams, and interaction journeys across Recon, Exploitation Engine, Terminal, Monaco Editor, and Voice Sentinel. |
| **[Literature & Research Survey](research_papers.md)** | Academic state-of-the-art literature review on Autonomous Penetration Testing (AutoPT), Multi-Agent LLMs (VulnBot, CheckMate, CurriculumPT), and formal assurance properties. |
| **[Similar Platforms Comparison](similar_platforms.md)** | Detailed feature comparison and teardown across Cobalt Strike, Sliver, Mythic, Caldera, Metasploit, and PentestGPT. |

---

## 🔄 Mandatory Documentation Maintenance Protocol

> [!IMPORTANT]
> **RULE: Synchronized Documentation Updates**  
> Whenever any code, component, API endpoint, WebSocket event, or design layout in Cyber-Cerberus is added, modified, or refactored:
> 1. Corresponding documentation in `/doc/` **MUST** be updated immediately in the same turn/commit.
> 2. Architectural diagrams, sequence flows, or tables must be updated to reflect the new state.
> 3. No pull request or major phase milestone is considered complete without updated documentation.

---

## 🚀 Quick Start Guide

### 1. Start FastAPI Backend (Port 5000)
```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

### 2. Start Next.js Frontend (Port 3000)
```bash
cd frontend
npm run dev
```

### 3. Open Command Center
Navigate to `http://localhost:3000` in your browser. Verify the green `🟢 Connected` badge in the top navbar.
