'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Terminal as TerminalIcon, Trash2, RotateCcw, Maximize2, ShieldCheck } from 'lucide-react';
import type { Terminal as XTermType } from 'xterm';
import type { FitAddon as FitAddonType } from 'xterm-addon-fit';
import { Socket } from 'socket.io-client';

interface XTerminalProps {
  socket: Socket | null;
  isConnected: boolean;
}

export const XTerminal: React.FC<XTerminalProps> = ({ socket, isConnected }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<XTermType | null>(null);
  const fitAddonInstance = useRef<FitAddonType | null>(null);
  const currentLineRef = useRef<string>('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let term: XTermType;
    let fitAddon: FitAddonType;

    const initTerminal = async () => {
      if (!terminalRef.current) return;

      // Dynamic import to prevent SSR issues
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
        fontSize: 13,
        lineHeight: 1.25,
        convertEol: true,
        scrollback: 1000,
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      term.open(terminalRef.current);
      fitAddon.fit();

      xtermInstance.current = term;
      fitAddonInstance.current = fitAddon;

      // Welcome ASCII Banner
      term.writeln('\x1b[38;2;239;68;68m');
      term.writeln('  ██████╗██╗   ██╗██████╗ ███████╗██████╗     ██████╗███████╗██████╗ ');
      term.writeln(' ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗   ██╔════╝██╔════╝██╔══██╗');
      term.writeln(' ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝   ██║     █████╗  ██████╔╝');
      term.writeln(' ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗   ██║     ██╔══╝  ██╔══██╗');
      term.writeln(' ╚██████╗   ██║   ██████╔╝███████╗██║  ██║██╗╚██████╗███████╗██████╔╝');
      term.writeln('  ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝ ╚═════╝╚══════╝╚═════╝ ');
      term.writeln('\x1b[0m');
      term.writeln('\x1b[36m[+] CYBER-CERBERUS v1.0.0-alpha // MULTI-MODAL RED TEAM OPS SUITE\x1b[0m');
      term.writeln('\x1b[90m[+] Live streaming terminal container initialized (xterm.js)\x1b[0m');
      term.writeln('\x1b[32m[+] Socket.IO bridge active. Type "help" or "status" to test.\x1b[0m\r\n');
      term.write('\x1b[31mcerberus@c2\x1b[0m:\x1b[34m~\x1b[0m$ ');

      // Interactive Keystrokes
      term.onData((data) => {
        const code = data.charCodeAt(0);

        if (code === 13) {
          // Enter key
          term.write('\r\n');
          const command = currentLineRef.current.trim();
          currentLineRef.current = '';

          if (command === 'clear') {
            term.clear();
            term.write('\x1b[31mcerberus@c2\x1b[0m:\x1b[34m~\x1b[0m$ ');
            return;
          }

          if (command.length > 0) {
            if (socket && socket.connected) {
              socket.emit('terminal_command', { command });
            } else {
              term.writeln(`\x1b[33m[local-echo] ${command} (backend offline)\x1b[0m`);
              term.write('\x1b[31mcerberus@c2\x1b[0m:\x1b[34m~\x1b[0m$ ');
            }
          } else {
            term.write('\x1b[31mcerberus@c2\x1b[0m:\x1b[34m~\x1b[0m$ ');
          }
        } else if (code === 127) {
          // Backspace
          if (currentLineRef.current.length > 0) {
            currentLineRef.current = currentLineRef.current.slice(0, -1);
            term.write('\b \b');
          }
        } else if (code >= 32) {
          // Printable character
          currentLineRef.current += data;
          term.write(data);
        }
      });

      setIsReady(true);
    };

    initTerminal();

    // Auto-resize on window resize
    const handleResize = () => {
      if (fitAddonInstance.current) {
        fitAddonInstance.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (xtermInstance.current) {
        xtermInstance.current.dispose();
      }
    };
  }, []);

  // Listen for terminal output from WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleOutput = (data: { output: string }) => {
      if (xtermInstance.current && data?.output) {
        xtermInstance.current.write(data.output);
        xtermInstance.current.write('\x1b[31mcerberus@c2\x1b[0m:\x1b[34m~\x1b[0m$ ');
      }
    };

    socket.on('terminal_output', handleOutput);

    return () => {
      socket.off('terminal_output', handleOutput);
    };
  }, [socket]);

  // Refit when layout changes
  const handleClear = () => {
    if (xtermInstance.current) {
      xtermInstance.current.clear();
      xtermInstance.current.write('\x1b[31mcerberus@c2\x1b[0m:\x1b[34m~\x1b[0m$ ');
    }
  };

  const handleReset = () => {
    if (xtermInstance.current) {
      xtermInstance.current.reset();
      xtermInstance.current.writeln('\x1b[32m[+] Session reset.\x1b[0m');
      xtermInstance.current.write('\x1b[31mcerberus@c2\x1b[0m:\x1b[34m~\x1b[0m$ ');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0d14] rounded-lg border border-border-glow/30 overflow-hidden shadow-xl">
      {/* Terminal Title Bar */}
      <div className="h-9 px-3 bg-[#0f141f] border-b border-border-glow/20 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-cyber-red" />
          <span className="font-mono text-xs font-semibold text-gray-200">
            LIVE STREAMING TERMINAL
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/60 font-mono text-cyber-cyan border border-cyber-cyan/30">
            TTY: /dev/pts/0
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

      {/* Terminal Container */}
      <div className="flex-1 p-2 relative overflow-hidden bg-[#0a0d14]">
        <div ref={terminalRef} className="h-full w-full" />
      </div>
    </div>
  );
};
