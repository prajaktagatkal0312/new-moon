import React, { useState } from 'react';
import { PlusCircle, Key, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { generateRandomSalt, bytesToHex, computeCommitmentHash, LocalVow } from '../utils/vowStorage';

interface CommitVowFormProps {
  onCommit: (vow: LocalVow) => Promise<void>;
  isConnected: boolean;
  disabled?: boolean;
}

export const CommitVowForm: React.FC<CommitVowFormProps> = ({
  onCommit,
  isConnected,
  disabled,
}) => {
  const [goalText, setGoalText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalText.trim()) {
      setError('Please enter a goal text.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const salt = generateRandomSalt();
      const saltHex = bytesToHex(salt);
      const commitmentHex = await computeCommitmentHash(goalText.trim(), salt);

      const newVow: LocalVow = {
        id: Date.now().toString(),
        goalText: goalText.trim(),
        saltHex,
        commitmentHex,
        createdAt: new Date().toISOString(),
        fulfilled: false,
      };

      await onCommit(newVow);
      setGoalText('');
    } catch (err: any) {
      setError(err?.message || 'Failed to submit commitVow circuit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border-slate-800">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
          <PlusCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Commit a New Vow</h3>
          <p className="text-xs text-slate-400">Circuit: <code className="text-purple-300 font-mono">commitVow()</code></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
            Secret Goal / Vow Text
          </label>
          <textarea
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            placeholder="e.g. Run a 10k marathon by November..."
            rows={3}
            disabled={!isConnected || isSubmitting || disabled}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <Key className="w-3.5 h-3.5 text-purple-400" />
            <span>256-bit Salt Auto-Generated</span>
          </div>

          <button
            type="submit"
            disabled={!isConnected || !goalText.trim() || isSubmitting || disabled}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-500/20 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Generating ZK Proof...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Commit Vow to Chain</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
