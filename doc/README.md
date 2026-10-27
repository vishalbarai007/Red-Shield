# Cyber-Cerberus (RedShield): Operational & Technical Documentation

Welcome to the central documentation hub for **Cyber-Cerberus**, a locally-hosted, multi-modal Red Team Operations Suite featuring the **RedShield Exploitation Sandbox & Local SLM Security Log Parser**.

---

## 📚 Documentation Index

| Document | Description |
| :--- | :--- |
| **[Architecture & Blueprint](architecture.md)** | Deep technical specification of Next.js 16 frontend, FastAPI ASGI backend, Decoupled Policy Gate, Hardened Docker Sandbox Controller, WebSocket Multiplexer, and Local SLM (Qwen-2.5-3B / Llama-3.2-3B) LoRA parser. |
| **[User Flow & Journey](user_flow.md)** | Step-by-step operator workflows, state diagrams, and interaction journeys across Recon, Sandbox Execution Control Panel, SIGKILL Killswitch, `xterm.js` Terminal, Structured SLM Report Viewer, and Voice Sentinel. |
| **[Literature & Research Survey](research_papers.md)** | Academic state-of-the-art literature review on Autonomous Penetration Testing (AutoPT), Multi-Agent LLMs, Constrained Local SLM Log Parsing (QLoRA/PEFT), and formal assurance properties. |
| **[Similar Platforms Comparison](similar_platforms.md)** | Detailed feature comparison and teardown across Cobalt Strike, Sliver, Mythic, Caldera, Metasploit, and PentestGPT—highlighting RedShield's Decoupled Policy Gate and Zero-Hallucination Local SLM. |

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

### 1. Start FastAPI & Sandbox Backend (Port 5000)
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

### 3. Build Optional Diagnostic Container Images & Run Verification Benchmarks
```bash
bash scripts/build_tools.sh
./backend/venv/bin/python backend/tests/verify_phase5_metrics.py
```

### 4. Open Command Center
Navigate to `http://localhost:3000` in your browser. Verify the green `🟢 Connected` badge in the top navbar, select an authorized target in the **Sandbox Control Panel**, and click **LAUNCH SANDBOX**.
