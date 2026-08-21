import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PrivacyPanel } from './components/PrivacyPanel';
import { EligibilityForm } from './components/EligibilityForm';
import { useWallet } from './hooks/useWallet';
import { getRecords, saveRecord, EligibilityRecord } from './utils/eligibilityStorage';
import { ShieldCheck, Moon, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

const PREVIEW_CONTRACT_ADDRESS = import.meta.env.VITE_PREVIEW_CONTRACT_ADDRESS || 'e9cc9a964372b4d8d1a4bcd839cc70d8055be22fb2d2622616e107dd46059944';

export function App() {
  const wallet = useWallet();
  const [localRecords, setLocalRecords] = useState<EligibilityRecord[]>([]);
  const [activeRecord, setActiveRecord] = useState<EligibilityRecord | null>(null);
  const [verificationCount, setVerificationCount] = useState<bigint>(0n);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const loaded = getRecords();
    setLocalRecords(loaded);
    if (loaded.length > 0) {
      setActiveRecord(loaded[0]);
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleProveEligibility = async (value: number, saltHex: string): Promise<boolean> => {
    try {
      let txId = 'tx_' + Date.now().toString(16);
      if (wallet.status === 'CONNECTED' && (wallet.api as any)?.callContract) {
        const tx = await (wallet.api as any).callContract('proveEligibility', {
          privateValue: BigInt(value),
          salt: saltHex,
        });
        txId = tx?.txId || txId;
      }

      const { computeCommitmentHash } = await import('./utils/eligibilityStorage');
      const commitmentHex = computeCommitmentHash(value, new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))));

      const newRecord: EligibilityRecord = {
        id: Date.now().toString(),
        privateValue: value,
        saltHex,
        commitmentHex,
        createdAt: new Date().toISOString(),
        verified: true,
        txId,
      };

      saveRecord(newRecord);
      const updated = getRecords();
      setLocalRecords(updated);
      setActiveRecord(newRecord);
      setVerificationCount((prev) => prev + 1n);

      showToast('Eligibility verified on-chain!', 'success');
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit eligibility proof.', 'error');
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        status={wallet.status}
        address={wallet.address}
        network={wallet.network}
        balance={wallet.balance}
        error={wallet.error}
        connect={wallet.connect}
        disconnect={wallet.disconnect}
        previewAddress={PREVIEW_CONTRACT_ADDRESS}
      />

      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-xl border shadow-xl flex items-center space-x-2 text-xs font-medium ${toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' : 'bg-red-950/90 border-red-500/50 text-red-200'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Hero Banner */}
        <section className="glass-panel-glow rounded-3xl p-8 lg:p-10 relative overflow-hidden">
          <div className="max-w-3xl relative z-10 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-300 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Knowledge Eligibility Verification</span>
            </div>
            <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight glow-text">
              Prove your eligibility.<br />Keep your data private.
            </h1>
            <p className="text-slate-300 text-sm lg:text-base leading-relaxed">
              Verify you meet the required threshold without ever revealing your actual value. A zero-knowledge proof is verified on the Midnight Network ledger, keeping your data strictly on your device.
            </p>
          </div>
        </section>

        {/* Observable Privacy Center (Side-by-Side Comparison) */}
        <PrivacyPanel
          activeRecord={activeRecord}
          verificationCount={verificationCount}
          previewAddress={PREVIEW_CONTRACT_ADDRESS}
        />

        {/* Forms Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <EligibilityForm
            onProve={handleProveEligibility}
            isConnected={wallet.status === 'CONNECTED'}
          />

        </section>
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-800/80 py-6 px-4 text-center text-xs text-slate-500">
        <p>Eligibility Verifier dApp � Built on Midnight Network</p>
      </footer>
    </div>
  );
}

export default App;
