'use client';

import React from 'react';
import { ShieldAlert, Activity, Wifi, WifiOff, RefreshCw, Radio } from 'lucide-react';
import { ConnectionState } from '@/hooks/useSocket';

interface NavbarProps {
  isConnected: boolean;
  connectionState: ConnectionState;
  latency: number | null;
  onPing: () => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  isConnected,
  connectionState,
  latency,
  onPing,
  activeTab,
}) => {
  return (
    <header className="h-14 border-b border-border-glow/30 bg-cyber-bg-panel/90 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Brand & Suite ID */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyber-red/10 border border-cyber-red/30 shadow-[0_0_15px_rgba(239,68,68,0.25)]">
          <ShieldAlert className="w-4 h-4 text-cyber-red animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyber-red animate-ping" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold tracking-wider text-sm text-foreground flex items-center gap-1.5">
              CYBER<span className="text-cyber-red font-black">CERBERUS</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-red-950/60 text-red-400 border border-red-800/40">
              v1.0-ALPHA
            </span>
          </div>
          <div className="text-[10px] text-cyber-muted font-mono tracking-wide">
            RED TEAM OPERATIONS SUITE
          </div>
        </div>
      </div>

      {/* Center Operational Scope Status */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-bg-surface/80 border border-border-glow/30 font-mono text-xs">
        <span className="flex items-center gap-1 text-cyber-cyan">
          <Radio className="w-3 h-3 animate-spin text-cyber-cyan" style={{ animationDuration: '4s' }} />
          MODULE:
        </span>
        <span className="text-gray-200 uppercase font-semibold">
          {activeTab === 'exploit' && '🎯 Exploitation Engine'}
          {activeTab === 'recon' && '🔍 Target Reconnaissance'}
          {activeTab === 'voice' && '🎙️ Voice Sentinel'}
        </span>
        <span className="text-cyber-muted/60">|</span>
        <span className="text-cyber-muted text-[11px]">
          SCOPE: <span className="text-emerald-400">127.0.0.1 (LOCAL TESTBED)</span>
        </span>
      </div>

      {/* Right: Connection Bridge Indicator & Diagnostics */}
      <div className="flex items-center gap-3">
        {/* WebSocket Status Indicator */}
        <div
          className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono border transition-all duration-300 ${
            isConnected
              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : connectionState === 'connecting'
              ? 'bg-amber-950/50 text-amber-300 border-amber-500/40 animate-pulse'
              : 'bg-red-950/50 text-red-300 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
          }`}
        >
          {isConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold tracking-wide">🟢 Connected</span>
              {latency !== null && (
                <span className="text-[10px] text-emerald-400/80 font-mono ml-0.5">
                  ({latency}ms)
                </span>
              )}
            </>
          ) : connectionState === 'connecting' ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-red-400" />
              <span className="font-semibold tracking-wide">🔴 Disconnected</span>
            </>
          )}
        </div>

        {/* Manual Ping Action */}
        <button
          onClick={onPing}
          title="Send WebSocket Ping"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-cyber-bg-surface hover:bg-cyber-bg-hover text-cyber-muted hover:text-gray-200 border border-border-glow/30 hover:border-cyber-cyan/40 transition-colors"
        >
          <Activity className="w-3.5 h-3.5 text-cyber-cyan" />
          <span className="hidden sm:inline">Ping</span>
        </button>
      </div>
    </header>
  );
};
