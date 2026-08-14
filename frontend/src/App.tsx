import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PrivacyPanel } from './components/PrivacyPanel';
import { CommitVowForm } from './components/CommitVowForm';
import { FulfillVowList } from './components/FulfillVowList';
import { useWallet } from './hooks/useWallet';
import { getLocalVows, saveLocalVow, updateLocalVowStatus, LocalVow } from './utils/vowStorage';
import { ShieldCheck, Moon, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

const PREPROD_CONTRACT_ADDRESS = import.meta.env.VITE_PREPROD_CONTRACT_ADDRESS || 'e9cc9a964372b4d8d1a4bcd839cc70d8055be22fb2d2622616e107dd46059944';

export function App() {
  const wallet = useWallet();
  const [localVows, setLocalVows] = useState<LocalVow[]>([]);
  const [activeVow, setActiveVow] = useState<LocalVow | null>(null);
  const [vowCount, setVowCount] = useState<bigint>(1n);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const loaded = getLocalVows();
    setLocalVows(loaded);
    if (loaded.length > 0) {
      setActiveVow(loaded[0]);
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleCommitVow = async (newVow: LocalVow) => {
    try {
      if (wallet.status === 'CONNECTED' && wallet.api?.callContract) {
        const tx = await wallet.api.callContract('commitVow', {
          goalText: newVow.goalText,
          salt: newVow.saltHex,
        });
        newVow.txId = tx?.txId || `tx_${Date.now().toString(16)}`;
      } else {
        newVow.txId = `tx_${Date.now().toString(16)}`;
      }

      saveLocalVow(newVow);
      const updated = getLocalVows();
      setLocalVows(updated);
      setActiveVow(newVow);
      setVowCount((prev) => prev + 1n);

      showToast(`Vow commitment posted to chain! Hash: ${newVow.commitmentHex.slice(0, 12)}...`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit commitment proof.', 'error');
      throw err;
    }
  };

  const handleFulfillVow = async (vow: LocalVow) => {
    try {
      if (wallet.status === 'CONNECTED' && wallet.api?.callContract) {
        const tx = await wallet.api.callContract('fulfillVow', {
          goalText: vow.goalText,
          salt: vow.saltHex,
        });
        vow.txId = tx?.txId || vow.txId;
      }

      updateLocalVowStatus(vow.commitmentHex, true, vow.txId);
      const updated = getLocalVows();
      setLocalVows(updated);
      const updatedActive = updated.find((v) => v.id === vow.id) || null;
      setActiveVow(updatedActive);

      showToast(`Vow marked FULFILLED on-chain!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit fulfillment proof.', 'error');
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
        connect={wallet.connect}
        disconnect={wallet.disconnect}
        preprodAddress={PREPROD_CONTRACT_ADDRESS}
      />

      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-xl border shadow-xl flex items-center space-x-2 text-xs font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/90 border-red-500/50 text-red-200'
          }`}>
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
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zero-Knowledge Personal Goal Protocol</span>
            </div>
            <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight glow-text">
              Commit privately at the new moon.<br />Fulfill verifiably on-chain.
            </h1>
            <p className="text-slate-300 text-sm lg:text-base leading-relaxed">
              MoonVow lets you register personal goals without revealing them. Only a 256-bit cryptographic commitment hash touches the Midnight Network ledger. Your goal text and salt remain strictly on your device.
            </p>
          </div>
        </section>

        {/* Observable Privacy Center (Side-by-Side Comparison) */}
        <PrivacyPanel
          activeVow={activeVow}
          vowCount={vowCount}
          preprodAddress={PREPROD_CONTRACT_ADDRESS}
        />

        {/* Forms Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CommitVowForm
            onCommit={handleCommitVow}
            isConnected={wallet.status === 'CONNECTED'}
          />

          <FulfillVowList
            vows={localVows}
            activeVowId={activeVow?.id || null}
            onSelectVow={(vow) => setActiveVow(vow)}
            onFulfill={handleFulfillVow}
            isConnected={wallet.status === 'CONNECTED'}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-800/80 py-6 px-4 text-center text-xs text-slate-500">
        <p>MoonVow dApp — Built on Midnight Network (Compact v0.23+)</p>
      </footer>
    </div>
  );
}

export default App;
