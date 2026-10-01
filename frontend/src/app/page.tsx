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
  const {
    socket,
    isConnected,
    connectionState,
    latency,
    sendPing,
  } = useSocket('http://localhost:5000');

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      {/* Top Navbar with WebSocket Status Indicator */}
      <Navbar
        isConnected={isConnected}
        connectionState={connectionState}
        latency={latency}
        onPing={sendPing}
        activeTab={activeTab}
      />

      {/* Main Command Center Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Dynamic Center Work Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'exploit' && (
            <ExploitationEngineView socket={socket} isConnected={isConnected} />
          )}

          {activeTab === 'recon' && <TargetReconView />}

          {activeTab === 'voice' && <VoiceSentinelView />}
        </main>
      </div>
    </div>
  );
}
