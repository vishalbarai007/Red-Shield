'use client';

import React, { useState } from 'react';
import { Search, Layers, Copy, Check, AlertCircle } from 'lucide-react';

interface TargetAsset {
  ip: string;
  hostnameOs: string;
  services: string;
  cve: string;
  cveHighlightClass: string;
  hasCopyableCve?: boolean;
  status: string;
  statusBadgeClass: string;
}

const TARGET_ASSETS: TargetAsset[] = [
  {
    ip: '192.168.1.105',
    hostnameOs: 'app-srv-01 (Ubuntu 22.04)',
    services: '80/tcp, 443/tcp, 8080/tcp',
    cve: 'CVE-2024-XXXX (RCE)',
    cveHighlightClass: 'text-cyber-red font-semibold',
    hasCopyableCve: true,
    status: 'TARGET ARMED',
    statusBadgeClass: 'bg-red-950/60 text-red-300 border-red-800/50',
  },
  {
    ip: '192.168.1.1',
    hostnameOs: 'gateway.lab (OpenWrt)',
    services: '22/tcp, 53/udp, 2222/tcp',
    cve: 'Exposed TTY Debug',
    cveHighlightClass: 'text-amber-400',
    status: 'SCOUTED',
    statusBadgeClass: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
  },
  {
    ip: '192.168.1.200',
    hostnameOs: 'db-cluster (Debian 12)',
    services: '5432/tcp (PostgreSQL)',
    cve: 'Default Auth Check',
    cveHighlightClass: 'text-gray-300',
    status: 'MAPPED',
    statusBadgeClass: 'bg-blue-950/60 text-blue-300 border-blue-800/50',
  },
];

export const TargetReconView: React.FC = () => {
  const [copyFeedback, setCopyFeedback] = useState<{
    key: string;
    state: 'copied' | 'error';
  } | null>(null);

  const handleCopyIdentifier = async (value: string, key: string) => {
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(value);
      setCopyFeedback({ key, state: 'copied' });
    } catch {
      setCopyFeedback({ key, state: 'error' });
    } finally {
      window.setTimeout(() => {
        setCopyFeedback((prev) => (prev?.key === key ? null : prev));
      }, 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 gap-4 bg-cyber-bg-surface/30">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-cyber-bg-panel border border-border-glow/30">
        <div>
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-cyber-cyan shrink-0" aria-hidden="true" />
            <h2 className="font-mono font-bold text-base text-gray-100">
              TARGET RECONNAISSANCE &amp; ATTACK SURFACE MAPPING
            </h2>
          </div>
          <p className="text-xs text-cyber-muted font-mono mt-1">
            Automated OSINT, sub-domain enumeration, port scanning, and service fingerprinting.
          </p>
        </div>

        <div className="flex items-center gap-2 select-none">
          <span className="px-2.5 py-1 rounded bg-cyber-cyan/10 text-cyber-cyan font-mono text-xs border border-cyber-cyan/30">
            RADAR: PASSIVE SCAN
          </span>
        </div>
      </div>

      {/* Target Input and Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-cyber-bg-panel border border-border-glow/30">
          <div className="text-xs font-mono text-cyber-muted uppercase">Discovered Hosts</div>
          <div className="text-2xl font-mono font-bold text-gray-100 mt-1">16</div>
          <div className="text-xs font-mono text-emerald-400 mt-0.5">● 14 Active Up</div>
        </div>

        <div className="p-3.5 rounded-lg bg-cyber-bg-panel border border-border-glow/30">
          <div className="text-xs font-mono text-cyber-muted uppercase">Open Ports</div>
          <div className="text-2xl font-mono font-bold text-gray-100 mt-1">48</div>
          <div className="text-xs font-mono text-cyber-cyan mt-0.5">SSH, HTTP, RPC, DB</div>
        </div>

        <div className="p-3.5 rounded-lg bg-cyber-bg-panel border border-border-glow/30">
          <div className="text-xs font-mono text-cyber-muted uppercase">Vulnerabilities Detected</div>
          <div className="text-2xl font-mono font-bold text-cyber-red mt-1">3 Critical</div>
          <div className="text-xs font-mono text-amber-400 mt-0.5">5 High / 8 Medium</div>
        </div>

        <div className="p-3.5 rounded-lg bg-cyber-bg-panel border border-border-glow/30">
          <div className="text-xs font-mono text-cyber-muted uppercase">Attack Path Risk Score</div>
          <div className="text-2xl font-mono font-bold text-purple-400 mt-1">8.9 / 10</div>
          <div className="text-xs font-mono text-purple-300 mt-0.5">Exploit Chaining Ready</div>
        </div>
      </div>

      {/* Recon Asset Table */}
      <div className="flex-1 rounded-lg bg-cyber-bg-panel border border-border-glow/30 p-4 flex flex-col">
        <div className="font-mono text-xs font-semibold text-gray-200 mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyber-cyan shrink-0" aria-hidden="true" />
            TARGET ASSET MATRIX
          </span>
          <span className="text-xs text-cyber-muted font-normal">
            Scope: <span className="text-gray-200">192.168.1.0/24</span> (Lab subnet)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full font-mono text-xs text-left">
            <thead>
              <tr className="border-b border-border-glow/20 text-cyber-muted text-xs select-none">
                <th scope="col" className="py-2.5 px-3">IP ADDRESS</th>
                <th scope="col" className="py-2.5 px-3">HOSTNAME / OS</th>
                <th scope="col" className="py-2.5 px-3">EXPOSED SERVICES</th>
                <th scope="col" className="py-2.5 px-3">CVE EXPOSURE</th>
                <th scope="col" className="py-2.5 px-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-glow/10">
              {TARGET_ASSETS.map((asset) => {
                const ipKey = `ip-${asset.ip}`;
                const cveKey = `cve-${asset.ip}`;
                const ipFeedback = copyFeedback?.key === ipKey ? copyFeedback.state : null;
                const cveFeedback = copyFeedback?.key === cveKey ? copyFeedback.state : null;

                return (
                  <tr key={asset.ip} className="hover:bg-cyber-bg-surface/50 transition-colors">
                    <td className="py-2.5 px-3 text-emerald-400 font-semibold">
                      <div className="inline-flex items-center gap-2">
                        <span>{asset.ip}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyIdentifier(asset.ip, ipKey)}
                          aria-label={`Copy IP address ${asset.ip}`}
                          title={`Copy IP address ${asset.ip}`}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-normal bg-cyber-bg-surface/80 hover:bg-cyber-bg-hover text-cyber-muted hover:text-gray-100 border border-border-glow/20 transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan"
                        >
                          {ipFeedback === 'copied' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : ipFeedback === 'error' ? (
                            <>
                              <AlertCircle className="w-3 h-3 text-red-400" aria-hidden="true" />
                              <span className="text-red-400">Failed</span>
                            </>
                          ) : (
                            <Copy className="w-3 h-3" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-200">{asset.hostnameOs}</td>
                    <td className="py-2.5 px-3 text-cyber-cyan">{asset.services}</td>
                    <td className={`py-2.5 px-3 ${asset.cveHighlightClass}`}>
                      <div className="inline-flex items-center gap-2">
                        <span>{asset.cve}</span>
                        {asset.hasCopyableCve && (
                          <button
                            type="button"
                            onClick={() => handleCopyIdentifier('CVE-2024-XXXX', cveKey)}
                            aria-label={`Copy CVE identifier CVE-2024-XXXX`}
                            title="Copy CVE-2024-XXXX"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-normal bg-cyber-bg-surface/80 hover:bg-cyber-bg-hover text-cyber-muted hover:text-gray-100 border border-border-glow/20 transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan"
                          >
                            {cveFeedback === 'copied' ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : cveFeedback === 'error' ? (
                              <>
                                <AlertCircle className="w-3 h-3 text-red-400" aria-hidden="true" />
                                <span className="text-red-400">Failed</span>
                              </>
                            ) : (
                              <Copy className="w-3 h-3" aria-hidden="true" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 select-none">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border ${asset.statusBadgeClass}`}
                      >
                        {asset.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Screen-reader live region for copy status announcements */}
        <div className="sr-only" role="status" aria-live="polite">
          {copyFeedback?.state === 'copied' && 'Identifier copied to clipboard.'}
          {copyFeedback?.state === 'error' && 'Failed to copy identifier to clipboard.'}
        </div>
      </div>
    </div>
  );
};

