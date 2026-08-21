import { useState } from 'react';
import { Shield, Key, FileCheck2, Loader2, Search } from 'lucide-react';

export function CredentialProofForm({ 
  onProve, 
  onIssue,
  isProving,
  isConnected 
}: { 
  onProve: (credentialStr: string) => Promise<void>;
  onIssue: (credentialStr: string) => Promise<void>;
  isProving: boolean;
  isConnected: boolean;
}) {
  const [credentialStr, setCredentialStr] = useState('');
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
      
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
          <Shield className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Confidential Credentials</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">Prove validity without disclosing content</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
            <Key className="w-4 h-4 mr-2 text-indigo-400" />
            Your Private Credential (String)
          </label>
          <div className="relative group">
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm placeholder-slate-700"
              placeholder="e.g. CERT-2026-XYZ-999"
              value={credentialStr}
              onChange={(e) => setCredentialStr(e.target.value)}
              disabled={isProving || !isConnected}
            />
          </div>
        </div>

        <div className="flex space-x-3 pt-2">
          <button
            onClick={() => onProve(credentialStr)}
            disabled={!credentialStr.trim() || isProving || !isConnected}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)] disabled:shadow-none border border-indigo-500/50 disabled:border-transparent group"
          >
            {isProving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <FileCheck2 className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Prove Valid
              </>
            )}
          </button>

          <button
            onClick={() => onIssue(credentialStr)}
            disabled={!credentialStr.trim() || isProving || !isConnected}
            className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 disabled:text-slate-500 text-white py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center border border-slate-700"
          >
            <Shield className="w-5 h-5 mr-2" />
            Issue (Demo Only)
          </button>
        </div>

        {!isConnected && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start space-x-3">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0 animate-pulse" />
            <p className="text-sm text-amber-200/80">
              Please connect your Lace wallet to interact with the Credentials contract on the Midnight Network.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
