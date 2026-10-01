'use client';

import React from 'react';
import { Search, Globe, Shield, AlertTriangle, Layers, Crosshair } from 'lucide-react';

export const TargetReconView: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 gap-4 bg-cyber-bg-surface/30">
      {/* Header Banner */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-cyber-bg-panel border border-border-glow/30">
        <div>
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-cyber-cyan" />
            <h2 className="font-mono font-bold text-base text-gray-100">
              TARGET RECONNAISSANCE & ATTACK SURFACE MAPPING
            </h2>
          </div>
          <p className="text-xs text-cyber-muted font-mono mt-1">
            Automated OSINT, sub-domain enumeration, port scanning, and service fingerprinting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-cyber-cyan/10 text-cyber-cyan font-mono text-xs border border-cyber-cyan/30">
            RADAR: PASSIVE SCAN
          </span>
        </div>
      </div>

      {/* Target Input and Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-cyber-bg-panel border border-border-glow/30">
          <div className="text-[10px] font-mono text-cyber-muted uppercase">Discovered Hosts</div>
          <div className="text-2xl font-mono font-bold text-gray-100 mt-1">16</div>
          <div className="text-[11px] font-mono text-emerald-400 mt-0.5">● 14 Active Up</div>
        </div>

        <div className="p-3.5 rounded-lg bg-cyber-bg-panel border border-border-glow/30">
          <div className="text-[10px] font-mono text-cyber-muted uppercase">Open Ports</div>
          <div className="text-2xl font-mono font-bold text-gray-100 mt-1">48</div>
          <div className="text-[11px] font-mono text-cyber-cyan mt-0.5">SSH, HTTP, RPC, DB</div>
        </div>

        <div className="p-3.5 rounded-lg bg-cyber-bg-panel border border-border-glow/30">
          <div className="text-[10px] font-mono text-cyber-muted uppercase">Vulnerabilities Detected</div>
          <div className="text-2xl font-mono font-bold text-cyber-red mt-1">3 Critical</div>
          <div className="text-[11px] font-mono text-amber-400 mt-0.5">5 High / 8 Medium</div>
        </div>

        <div className="p-3.5 rounded-lg bg-cyber-bg-panel border border-border-glow/30">
          <div className="text-[10px] font-mono text-cyber-muted uppercase">Attack Path Risk Score</div>
          <div className="text-2xl font-mono font-bold text-purple-400 mt-1">8.9 / 10</div>
          <div className="text-[11px] font-mono text-purple-400/80 mt-0.5">Exploit Chaining Ready</div>
        </div>
      </div>

      {/* Recon Asset Table */}
      <div className="flex-1 rounded-lg bg-cyber-bg-panel border border-border-glow/30 p-4 flex flex-col">
        <div className="font-mono text-xs font-semibold text-gray-200 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyber-cyan" />
            TARGET ASSET MATRIX
          </span>
          <span className="text-[11px] text-cyber-muted font-normal">
            Scope: 192.168.1.0/24 (Lab subnet)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full font-mono text-xs text-left">
            <thead>
              <tr className="border-b border-border-glow/20 text-cyber-muted text-[11px]">
                <th className="py-2 px-3">IP ADDRESS</th>
                <th className="py-2 px-3">HOSTNAME / OS</th>
                <th className="py-2 px-3">EXPOSED SERVICES</th>
                <th className="py-2 px-3">CVE EXPOSURE</th>
                <th className="py-2 px-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-glow/10">
              <tr className="hover:bg-cyber-bg-surface/50">
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">192.168.1.105</td>
                <td className="py-2.5 px-3 text-gray-300">app-srv-01 (Ubuntu 22.04)</td>
                <td className="py-2.5 px-3 text-cyber-cyan">80/tcp, 443/tcp, 8080/tcp</td>
                <td className="py-2.5 px-3 text-cyber-red font-semibold">CVE-2024-XXXX (RCE)</td>
                <td className="py-2.5 px-3">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-950/60 text-red-400 border border-red-800/40">
                    TARGET ARMED
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-cyber-bg-surface/50">
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">192.168.1.1</td>
                <td className="py-2.5 px-3 text-gray-300">gateway.lab (OpenWrt)</td>
                <td className="py-2.5 px-3 text-cyber-cyan">22/tcp, 53/udp, 2222/tcp</td>
                <td className="py-2.5 px-3 text-amber-400">Exposed TTY Debug</td>
                <td className="py-2.5 px-3">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950/60 text-amber-400 border border-amber-800/40">
                    SCOUTED
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-cyber-bg-surface/50">
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">192.168.1.200</td>
                <td className="py-2.5 px-3 text-gray-300">db-cluster (Debian 12)</td>
                <td className="py-2.5 px-3 text-cyber-cyan">5432/tcp (PostgreSQL)</td>
                <td className="py-2.5 px-3 text-gray-400">Default Auth Check</td>
                <td className="py-2.5 px-3">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-950/60 text-blue-400 border border-blue-800/40">
                    MAPPED
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
