import React, { useState } from 'react';
import { ShieldCheck, Key, Loader2, AlertCircle } from 'lucide-react';
import { generateRandomSalt, bytesToHex } from '../utils/eligibilityStorage';

interface EligibilityFormProps {
  onProve: (value: number, saltHex: string) => Promise<boolean>;
  isConnected: boolean;
  disabled?: boolean;
}

export const EligibilityForm: React.FC<EligibilityFormProps> = ({
  onProve,
  isConnected,
  disabled,
}) => {
  const [privateValue, setPrivateValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateValue.trim() || isNaN(Number(privateValue))) {
      setError('Please enter a valid numeric value.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      const salt = generateRandomSalt();
      const saltHex = bytesToHex(salt);

      const val = parseInt(privateValue, 10);
      const isEligible = await onProve(val, saltHex);
      
      setSuccess(isEligible);
      setPrivateValue('');
    } catch (err: any) {
      setError(err?.message || 'Failed to generate proof. Value may be below threshold.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border-slate-800">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Prove Eligibility</h3>
          <p className="text-xs text-slate-400">Circuit: <code className="text-green-300 font-mono">proveEligibility()</code></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
            Private Value (e.g. Age, Balance)
          </label>
          <input
            type="number"
            value={privateValue}
            onChange={(e) => setPrivateValue(e.target.value)}
            placeholder="Enter value to check against threshold (e.g. 18)..."
            disabled={!isConnected || isSubmitting || disabled}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-green-500/60 focus:ring-1 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Not eligible ?: {error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Eligible ?</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <Key className="w-3.5 h-3.5 text-green-400" />
            <span>256-bit Salt Auto-Generated</span>
          </div>

          <button
            type="submit"
            disabled={!isConnected || !privateValue.trim() || isSubmitting || disabled}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold text-xs shadow-lg shadow-green-500/20 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Generating ZK Proof...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-green-200" />
                <span>Verify & Submit</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
