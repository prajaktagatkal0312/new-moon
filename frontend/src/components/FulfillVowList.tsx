import React, { useState } from 'react';
import { CheckCircle2, Circle, Loader2, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { LocalVow } from '../utils/vowStorage';

interface FulfillVowListProps {
  vows: LocalVow[];
  activeVowId: string | null;
  onSelectVow: (vow: LocalVow) => void;
  onFulfill: (vow: LocalVow) => Promise<void>;
  isConnected: boolean;
  disabled?: boolean;
}

export const FulfillVowList: React.FC<FulfillVowListProps> = ({
  vows,
  activeVowId,
  onSelectVow,
  onFulfill,
  isConnected,
  disabled,
}) => {
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFulfillClick = async (vow: LocalVow, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setFulfillingId(vow.id);
      setError(null);
      await onFulfill(vow);
    } catch (err: any) {
      setError(err?.message || 'Failed to execute fulfillVow circuit.');
    } finally {
      setFulfillingId(null);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border-slate-800">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Your Committed Vows</h3>
          <p className="text-xs text-slate-400">Circuit: <code className="text-emerald-300 font-mono">fulfillVow()</code></p>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {vows.length > 0 ? (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {vows.map((vow) => {
            const isSelected = vow.id === activeVowId;
            const isFulfilling = vow.id === fulfillingId;

            return (
              <div
                key={vow.id}
                onClick={() => onSelectVow(vow)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-950/40 border-purple-500/50 shadow-lg shadow-purple-500/10'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {vow.fulfilled ? (
                        <span className="flex items-center space-x-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Fulfilled</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                          <Circle className="w-3.5 h-3.5" />
                          <span>Unfulfilled</span>
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(vow.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm text-slate-100 font-medium line-clamp-2 mt-1">
                      "{vow.goalText}"
                    </p>

                    <p className="text-[11px] font-mono text-slate-500 mt-2 truncate">
                      Hash: {vow.commitmentHex.slice(0, 24)}...
                    </p>
                  </div>

                  {!vow.fulfilled && (
                    <button
                      onClick={(e) => handleFulfillClick(vow, e)}
                      disabled={!isConnected || isFulfilling || disabled}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
                    >
                      {isFulfilling ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Proving...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Fulfill Vow</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center text-slate-500 text-xs">
          No committed vows in your local storage yet.
        </div>
      )}
    </div>
  );
};
