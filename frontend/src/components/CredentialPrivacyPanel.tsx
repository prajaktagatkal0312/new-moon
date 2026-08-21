import { Network, Lock } from 'lucide-react';

export function CredentialPrivacyPanel() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="border-b border-slate-800 p-4 bg-slate-900/50 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center">
          <Network className="w-4 h-4 mr-2 text-slate-400" />
          Observable Privacy Center
        </h3>
      </div>
      
      <div className="grid grid-cols-2 divide-x divide-slate-800 relative">
        {/* Public Chain State */}
        <div className="p-6 bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center">
              Public Ledger State
            </h4>
            <span className="text-[10px] font-bold px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full uppercase tracking-wide border border-emerald-500/20">
              Visible to all
            </span>
          </div>
          
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3 bg-slate-950 rounded border border-slate-800 shadow-inner">
              <span className="text-slate-500 block mb-1">validCredentials[Hash]</span>
              <span className="text-emerald-300">true / false</span>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800 shadow-inner">
              <span className="text-slate-500 block mb-1">verifiedProofs[Nullifier]</span>
              <span className="text-emerald-300">true</span>
            </div>
          </div>
          
          <p className="text-xs text-slate-400 mt-4 leading-relaxed font-medium">
            The blockchain only records cryptographic commitments and nullifiers. The actual credential text is completely invisible to the chain and indexer.
          </p>
        </div>

        {/* Private Local State */}
        <div className="p-6 bg-slate-950 relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-900/5 pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative">
            <h4 className="text-sm font-bold text-indigo-400 flex items-center">
              <Lock className="w-4 h-4 mr-1.5" />
              Private Witness
            </h4>
            <span className="text-[10px] font-bold px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-full uppercase tracking-wide border border-indigo-500/20">
              Local only
            </span>
          </div>

          <div className="space-y-4 font-mono text-xs relative">
            <div className="p-3 bg-slate-900 rounded border border-indigo-500/20 shadow-inner shadow-indigo-500/5">
              <span className="text-indigo-400 block mb-1">credential()</span>
              <span className="text-slate-300 break-all">"CERT-2026-XYZ-999"</span>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-indigo-500/20 shadow-inner shadow-indigo-500/5">
              <span className="text-indigo-400 block mb-1">credentialSalt() / nullifierSalt()</span>
              <span className="text-slate-500 italic">Local 256-bit randomness</span>
            </div>
          </div>
          
          <p className="text-xs text-slate-400 mt-4 leading-relaxed relative">
            These values never leave your browser. The ZK circuit computes the proof locally and only sends the resulting nullifier and boolean status to the network.
          </p>
        </div>
      </div>
    </div>
  );
}
