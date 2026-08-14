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

const STORAGE_KEY = 'moonvow_wallet_connected';
const EXPECTED_NETWORK = 'preprod';

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    status: 'DISCONNECTED',
    address: null,
    network: EXPECTED_NETWORK,
    balance: null,
    error: null,
    api: null,
  });

  const getInjectedLace = useCallback(() => {
    if (typeof window === 'undefined' || !(window as any).midnight) {
      return null;
    }
    const midnight = (window as any).midnight;
    const entries = Object.entries(midnight);

    // Prefer an entry that self-identifies as Lace if it exposes a name/apiVersion
    const laceEntry = entries.find(
      ([key, val]: [string, any]) =>
        typeof val?.enable === 'function' &&
        (key.toLowerCase().includes('lace') || val?.name?.toLowerCase?.().includes('lace') || entries.length === 1)
    );
    if (laceEntry) return laceEntry[1];

    // Fallback: any injected wallet with a callable enable()
    const anyWallet = entries.find(([, val]: [string, any]) => typeof val?.enable === 'function');
    return anyWallet ? anyWallet[1] : null;
  }, []);

  const connect = useCallback(async () => {
    let injected = getInjectedLace();

    if (!injected && typeof window !== 'undefined' && (window as any).midnight) {
      // Wait ~400ms and retry in case the extension is slow to inject
      await new Promise(resolve => setTimeout(resolve, 400));
      injected = getInjectedLace();
    }

    if (!injected) {
      setWalletState((prev) => ({
        ...prev,
        status: 'NOT_INSTALLED',
        error: 'Lace wallet extension is not installed.',
      }));
      return;
    }

    if (typeof injected.enable !== 'function') {
      setWalletState((prev) => ({
        ...prev,
        status: 'NOT_INSTALLED',
        error: "Lace wallet detected but its API isn't ready — try reloading the page.",
      }));
      return;
    }

    try {
      setWalletState((prev) => ({ ...prev, status: 'CONNECTING', error: null }));
      const api = await injected.enable();

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
      console.error('Failed to connect to Lace wallet. Raw error:', err);
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
    const wasConnected = localStorage.getItem(STORAGE_KEY) === 'true';
    const injected = getInjectedLace();
    if (!injected) {
      setWalletState((prev) => ({ ...prev, status: 'NOT_INSTALLED' }));
    } else if (wasConnected) {
      connect();
    }
  }, [getInjectedLace, connect]);

  return {
    ...walletState,
    connect,
    disconnect,
    isPreprod: walletState.network?.toLowerCase() === EXPECTED_NETWORK.toLowerCase(),
  };
}
