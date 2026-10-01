'use client';

import React from 'react';
import { Search, Crosshair, Mic, Terminal, Database, Server, Cpu } from 'lucide-react';

export type ActiveTab = 'recon' | 'exploit' | 'voice';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'recon' as ActiveTab,
      label: 'Target Recon',
      icon: Search,
      emoji: '🔍',
      badge: 'IDLE',
      badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
      description: 'Attack Surface & OSINT',
    },
    {
      id: 'exploit' as ActiveTab,
      label: 'Exploitation Engine',
      icon: Crosshair,
      emoji: '🎯',
      badge: 'ACTIVE',
      badgeColor: 'text-red-400 bg-red-950/40 border-red-800/40',
      description: 'Shell, Payloads & Reports',
    },
    {
      id: 'voice' as ActiveTab,
      label: 'Voice Sentinel',
      icon: Mic,
      emoji: '🎙️',
      badge: 'STANDBY',
      badgeColor: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40',
      description: 'Audio Command & Control',
    },
  ];

  return (
    <aside className="w-64 border-r border-border-glow/30 bg-cyber-bg-panel/95 flex flex-col justify-between select-none shrink-0">
      {/* Top: Nav Tabs */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono tracking-widest text-cyber-muted uppercase">
          OPERATIONAL MODULES
        </div>

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full group text-left px-3 py-3 rounded-lg font-mono text-xs transition-all duration-200 relative border flex items-center justify-between ${
                isActive
                  ? 'bg-cyber-red/10 border-cyber-red/40 text-gray-100 shadow-[0_0_15px_rgba(239,68,68,0.12)]'
                  : 'border-transparent text-cyber-muted hover:text-gray-200 hover:bg-cyber-bg-surface/70 hover:border-border-glow/20'
              }`}
            >
              {/* Active Tab Accent Bar */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-cyber-red rounded-r shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              )}

              <div className="flex items-center gap-3">
                <span className="text-base select-none">{tab.emoji}</span>
                <div>
                  <div className="font-semibold tracking-wide flex items-center gap-1.5">
                    {tab.label}
                  </div>
                  <div className="text-[10px] text-cyber-muted font-normal">
                    {tab.description}
                  </div>
                </div>
              </div>

              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium border ${tab.badgeColor}`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom: Telemetry & Host Environment */}
      <div className="p-3 border-t border-border-glow/20 bg-cyber-bg-surface/40">
        <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-cyber-muted flex items-center justify-between">
          <span>HOST TELEMETRY</span>
          <span className="text-emerald-400 font-bold">ONLINE</span>
        </div>

        <div className="space-y-1.5 font-mono text-[11px] px-2 py-1">
          <div className="flex items-center justify-between text-cyber-muted">
            <span className="flex items-center gap-1.5">
              <Server className="w-3 h-3 text-cyber-cyan" /> Backend Port
            </span>
            <span className="text-gray-300 font-semibold">:5000</span>
          </div>

          <div className="flex items-center justify-between text-cyber-muted">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-cyber-red" /> Protocol
            </span>
            <span className="text-gray-300">ASGI / WSS</span>
          </div>

          <div className="flex items-center justify-between text-cyber-muted">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-purple-400" /> Mode
            </span>
            <span className="text-gray-300">Local Testing</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-border-glow/10 text-center">
          <span className="text-[10px] font-mono text-cyber-muted/60">
            CONFIDENTIAL // AUTHORIZED USE ONLY
          </span>
        </div>
      </div>
    </aside>
  );
};
