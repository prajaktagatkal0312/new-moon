import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Globe, Copy, Check, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { EligibilityRecord } from '../utils/eligibilityStorage';

interface PrivacyPanelProps {
  activeRecord: EligibilityRecord | null;
  verificationCount: bigint;
  previewAddress: string;
}

export const PrivacyPanel: React.FC<PrivacyPanelProps> = ({
  activeRecord,
  verificationCount,
  previewAddress,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [showSecretSalt, setShowSecretSalt] = useState(false);

  const copyHash = () => {
    if (activeRecord?.commitmentHex) {
      navigator.clipboard.writeText(activeRecord.commitmentHex);
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
            <Sparkles className="w-5 h-5 text-green-400" />
            <h2 className="text-2xl font-bold text-white tracking-tight">Observable Privacy Center</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Side-by-side verification proving what is publicly visible vs what remains 100% confidential.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl text-xs">
          <span className="text-slate-400">Total Verifications:</span>
          <span className="font-mono font-bold text-green-400 text-sm">{verificationCount.toString()}</span>
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

          {activeRecord ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Public Commitment Hash (disclose Key)
                </label>
                <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-300 break-all">
                  <span className="flex-1">{activeRecord.commitmentHex}</span>
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
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ELIGIBLE (true)
                  </span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                  <span className="text-xs text-slate-400 block mb-1">Private Value Disclosed?</span>
                  <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg inline-block">
                    NO (0 Bytes Revealed)
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={"https://preview.midnightexplorer.com/contracts/" + previewAddress}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition-all group"
                >
                  <span>Verify on Preprod Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400">
              <Globe className="w-10 h-10 mx-auto mb-2 text-slate-600 stroke-1" />
              <p className="text-sm font-medium">No active verification selected</p>
              <p className="text-xs text-slate-500 mt-1">Submit a proof below to inspect its public ledger representation.</p>
            </div>
          )}
        </div>

        {/* PANEL 2: WHAT ONLY YOU SEE (PRIVATE WITNESS) */}
        <div className="glass-panel-glow rounded-2xl p-6 relative overflow-hidden group border-green-500/20 hover:border-green-500/40">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">What Only You See</h3>
                <p className="text-xs text-green-400/80 font-medium">Private Off-Chain Client Witness Data</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-300 border border-green-500/30 flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-green-400" />
              <span>Client Local Storage Only</span>
            </span>
          </div>

          {activeRecord ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Private Value (witness input)
                </label>
                <div className="bg-slate-950 border border-green-500/30 rounded-xl p-3.5 text-lg text-green-200 font-bold shadow-inner">
                  {activeRecord.privateValue}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Client-Generated 256-bit Salt
                  </label>
                  <button
                    onClick={() => setShowSecretSalt(!showSecretSalt)}
                    className="text-xs text-green-400 hover:text-green-300 flex items-center space-x-1"
                  >
                    {showSecretSalt ? (
                      <><EyeOff className="w-3 h-3" /><span>Hide Salt</span></>
                    ) : (
                      <><Eye className="w-3 h-3" /><span>Show Salt</span></>
                    )}
                  </button>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-400 break-all">
                  {showSecretSalt ? activeRecord.saltHex : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                </div>
              </div>

              <div className="bg-green-950/30 border border-green-500/20 rounded-xl p-3 text-xs text-green-300/90 leading-relaxed">
                <p className="font-semibold text-green-200 mb-1 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-green-400 inline" />
                  <span>Cryptographic Guarantee:</span>
                </p>
                The value and salt are processed exclusively inside your browser. Compact's <code className="bg-green-900/40 px-1 py-0.5 rounded text-green-200 font-mono">disclose()</code> boundary exposes ONLY the hash output. The chain, indexer, and nodes never receive your actual value. Furthermore, because a random salt is used every time, multiple verifications cannot be linked to the same person.
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400">
              <Lock className="w-10 h-10 mx-auto mb-2 text-slate-600 stroke-1" />
              <p className="text-sm font-medium">No private witness data active</p>
              <p className="text-xs text-slate-500 mt-1">Submit a proof below to generate client-side secrets.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
