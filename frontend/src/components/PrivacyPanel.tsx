import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Globe, Copy, Check, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { LocalVow } from '../utils/vowStorage';

interface PrivacyPanelProps {
  activeVow: LocalVow | null;
  vowCount: bigint;
  previewAddress: string;
}

export const PrivacyPanel: React.FC<PrivacyPanelProps> = ({
  activeVow,
  vowCount,
  previewAddress,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [showSecretSalt, setShowSecretSalt] = useState(false);

  const copyHash = () => {
    if (activeVow?.commitmentHex) {
      navigator.clipboard.writeText(activeVow.commitmentHex);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <section className="my-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-2xl font-bold text-white tracking-tight">Observable Privacy Center</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Side-by-side verification proving what is publicly visible vs what remains 100% confidential.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl text-xs">
          <span className="text-slate-400">Network Global Vows:</span>
          <span className="font-mono font-bold text-purple-400 text-sm">{vowCount.toString()}</span>
        </div>
      </div>

      {/* Side-by-Side Comparison Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL 1: WHAT THE CHAIN SEES (PUBLIC) */}
        <div className="glass-panel rounded-2xl p-6 border-cyan-500/20 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all"></div>
          
          <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">What The Chain Sees</h3>
                <p className="text-xs text-cyan-400/80 font-medium">Public Ledger & Explorer Data</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span>On-Chain Public</span>
            </span>
          </div>

          {activeVow ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Public Commitment Hash (disclose Key)
                </label>
                <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-300 break-all">
                  <span className="flex-1">{activeVow.commitmentHex}</span>
                  <button
                    onClick={copyHash}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all shrink-0"
                    title="Copy Commitment Hash"
                  >
                    {copiedHash ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                  <span className="text-xs text-slate-400 block mb-1">Status on Ledger</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                    activeVow.fulfilled 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {activeVow.fulfilled ? 'FULFILLED (true)' : 'COMMITTED (false)'}
                  </span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                  <span className="text-xs text-slate-400 block mb-1">Goal Content Disclosed?</span>
                  <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg inline-block">
                    NO (0 Bytes Revealed)
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={`https://preview.midnightexplorer.com/contracts/${previewAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition-all group"
                >
                  <span>Verify Commitment on Preprod Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400">
              <Globe className="w-10 h-10 mx-auto mb-2 text-slate-600 stroke-1" />
              <p className="text-sm font-medium">No active vow selected</p>
              <p className="text-xs text-slate-500 mt-1">Commit a vow below to inspect its public ledger representation.</p>
            </div>
          )}
        </div>

        {/* PANEL 2: WHAT ONLY YOU SEE (PRIVATE WITNESS) */}
        <div className="glass-panel-glow rounded-2xl p-6 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">What Only You See</h3>
                <p className="text-xs text-purple-400/80 font-medium">Private Off-Chain Client Witness Data</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              <span>Client Local Storage Only</span>
            </span>
          </div>

          {activeVow ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Secret Goal Text (witness input)
                </label>
                <div className="bg-slate-950 border border-purple-500/30 rounded-xl p-3.5 text-sm text-purple-200 font-medium shadow-inner">
                  "{activeVow.goalText}"
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Client-Generated 256-bit Salt
                  </label>
                  <button
                    onClick={() => setShowSecretSalt(!showSecretSalt)}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                  >
                    {showSecretSalt ? (
                      <><EyeOff className="w-3 h-3" /><span>Hide Salt</span></>
                    ) : (
                      <><Eye className="w-3 h-3" /><span>Show Salt</span></>
                    )}
                  </button>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-400 break-all">
                  {showSecretSalt ? activeVow.saltHex : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                </div>
              </div>

              <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-300/90 leading-relaxed">
                <p className="font-semibold text-purple-200 mb-1 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400 inline" />
                  <span>Cryptographic Guarantee:</span>
                </p>
                The goal text and salt are processed exclusively inside your browser. Compact's <code className="bg-purple-900/40 px-1 py-0.5 rounded text-purple-200 font-mono">disclose()</code> boundary exposes ONLY the hash output. The chain, indexer, and nodes never receive the goal text.
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400">
              <Lock className="w-10 h-10 mx-auto mb-2 text-slate-600 stroke-1" />
              <p className="text-sm font-medium">No private witness data active</p>
              <p className="text-xs text-slate-500 mt-1">Commit a vow below to generate client-side secrets.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
