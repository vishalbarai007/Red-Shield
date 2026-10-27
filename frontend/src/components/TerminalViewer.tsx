'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Terminal as TerminalIcon,
  Trash2,
  RotateCcw,
  Play,
  OctagonX,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Lock,
} from 'lucide-react';
import type { Terminal as XTermType } from 'xterm';
import type { FitAddon as FitAddonType } from 'xterm-addon-fit';
import { Socket } from 'socket.io-client';

export interface SandboxReportPayload {
  session_id: string;
  target_url: string;
  module: string;
  scan_profile: string;
  status: string;
  vulnerability_detected: boolean;
  vulnerability_type: 'SQLi' | 'XSS' | 'SSRF' | 'None';
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Benign';
  cve_id: string | null;
  cwe_id: string | null;
  mitre_technique_id: string | null;
  confidence_score: number;
  evidence_payload: string | null;
  vulnerable_parameter: string | null;
  summary: string;
  raw_log?: string;
  sanitized_log?: string;
  execution_time_ms?: number;
  slm_inference_ms?: number;
  created_at?: number;
}

interface TerminalViewerProps {
  socket: Socket | null;
  isConnected: boolean;
  onReportReceived?: (report: SandboxReportPayload) => void;
  apiBaseUrl?: string;
}

const PRESET_TARGETS = [
  {
    label: 'Juice Shop SQLi Endpoint (Authorized)',
    url: 'http://juice-shop.local/rest/products/search?q=test',
    module: 'sqlmap' as const,
    profile: 'vulnerable' as const,
  },
  {
    label: 'Juice Shop DOM XSS Sink (Authorized)',
    url: 'http://juice-shop.local/#/search?q=test',
    module: 'xsstrike' as const,
    profile: 'vulnerable' as const,
  },
  {
    label: 'Juice Shop Image SSRF Endpoint (Authorized)',
    url: 'http://juice-shop.local/profile/image/url',
    module: 'ffuf' as const,
    profile: 'vulnerable' as const,
  },
  {
    label: 'DVWA Hardened Endpoint (Benign Zero-Vuln Check)',
    url: 'http://dvwa.local/secure/items?q=safe',
    module: 'sqlmap' as const,
    profile: 'benign' as const,
  },
  {
    label: 'Cloud Metadata 169.254.169.254 (Blocked by Policy Gate)',
    url: 'http://169.254.169.254/latest/meta-data/',
    module: 'ffuf' as const,
    profile: 'vulnerable' as const,
  },
];

export const TerminalViewer: React.FC<TerminalViewerProps> = ({
  socket,
  isConnected,
  onReportReceived,
  apiBaseUrl = 'http://localhost:5000',
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<XTermType | null>(null);
  const fitAddonInstance = useRef<FitAddonType | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const currentLineRef = useRef<string>('');

  const [targetUrl, setTargetUrl] = useState<string>(
    'http://juice-shop.local/rest/products/search?q=test'
  );
  const [selectedModule, setSelectedModule] = useState<'sqlmap' | 'xsstrike' | 'ffuf'>('sqlmap');
  const [scanProfile, setScanProfile] = useState<'vulnerable' | 'benign'>('vulnerable');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [policyStatus, setPolicyStatus] = useState<{
    state: 'idle' | 'authorized' | 'blocked';
    message: string;
  }>({
    state: 'idle',
    message: 'Policy Gate Ready (Authorized scopes: juice-shop.local, dvwa.local, localhost)',
  });

  useEffect(() => {
    let term: XTermType;
    let fitAddon: FitAddonType;

    const initTerminal = async () => {
      if (!terminalRef.current) return;

      const { Terminal } = await import('xterm');
      const { FitAddon } = await import('xterm-addon-fit');

      term = new Terminal({
        cursorBlink: true,
        cursorStyle: 'block',
        theme: {
          background: '#0a0d14',
          foreground: '#d1d5db',
          cursor: '#00f0ff',
          selectionBackground: '#1e293b',
          black: '#1e293b',
          red: '#ef4444',
          green: '#10b981',
          yellow: '#f59e0b',
          blue: '#3b82f6',
          magenta: '#a855f7',
          cyan: '#06b6d4',
          white: '#f3f4f6',
          brightBlack: '#4b5563',
          brightRed: '#f87171',
          brightGreen: '#34d399',
          brightYellow: '#fbbf24',
          brightBlue: '#60a5fa',
          brightMagenta: '#c084fc',
          brightCyan: '#22d3ee',
          brightWhite: '#ffffff',
        },
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 12.5,
        lineHeight: 1.25,
        convertEol: true,
        scrollback: 2000,
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();

      xtermInstance.current = term;
      fitAddonInstance.current = fitAddon;

      term.writeln('\x1b[36m[+] REDSHIELD // CYBER-CERBERUS SANDBOX CONTROLLER v1.2.0\x1b[0m');
      term.writeln(
        '\x1b[90m[+] Container Baseline: mem_limit=512m | cpu_quota=50000 | read_only=True | cap_drop=[ALL]\x1b[0m'
      );
      term.writeln(
        '\x1b[32m[+] Decoupled Authorization Policy Gate & Local SLM Evidence Parser Ready.\x1b[0m\r\n'
      );
      term.write('\x1b[31mcerberus@sandbox\x1b[0m:\x1b[34m~\x1b[0m$ ');

      term.onData((data) => {
        const code = data.charCodeAt(0);
        if (code === 13) {
          term.write('\r\n');
          const command = currentLineRef.current.trim();
          currentLineRef.current = '';

          if (command === 'clear') {
            term.clear();
            term.write('\x1b[31mcerberus@sandbox\x1b[0m:\x1b[34m~\x1b[0m$ ');
            return;
          }

          if (command.length > 0) {
            if (socket && socket.connected) {
              socket.emit('terminal_command', { command });
            } else {
              term.writeln(`\x1b[33m[local-echo] ${command}\x1b[0m`);
              term.write('\x1b[31mcerberus@sandbox\x1b[0m:\x1b[34m~\x1b[0m$ ');
            }
          } else {
            term.write('\x1b[31mcerberus@sandbox\x1b[0m:\x1b[34m~\x1b[0m$ ');
          }
        } else if (code === 127) {
          if (currentLineRef.current.length > 0) {
            currentLineRef.current = currentLineRef.current.slice(0, -1);
            term.write('\b \b');
          }
        } else if (code >= 32) {
          currentLineRef.current += data;
          term.write(data);
        }
      });
    };

    initTerminal();

    const handleResize = () => {
      if (fitAddonInstance.current) {
        fitAddonInstance.current.fit();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (xtermInstance.current) {
        xtermInstance.current.dispose();
      }
    };
  }, []);

  // Listen for interactive Socket.IO terminal output & sandbox reports
  useEffect(() => {
    if (!socket) return;

    const handleReport = (report: SandboxReportPayload) => {
      setIsRunning(false);
      if (onReportReceived) {
        onReportReceived(report);
      }
    };

    socket.on('sandbox_report', handleReport);
    return () => {
      socket.off('sandbox_report', handleReport);
    };
  }, [socket, onReportReceived]);

  const connectSessionWebSocket = (sessionId: string) => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    const wsProtocol = apiBaseUrl.startsWith('https') ? 'wss' : 'ws';
    const hostPart = apiBaseUrl.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}://${hostPart}/ws/sandbox/${sessionId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const text = typeof event.data === 'string' ? event.data : '';
      if (text.startsWith('{"type": "sandbox_report"') || text.startsWith('{"type":"sandbox_report"')) {
        try {
          const parsed = JSON.parse(text);
          if (parsed?.data && onReportReceived) {
            onReportReceived(parsed.data as SandboxReportPayload);
          }
          setIsRunning(false);
          if (xtermInstance.current) {
            xtermInstance.current.write('\x1b[31mcerberus@sandbox\x1b[0m:\x1b[34m~\x1b[0m$ ');
          }
          return;
        } catch {
          // treat as normal log line
        }
      }
      if (xtermInstance.current) {
        xtermInstance.current.write(text);
      }
    };

    ws.onclose = () => {
      setIsRunning(false);
    };
  };

  const handleLaunchScan = async () => {
    if (isRunning) return;
    if (xtermInstance.current) {
      xtermInstance.current.writeln(
        `\r\n\x1b[36m[>] Requesting Policy Gate verification for: ${targetUrl} (module: ${selectedModule})\x1b[0m`
      );
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/sandbox/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_url: targetUrl,
          module: selectedModule,
          scan_profile: scanProfile,
          timeout_seconds: 60,
        }),
      });

      if (res.status === 403) {
        const errBody = await res.json();
        const reason = errBody?.detail?.reason || 'Target blocked by Authorization Policy Gate.';
        setPolicyStatus({
          state: 'blocked',
          message: `403 Target Blocked: ${reason}`,
        });
        if (xtermInstance.current) {
          xtermInstance.current.writeln(
            `\x1b[31m[403 TARGET BLOCKED] ${reason}\x1b[0m`
          );
          xtermInstance.current.write('\x1b[31mcerberus@sandbox\x1b[0m:\x1b[34m~\x1b[0m$ ');
        }
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setActiveSessionId(data.session_id);
      setIsRunning(true);
      setPolicyStatus({
        state: 'authorized',
        message: `${data.policy_message} | Session: ${data.session_id}`,
      });

      // Connect dedicated `/ws/sandbox/{session_id}` stream
      connectSessionWebSocket(data.session_id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Backend connection error';
      setPolicyStatus({
        state: 'blocked',
        message: `Sandbox launch error: ${msg}`,
      });
      if (xtermInstance.current) {
        xtermInstance.current.writeln(`\x1b[31m[!] Failed to contact Sandbox API: ${msg}\x1b[0m`);
        xtermInstance.current.write('\x1b[31mcerberus@sandbox\x1b[0m:\x1b[34m~\x1b[0m$ ');
      }
    }
  };

  const handleKillSwitch = async () => {
    if (!activeSessionId) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send('SIGKILL');
    }
    try {
      await fetch(`${apiBaseUrl}/api/v1/sandbox/${activeSessionId}/kill`, {
        method: 'POST',
      });
    } catch {
      // ignore network error on kill fallback
    }
    setIsRunning(false);
    setPolicyStatus({
      state: 'idle',
      message: `SIGKILL sent to session ${activeSessionId}. Ephemeral container torn down.`,
    });
  };

  const handleClear = () => {
    if (xtermInstance.current) {
      xtermInstance.current.clear();
      xtermInstance.current.write('\x1b[31mcerberus@sandbox\x1b[0m:\x1b[34m~\x1b[0m$ ');
    }
  };

  const handleReset = () => {
    if (xtermInstance.current) {
      xtermInstance.current.reset();
      xtermInstance.current.writeln('\x1b[32m[+] Terminal session reset.\x1b[0m');
      xtermInstance.current.write('\x1b[31mcerberus@sandbox\x1b[0m:\x1b[34m~\x1b[0m$ ');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0d14] rounded-lg border border-border-glow/30 overflow-hidden shadow-xl">
      {/* Task 4.3: Execution Control Panel */}
      <div className="p-2.5 bg-[#101624] border-b border-border-glow/20 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Target Quick-Picker */}
          <select
            aria-label="Preset Target Scopes"
            onChange={(e) => {
              const idx = Number(e.target.value);
              const preset = PRESET_TARGETS[idx];
              if (preset) {
                setTargetUrl(preset.url);
                setSelectedModule(preset.module);
                setScanProfile(preset.profile);
              }
            }}
            className="px-2 py-1 rounded text-xs font-mono bg-[#0a0d14] text-cyan-300 border border-cyan-500/30 focus:outline-none"
          >
            {PRESET_TARGETS.map((p, idx) => (
              <option key={p.label} value={idx}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Target URL Input */}
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="Enter Target URL (verified by Policy Gate)..."
            className="flex-1 min-w-[220px] px-2.5 py-1 rounded text-xs font-mono bg-[#0a0d14] text-gray-100 border border-border-glow/30 focus:border-cyan-400 focus:outline-none"
          />

          {/* Module Selector Dropdown (SQLMap / XSStrike / FFUF) */}
          <select
            aria-label="Diagnostic Sandbox Module"
            value={selectedModule}
            onChange={(e) =>
              setSelectedModule(e.target.value as 'sqlmap' | 'xsstrike' | 'ffuf')
            }
            className="px-2.5 py-1 rounded text-xs font-mono bg-[#0a0d14] text-gray-200 border border-border-glow/30 focus:outline-none"
          >
            <option value="sqlmap">Module: SQLMap (SQLi Audit)</option>
            <option value="xsstrike">Module: XSStrike (XSS Audit)</option>
            <option value="ffuf">Module: FFUF (SSRF / Surface Audit)</option>
          </select>

          {/* Scan Profile Selector */}
          <select
            aria-label="Scan Profile"
            value={scanProfile}
            onChange={(e) => setScanProfile(e.target.value as 'vulnerable' | 'benign')}
            className="px-2 py-1 rounded text-xs font-mono bg-[#0a0d14] text-gray-300 border border-border-glow/30 focus:outline-none"
          >
            <option value="vulnerable">Profile: Vulnerable Target</option>
            <option value="benign">Profile: Hardened/Benign Target</option>
          </select>

          {/* Launch Scan Button */}
          <button
            onClick={handleLaunchScan}
            disabled={isRunning}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-semibold transition-all ${
              isRunning
                ? 'bg-emerald-900/40 text-emerald-300/60 cursor-not-allowed border border-emerald-500/20'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isRunning ? 'RUNNING SANDBOX...' : 'LAUNCH SANDBOX'}</span>
          </button>

          {/* Abort / Killswitch Button (SIGKILL) */}
          <button
            onClick={handleKillSwitch}
            disabled={!isRunning && !activeSessionId}
            title="Send SIGKILL to immediately tear down the active container"
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-semibold transition-all ${
              isRunning
                ? 'bg-red-500/25 hover:bg-red-500/40 text-red-300 border border-red-500/50 animate-pulse'
                : 'bg-red-950/30 text-red-400/50 border border-red-500/20 hover:text-red-300'
            }`}
          >
            <OctagonX className="w-3.5 h-3.5" />
            <span>KILLSWITCH (SIGKILL)</span>
          </button>
        </div>

        {/* Policy Gate & Container Hardening Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            {policyStatus.state === 'blocked' ? (
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span
              className={
                policyStatus.state === 'blocked'
                  ? 'text-red-400 font-semibold'
                  : policyStatus.state === 'authorized'
                  ? 'text-emerald-300'
                  : 'text-gray-400'
              }
            >
              {policyStatus.message}
            </span>
          </div>

          <div className="flex items-center gap-3 text-gray-400">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-cyan-400" />
              0.5 CPU / 512MB RAM
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-cyan-400" />
              read_only=True | cap_drop=ALL
            </span>
          </div>
        </div>
      </div>

      {/* Terminal Title Bar */}
      <div className="h-8 px-3 bg-[#0f141f] border-b border-border-glow/20 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-cyber-red" />
          <span className="font-mono text-xs font-semibold text-gray-200">
            SANDBOX STREAMING TERMINAL (xterm.js)
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/60 font-mono text-cyber-cyan border border-cyber-cyan/30">
            {activeSessionId ? `/ws/sandbox/${activeSessionId}` : 'WS: STANDBY'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2 text-[11px] font-mono text-cyber-muted">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              }`}
            />
            <span>{isConnected ? 'STREAM SYNCED' : 'STREAM OFFLINE'}</span>
          </div>

          <button
            onClick={handleClear}
            title="Clear Terminal Buffer"
            className="p-1 rounded text-cyber-muted hover:text-gray-200 hover:bg-cyber-bg-surface transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleReset}
            title="Reset Session"
            className="p-1 rounded text-cyber-muted hover:text-gray-200 hover:bg-cyber-bg-surface transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* xterm.js Canvas Mount */}
      <div className="flex-1 p-2 relative overflow-hidden bg-[#0a0d14]">
        <div ref={terminalRef} className="h-full w-full" />
      </div>
    </div>
  );
};
export default TerminalViewer;
