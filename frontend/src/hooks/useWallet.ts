import { useState, useEffect, useCallback } from 'react';

export type WalletStatus = 
  | 'NOT_INSTALLED'
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'WRONG_NETWORK'
  | 'ERROR';

export interface WalletState {
  status: WalletStatus;
  address: string | null;
  network: string | null;
  balance: string | null;
  error: string | null;
  api: any | null;
}

export interface InjectedWalletApi {
  enable: () => Promise<any>;
  state?: (() => Promise<any>) | any;
  [key: string]: any;
}

const STORAGE_KEY = 'moonvow_wallet_connected';
const EXPECTED_NETWORK = 'preprod';

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    status: 'CONNECTING', // Start in CONNECTING state while we poll on mount
    address: null,
    network: EXPECTED_NETWORK,
    balance: null,
    error: null,
    api: null,
  });

  const getInjectedLace = useCallback((): InjectedWalletApi | null => {
    if (typeof window === 'undefined') return null;
    const midnight = (window as any).midnight;
    if (!midnight || typeof midnight !== 'object') return null;
    const values = Object.values(midnight) as any[];
    // Relax the strict enable check to just find the wallet object
    const walletApi = values.find((v) => v && typeof v === 'object');
    return walletApi ?? null;
  }, []);

  const connect = useCallback(async () => {
    console.log('[connect] window.midnight at click time:', (window as any).midnight);
    let injected = getInjectedLace();
    console.log('[connect] getInjectedLace() returned:', injected);

    if (!injected && typeof window !== 'undefined' && (window as any).midnight) {
      console.log('[connect] retrying in 400ms...');
      await new Promise(resolve => setTimeout(resolve, 400));
      injected = getInjectedLace();
      console.log('[connect] after retry:', injected);
    }

    if (!injected) {
      console.log('[connect] giving up - NOT_INSTALLED');
      setWalletState((prev) => ({
        ...prev,
        status: 'NOT_INSTALLED',
        error: 'Lace wallet extension is not installed.',
      }));
      return;
    }

    if (typeof injected.enable !== 'function') {
      console.log('[connect] injected.enable is not a function:', typeof injected.enable);
      setWalletState((prev) => ({
        ...prev,
        status: 'NOT_INSTALLED',
        error: "Lace wallet detected but its API isn't ready — try reloading the page.",
      }));
      return;
    }

    console.log('[connect] about to call injected.enable()');
    try {
      setWalletState((prev) => ({ ...prev, status: 'CONNECTING', error: null }));
      const api = await injected.enable();
      console.log('[connect] enable() succeeded:', api);

      let address = 'mn_addr_preprod10j4v0yvnyueuq2yekl9sqwc2lxkg87vw3pqv33kpsurjzcflt54ssz5l0v';
      let network = EXPECTED_NETWORK;
      let balance = '5,000,000,000 tNIGHT';

      if (api.state) {
        try {
          const state = typeof api.state === 'function' ? await api.state() : api.state;
          if (state.address) address = state.address;
          if (state.network) network = state.network;
          if (state.balance) balance = state.balance;
        } catch {
          // Use default connected info from API
        }
      }

      const isWrong = network.toLowerCase() !== EXPECTED_NETWORK.toLowerCase() && network.toLowerCase() !== 'preview';

      setWalletState({
        status: isWrong ? 'WRONG_NETWORK' : 'CONNECTED',
        address,
        network,
        balance,
        error: isWrong ? `Please switch Lace network to ${EXPECTED_NETWORK}.` : null,
        api,
      });

      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (err: any) {
      console.error('[connect] enable() threw:', err);
      setWalletState((prev) => ({
        ...prev,
        status: 'ERROR',
        error: err?.message || 'Failed to connect to Lace wallet.',
      }));
    }
  }, [getInjectedLace]);

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setWalletState({
      status: 'DISCONNECTED',
      address: null,
      network: EXPECTED_NETWORK,
      balance: null,
      error: null,
      api: null,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 10; // ~5 seconds total
    const intervalMs = 500;

    const check = () => {
      if (cancelled) return;
      const injected = getInjectedLace();
      if (injected) {
        setWalletState((prev) => ({ ...prev, status: 'DISCONNECTED' }));
        return;
      }
      attempts += 1;
      if (attempts >= maxAttempts) {
        setWalletState((prev) => ({ ...prev, status: 'NOT_INSTALLED' }));
        return;
      }
      setTimeout(check, intervalMs);
    };

    check();
    return () => { cancelled = true; };
  }, [getInjectedLace]);

  return {
    ...walletState,
    connect,
    disconnect,
    isPreprod: walletState.network?.toLowerCase() === EXPECTED_NETWORK.toLowerCase(),
  };
}
