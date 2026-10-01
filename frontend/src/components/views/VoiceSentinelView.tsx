'use client';

import React, { useState } from 'react';
import { Mic, MicOff, Volume2, Radio, Activity, Cpu } from 'lucide-react';

export const VoiceSentinelView: React.FC = () => {
  const [isListening, setIsListening] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 gap-4 bg-cyber-bg-surface/30">
      {/* Header Banner */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-cyber-bg-panel border border-border-glow/30">
        <div>
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-cyber-cyan" />
            <h2 className="font-mono font-bold text-base text-gray-100">
              VOICE SENTINEL // MULTI-MODAL AUDIO C2
            </h2>
          </div>
          <p className="text-xs text-cyber-muted font-mono mt-1">
            Real-time acoustic analysis, hotword activation (&quot;Hey Cerberus&quot;), and hands-free voice operations.
          </p>
        </div>

        <button
          onClick={() => setIsListening(!isListening)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border transition-all duration-300 ${
            isListening
              ? 'bg-red-950/60 border-red-500 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse'
              : 'bg-cyber-bg-surface border-border-glow/30 text-cyber-muted hover:text-gray-200'
          }`}
        >
          {isListening ? (
            <>
              <Mic className="w-4 h-4 text-cyber-red animate-bounce" />
              <span>LISTENING ACTIVE</span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4 text-cyber-muted" />
              <span>ARM AUDIO SENTINEL</span>
            </>
          )}
        </button>
      </div>

      {/* Acoustic Waveform & Audio Spectrum Simulation */}
      <div className="p-6 rounded-lg bg-cyber-bg-panel border border-border-glow/30 flex flex-col items-center justify-center">
        <div className="text-xs font-mono text-cyber-muted mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyber-cyan" />
          <span>SPECTROGRAM & HOTWORD DETECTOR</span>
        </div>

        {/* Dynamic Waveform Bars */}
        <div className="flex items-center justify-center gap-1.5 h-24 w-full max-w-xl px-4 py-2 bg-black/40 rounded-lg border border-border-glow/20">
          {[40, 65, 30, 85, 95, 45, 20, 60, 75, 90, 100, 80, 50, 30, 65, 85, 40, 25, 70, 90, 60, 35, 80, 50].map(
            (height, idx) => (
              <div
                key={idx}
                className={`w-2.5 rounded-full transition-all duration-150 ${
                  isListening
                    ? 'bg-cyber-red shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse'
                    : 'bg-cyber-cyan/30'
                }`}
                style={{
                  height: isListening ? `${height}%` : '15%',
                  animationDelay: `${idx * 50}ms`,
                }}
              />
            )
          )}
        </div>

        <div className="mt-4 font-mono text-xs text-cyber-muted flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-cyber-cyan" /> Wake Word: &quot;Hey Cerberus&quot;
          </span>
          <span>|</span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-purple-400" /> Model: Local Whisper / VAD
          </span>
        </div>
      </div>

      {/* Voice Command Activity Log */}
      <div className="flex-1 rounded-lg bg-cyber-bg-panel border border-border-glow/30 p-4">
        <div className="font-mono text-xs font-semibold text-gray-200 mb-3 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-cyber-cyan" />
          VOICE EVENT & DISPATCH LOG
        </div>

        <div className="space-y-2 font-mono text-xs">
          <div className="p-2.5 rounded bg-black/40 border border-border-glow/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-cyber-muted">21:49:10</span>
              <span className="text-cyber-cyan">&quot;Hey Cerberus, scan target subnet&quot;</span>
            </div>
            <span className="text-[10px] text-emerald-400">DISPATCHED TO RECON</span>
          </div>

          <div className="p-2.5 rounded bg-black/40 border border-border-glow/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-cyber-muted">21:50:35</span>
              <span className="text-cyber-cyan">&quot;Hey Cerberus, status report&quot;</span>
            </div>
            <span className="text-[10px] text-purple-400">VOICE RESPONSE GENERATED</span>
          </div>

          <div className="p-2.5 rounded bg-black/40 border border-border-glow/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-cyber-muted">21:51:02</span>
              <span className="text-cyber-cyan">&quot;Hey Cerberus, open terminal buffer&quot;</span>
            </div>
            <span className="text-[10px] text-red-400">FOCUSED EXPLOITATION ENGINE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
