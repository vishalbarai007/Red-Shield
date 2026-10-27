# Red-Shield: AI Agent Operational Guidelines

## Core Project Mandates

### 1. Documentation Integrity (STRICT REQUIREMENT)
Whenever you add, modify, or refactor any code, component, endpoint, WebSocket event, or design layout in this repository:
- **You MUST update the corresponding documentation files in the `doc/` directory in the same turn/task.**
- Keep `doc/architecture.md`, `doc/user_flow.md`, `doc/research_papers.md`, and `doc/similar_platforms.md` in complete synchronization with the latest code changes.
- Never complete a phase without reviewing and updating `doc/`.

### 2. Architecture & Tech Stack Rules
- **Frontend**: Next.js 16 (App Router, TypeScript, Tailwind CSS). Dynamic imports (`'use client'`) must be used for browser-only DOM libraries (`xterm.js`, Monaco Editor) to preserve SSR safety.
- **Backend**: Python 3.12+ (FastAPI + `python-socketio` ASGI server on port 5000). CORS must explicitly permit `http://localhost:3000`.
- **Theme**: Dark command center aesthetic with obsidian backgrounds, subtle neon cyan/red accents, and glowing badges.
