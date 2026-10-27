'use client';

import React, { useState } from 'react';
import { Mic, MicOff, Volume2, Radio, Activity, Cpu } from 'lucide-react';

export const VoiceSentinelView: React.FC = () => {
  const [isListening, setIsListening] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 gap-4 bg-cyber-bg-surface/30">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-cyber-bg-panel border border-border-glow/30">
        <div>
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-cyber-cyan shrink-0" aria-hidden="true" />
            <h2 className="font-mono font-bold text-base text-gray-100">
              VOICE SENTINEL // MULTI-MODAL AUDIO C2
            </h2>
          </div>
          <p className="text-xs text-cyber-muted font-mono mt-1">
            Real-time acoustic analysis, hotword activation (&quot;Hey Cerberus&quot;), and hands-free voice operations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsListening(!isListening)}
          aria-pressed={isListening}
          aria-label={isListening ? 'Disarm Audio Sentinel' : 'Arm Audio Sentinel'}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs font-semibold border transition-all duration-300 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan ${
            isListening
              ? 'bg-red-950/60 border-red-500 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse'
              : 'bg-cyber-bg-surface border-border-glow/30 text-gray-200 hover:bg-cyber-bg-hover hover:border-cyber-cyan/40'
          }`}
        >
          {isListening ? (
            <>
              <Mic className="w-4 h-4 text-cyber-red animate-bounce" aria-hidden="true" />
              <span>LISTENING ACTIVE</span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4 text-cyber-muted" aria-hidden="true" />
              <span>ARM AUDIO SENTINEL</span>
            </>
          )}
        </button>
      </div>

      {/* Acoustic Waveform & Audio Spectrum Simulation */}
      <div className="p-6 rounded-lg bg-cyber-bg-panel border border-border-glow/30 flex flex-col items-center justify-center">
        <div className="text-xs font-mono text-cyber-muted mb-4 flex items-center gap-2 select-none">
          <Activity className="w-4 h-4 text-cyber-cyan" aria-hidden="true" />
          <span>SPECTROGRAM &amp; HOTWORD DETECTOR</span>
        </div>

        {/* Dynamic Waveform Bars */}
        <div
          role="img"
          aria-label={
            isListening
              ? 'Audio spectrogram active and listening for voice commands'
              : 'Audio spectrogram on standby'
          }
          className="flex items-center justify-center gap-1.5 h-24 w-full max-w-xl px-4 py-2 bg-black/40 rounded-lg border border-border-glow/20 select-none"
        >
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

        <div className="mt-4 font-mono text-xs text-cyber-muted flex flex-wrap items-center justify-center gap-4">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyber-cyan" aria-hidden="true" /> Wake Word:{' '}
            <span className="text-gray-200">&quot;Hey Cerberus&quot;</span>
          </span>
          <span aria-hidden="true">|</span>
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" /> Model:{' '}
            <span className="text-gray-200">Local Whisper / VAD</span>
          </span>
        </div>
      </div>

      {/* Voice Command Activity Log */}
      <div className="flex-1 rounded-lg bg-cyber-bg-panel border border-border-glow/30 p-4">
        <div className="font-mono text-xs font-semibold text-gray-200 mb-3 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-cyber-cyan shrink-0" aria-hidden="true" />
          VOICE EVENT &amp; DISPATCH LOG
        </div>

        <div className="space-y-2 font-mono text-xs" role="log" aria-label="Voice event and dispatch log">
          <div className="p-2.5 rounded bg-black/40 border border-border-glow/15 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-cyber-muted">21:49:10</span>
              <span className="text-cyber-cyan">&quot;Hey Cerberus, scan target subnet&quot;</span>
            </div>
            <span className="text-xs font-medium text-emerald-400 select-none">DISPATCHED TO RECON</span>
          </div>

          <div className="p-2.5 rounded bg-black/40 border border-border-glow/15 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-cyber-muted">21:50:35</span>
              <span className="text-cyber-cyan">&quot;Hey Cerberus, status report&quot;</span>
            </div>
            <span className="text-xs font-medium text-purple-300 select-none">VOICE RESPONSE GENERATED</span>
          </div>

          <div className="p-2.5 rounded bg-black/40 border border-border-glow/15 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-cyber-muted">21:51:02</span>
              <span className="text-cyber-cyan">&quot;Hey Cerberus, open terminal buffer&quot;</span>
            </div>
            <span className="text-xs font-medium text-red-400 select-none">FOCUSED EXPLOITATION ENGINE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

