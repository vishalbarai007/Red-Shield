'use client';

import React, { useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar, ActiveTab } from '@/components/layout/Sidebar';
import { ExploitationEngineView } from '@/components/views/ExploitationEngineView';
import { TargetReconView } from '@/components/views/TargetReconView';
import { VoiceSentinelView } from '@/components/views/VoiceSentinelView';

export default function CommandCenter() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('exploit');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const {
    socket,
    isConnected,
    connectionState,
    latency,
    sendPing,
  } = useSocket('http://localhost:5000');

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      {/* Top Navbar with WebSocket Status Indicator & Mobile Drawer Toggle */}
      <Navbar
        isConnected={isConnected}
        connectionState={connectionState}
        latency={latency}
        onPing={sendPing}
        activeTab={activeTab}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Main Command Center Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation (Collapsible Desktop & Mobile Drawer) */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isConnected={isConnected}
          connectionState={connectionState}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Dynamic Center Work Area — Views kept mounted to preserve terminal & editor drafts */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <section
            aria-label="Exploitation Engine Module"
            aria-hidden={activeTab !== 'exploit'}
            className={
              activeTab === 'exploit'
                ? 'flex-1 flex flex-col h-full overflow-hidden'
                : 'hidden'
            }
          >
            <ExploitationEngineView
              socket={socket}
              isConnected={isConnected}
              isActive={activeTab === 'exploit'}
            />
          </section>

          <section
            aria-label="Target Reconnaissance Module"
            aria-hidden={activeTab !== 'recon'}
            className={
              activeTab === 'recon'
                ? 'flex-1 flex flex-col h-full overflow-hidden'
                : 'hidden'
            }
          >
            <TargetReconView />
          </section>

          <section
            aria-label="Voice Sentinel Module"
            aria-hidden={activeTab !== 'voice'}
            className={
              activeTab === 'voice'
                ? 'flex-1 flex flex-col h-full overflow-hidden'
                : 'hidden'
            }
          >
            <VoiceSentinelView />
          </section>
        </main>
      </div>
    </div>
  );
}

