'use client';

import React from 'react';
import {
  Search,
  Crosshair,
  Mic,
  Terminal,
  Server,
  Cpu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { ConnectionState } from '@/hooks/useSocket';

export type ActiveTab = 'recon' | 'exploit' | 'voice';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isConnected?: boolean;
  connectionState?: ConnectionState;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isConnected = false,
  connectionState = 'disconnected',
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const tabs = [
    {
      id: 'recon' as ActiveTab,
      label: 'Target Recon',
      icon: Search,
      emoji: '🔍',
      badge: 'IDLE',
      badgeColor: 'text-amber-300 bg-amber-950/50 border-amber-800/50',
      description: 'Attack Surface & OSINT',
    },
    {
      id: 'exploit' as ActiveTab,
      label: 'Exploitation Engine',
      icon: Crosshair,
      emoji: '🎯',
      badge: 'ACTIVE',
      badgeColor: 'text-red-300 bg-red-950/50 border-red-800/50',
      description: 'Shell, Payloads & Reports',
    },
    {
      id: 'voice' as ActiveTab,
      label: 'Voice Sentinel',
      icon: Mic,
      emoji: '🎙️',
      badge: 'STANDBY',
      badgeColor: 'text-cyan-300 bg-cyan-950/50 border-cyan-800/50',
      description: 'Audio Command & Control',
    },
  ];

  const handleSelectTab = (tabId: ActiveTab) => {
    onTabChange(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderSidebarContent = (collapsedView: boolean) => (
    <>
      {/* Top: Nav Tabs & Collapse Control */}
      <div className="p-3 space-y-1.5">
        <div
          className={`flex items-center ${
            collapsedView ? 'justify-center px-1' : 'justify-between px-2'
          } py-1.5`}
        >
          {!collapsedView && (
            <span className="text-[11px] font-mono tracking-widest text-cyber-muted uppercase">
              OPERATIONAL MODULES
            </span>
          )}

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsedView ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsedView ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className="hidden md:inline-flex items-center justify-center p-1.5 rounded-md text-cyber-muted hover:text-gray-100 hover:bg-cyber-bg-surface/80 border border-transparent hover:border-border-glow/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan"
            >
              {collapsedView ? (
                <PanelLeftOpen className="w-4 h-4 text-cyber-cyan" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-cyber-cyan" aria-hidden="true" />
              )}
            </button>
          )}

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation drawer"
              className="md:hidden inline-flex items-center justify-center p-1.5 rounded-md text-cyber-muted hover:text-gray-100 hover:bg-cyber-bg-surface/80 border border-border-glow/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan"
            >
              <X className="w-4 h-4 text-cyber-cyan" aria-hidden="true" />
            </button>
          )}
        </div>

        <nav aria-label="Operational Modules" className="space-y-1.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${tab.label} — ${tab.description} (${tab.badge})`}
                title={collapsedView ? `${tab.label} (${tab.badge})` : undefined}
                className={`w-full group text-left ${
                  collapsedView ? 'px-2 py-3 justify-center' : 'px-3 py-3 justify-between'
                } rounded-lg font-mono text-xs transition-all duration-200 relative border flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan ${
                  isActive
                    ? 'bg-cyber-red/10 border-cyber-red/40 text-gray-100 shadow-[0_0_15px_rgba(239,68,68,0.12)]'
                    : 'border-transparent text-cyber-muted hover:text-gray-100 hover:bg-cyber-bg-surface/70 hover:border-border-glow/20'
                }`}
              >
                {/* Active Tab Accent Bar */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-cyber-red rounded-r shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                    aria-hidden="true"
                  />
                )}

                <div className={`flex items-center ${collapsedView ? 'justify-center' : 'gap-3'}`}>
                  <span className="text-base select-none" aria-hidden="true">
                    {tab.emoji}
                  </span>
                  {!collapsedView && (
                    <div>
                      <div className="font-semibold tracking-wide flex items-center gap-1.5 text-gray-100">
                        {tab.label}
                      </div>
                      <div className="text-[11px] text-cyber-muted font-normal">
                        {tab.description}
                      </div>
                    </div>
                  )}
                </div>

                {!collapsedView && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium border ${tab.badgeColor}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Telemetry & Host Environment */}
      <div className="p-3 border-t border-border-glow/20 bg-cyber-bg-surface/40">
        {collapsedView ? (
          <div
            className="flex flex-col items-center gap-2 py-1"
            title={`Host Telemetry: ${
              isConnected ? 'ONLINE' : connectionState === 'connecting' ? 'CONNECTING' : 'OFFLINE'
            } (Port :5000)`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : connectionState === 'connecting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
              }`}
              aria-hidden="true"
            />
            <span className="text-[10px] font-mono font-bold tracking-tight text-gray-300">
              {isConnected ? 'ON' : connectionState === 'connecting' ? '...' : 'OFF'}
            </span>
          </div>
        ) : (
          <>
            <div className="px-2 py-1.5 text-[11px] font-mono uppercase tracking-wider text-cyber-muted flex items-center justify-between">
              <span>HOST TELEMETRY</span>
              {isConnected ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                  ONLINE
                </span>
              ) : connectionState === 'connecting' ? (
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
                    aria-hidden="true"
                  />
                  CONNECTING
                </span>
              ) : (
                <span className="text-red-400 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden="true" />
                  OFFLINE
                </span>
              )}
            </div>

            <div className="space-y-1.5 font-mono text-xs px-2 py-1">
              <div className="flex items-center justify-between text-cyber-muted">
                <span className="flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-cyber-cyan" aria-hidden="true" /> Backend Port
                </span>
                <span className="text-gray-200 font-semibold select-text">:5000</span>
              </div>

              <div className="flex items-center justify-between text-cyber-muted">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyber-red" aria-hidden="true" /> Protocol
                </span>
                <span className="text-gray-200">ASGI / WSS</span>
              </div>

              <div className="flex items-center justify-between text-cyber-muted">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" /> Mode
                </span>
                <span className="text-gray-200">Local Testing</span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-border-glow/10 text-center">
              <span className="text-[11px] font-mono text-cyber-muted">
                CONFIDENTIAL // AUTHORIZED USE ONLY
              </span>
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <aside
        id="command-center-sidebar"
        aria-label="Command Center Sidebar"
        className={`hidden md:flex ${
          isCollapsed ? 'w-16' : 'w-64'
        } border-r border-border-glow/30 bg-cyber-bg-panel/95 flex-col justify-between select-none shrink-0 transition-[width] duration-200 ease-in-out`}
      >
        {renderSidebarContent(isCollapsed)}
      </aside>

      {/* Mobile Navigation Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden" role="dialog" aria-modal="true" aria-label="Navigation Drawer">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Slide-over Panel */}
          <aside className="relative z-50 w-64 max-w-[80vw] h-full border-r border-border-glow/30 bg-cyber-bg-panel flex flex-col justify-between select-none shadow-2xl">
            {renderSidebarContent(false)}
          </aside>
        </div>
      )}
    </>
  );
};

