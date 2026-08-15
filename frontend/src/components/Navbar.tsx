import React from 'react';
import { Shield, Wallet, ExternalLink, LogOut, CheckCircle2, AlertTriangle, Moon } from 'lucide-react';
import { WalletStatus } from '../hooks/useWallet';

interface NavbarProps {
  status: WalletStatus;
  address: string | null;
  network: string | null;
  balance: string | null;
  error?: string | null;
  connect: () => void;
  disconnect: () => void;
  preprodAddress: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  status,
  address,
  network,
  balance,
  error,
  connect,
  disconnect,
  preprodAddress,
}) => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Moon className="w-5 h-5 text-purple-400 fill-purple-400/20" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-xl tracking-tight text-white glow-text">MoonVow</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Midnight Preprod
              </span>
            </div>
            <p className="text-xs text-slate-400">Zero-Knowledge Commitment Protocol</p>
          </div>
        </div>

        {/* Contract Info Pill & Wallet Controls */}
        <div className="flex items-center flex-wrap space-x-3">
          {/* Preprod Contract Explorer Link */}
          <a
            href={`https://explorer.preprod.midnight.network/contract/${preprodAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-mono transition-all"
            title="View Preprod Contract on Midnight Explorer"
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Contract: {preprodAddress.slice(0, 8)}...{preprodAddress.slice(-6)}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* Wallet State Pill */}
          {status === 'CONNECTED' ? (
            <div className="flex items-center space-x-2">
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-center space-x-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-mono text-emerald-300">
                  {address ? `${address.slice(0, 10)}...${address.slice(-6)}` : 'Connected'}
                </span>
                {balance && (
                  <span className="hidden md:inline text-slate-400 pl-2 border-l border-slate-800 font-mono">
                    {balance}
                  </span>
                )}
              </div>
              <button
                onClick={disconnect}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 transition-all"
                title="Disconnect Wallet"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : status === 'CONNECTING' ? (
            <button disabled className="px-4 py-2 rounded-xl bg-purple-600/50 text-white font-medium text-xs flex items-center space-x-2 cursor-not-allowed">
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Connecting Lace...</span>
            </button>
          ) : status === 'WRONG_NETWORK' ? (
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Switch Lace to Preprod</span>
              </div>
              <button
                onClick={connect}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all"
              >
                Retry
              </button>
            </div>
          ) : status === 'NOT_INSTALLED' ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Lace wallet not detected</span>
              <a
                href="https://chromewebstore.google.com/detail/lace-beta/mnjkhhicfjjnhcfdhlgbpabmkgmkkikb"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all flex items-center space-x-1"
              >
                <span>Install Lace Beta</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : status === 'ERROR' ? (
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-1.5 max-w-[250px]" title={error || 'Connection error'}>
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="truncate">{error || 'Connection failed'}</span>
              </div>
              <button
                onClick={connect}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shrink-0"
              >
                Retry
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-500/25 flex items-center space-x-2 transition-all active:scale-95"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect Lace Wallet</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
