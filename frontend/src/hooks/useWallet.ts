import { useState, useEffect, useCallback, useRef } from 'react';
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { ErrorCodes } from '@midnight-ntwrk/dapp-connector-api';

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
  api: ConnectedAPI | null;
}

const STORAGE_KEY = 'moonvow_wallet_connected';
const EXPECTED_NETWORK = 'preview';

function snapshotMidnight() {
  const midnight = window.midnight;
  if (!midnight || typeof midnight !== 'object') {
    return { keys: [] as string[], entryCount: 0, connectTypes: [] as string[], enableTypes: [] as string[] };
  }
  const keys = Object.keys(midnight);
  return {
    keys,
    entryCount: keys.length,
    connectTypes: keys.map((k) => typeof midnight[k]?.connect),
    enableTypes: keys.map((k) => typeof (midnight[k] as { enable?: unknown })?.enable),
  };
}

function listWallets(): InitialAPI[] {
  if (!window.midnight) return [];
  return Object.values(window.midnight).filter(
    (wallet): wallet is InitialAPI =>
      !!wallet &&
      typeof wallet === 'object' &&
      typeof wallet.connect === 'function' &&
      typeof wallet.apiVersion === 'string',
  );
}

function formatUnshieldedBalances(balances: Record<string, bigint>): string | null {
  const entries = Object.entries(balances);
  if (entries.length === 0) return null;
  return entries
    .map(([, value]) => `${value.toLocaleString()} tNIGHT`)
    .join(', ');
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    status: 'CONNECTING',
    address: null,
    network: EXPECTED_NETWORK,
    balance: null,
    error: null,
    api: null,
  });

  const connectInProgressRef = useRef(false);
  const detectionCompleteRef = useRef(false);

  const getInjectedLace = useCallback((): InitialAPI | null => {
    const wallets = listWallets();
    return wallets[0] ?? null;
  }, []);

  const connect = useCallback(async () => {
    console.log('[connect] click — window.midnight snapshot:', snapshotMidnight());
    console.log('[connect] connectInProgressRef before:', connectInProgressRef.current);

    let injected = getInjectedLace();
    console.log('[connect] getInjectedLace() returned:', injected);
    console.log('[connect] injected.connect typeof:', injected ? typeof injected.connect : 'n/a');

    if (!injected && window.midnight) {
      console.log('[connect] midnight object exists but no connect()-capable wallet yet — retrying in 400ms');
      await new Promise((resolve) => setTimeout(resolve, 400));
      console.log('[connect] after retry — window.midnight snapshot:', snapshotMidnight());
      injected = getInjectedLace();
      console.log('[connect] getInjectedLace() after retry:', injected);
    }

    if (!injected) {
      console.log('[connect] branch: no injected wallet → NOT_INSTALLED');
      setWalletState((prev) => ({
        ...prev,
        status: 'NOT_INSTALLED',
        error: 'Lace wallet extension is not installed.',
      }));
      return;
    }

    if (typeof injected.connect !== 'function') {
      console.log('[connect] branch: injected.connect is not a function → NOT_INSTALLED');
      setWalletState((prev) => ({
        ...prev,
        status: 'NOT_INSTALLED',
        error: "Lace wallet detected but its API isn't ready — try reloading the page.",
      }));
      return;
    }

    connectInProgressRef.current = true;
    console.log(`[connect] branch: calling injected.connect("${EXPECTED_NETWORK}") now`);
    try {
      setWalletState((prev) => ({ ...prev, status: 'CONNECTING', error: null }));
      let api;
      try {
        console.log(`[connect] trying injected.connect("${EXPECTED_NETWORK}")`);
        api = await injected.connect(EXPECTED_NETWORK);
      } catch (err: any) {
        if (err?.message?.includes('Network ID mismatch') || err?.reason?.includes('Network ID mismatch') || err?.message?.includes('Unsupported network ID')) {
          console.log('[connect] Network ID mismatch on expected network. Probing other networks...');
          const fallbackNetworks = ['preview', 'testnet', 'mainnet', 'undeployed'];
          for (const net of fallbackNetworks) {
            if (net === EXPECTED_NETWORK) continue;
            try {
              console.log(`[connect] probing injected.connect("${net}")`);
              api = await injected.connect(net);
              console.log(`[connect] successfully connected via fallback network: ${net}`);
              break;
            } catch (fallbackErr) {
              // continue probing
            }
          }
          if (!api) {
            console.error('[connect] Exhausted all fallback networks.');
            throw err;
          }
        } else {
          throw err;
        }
      }
      
      console.log('[connect] connect() resolved successfully:', api);

      const connectionStatus = await api.getConnectionStatus();
      console.log('[connect] getConnectionStatus():', connectionStatus);
      console.log('[connect] RAW NETWORK VALUE:', connectionStatus.networkId, 'TYPE:', typeof connectionStatus.networkId);

      if (connectionStatus.status !== 'connected') {
        throw new Error('Wallet connection was not established.');
      }

      const network = connectionStatus.networkId;
      console.log('[connect] network value to compare:', network, 'type:', typeof network);
      const { unshieldedAddress } = await api.getUnshieldedAddress();
      console.log('[connect] getUnshieldedAddress():', unshieldedAddress);

      let balance: string | null = null;
      try {
        const balances = await api.getUnshieldedBalances();
        balance = formatUnshieldedBalances(balances);
        console.log('[connect] getUnshieldedBalances():', balances);
      } catch (balanceErr) {
        console.warn('[connect] getUnshieldedBalances() failed:', balanceErr);
      }

      const isWrong = network.toLowerCase() !== EXPECTED_NETWORK.toLowerCase();

      console.log('[connect] branch: success →', isWrong ? 'WRONG_NETWORK' : 'CONNECTED');
      setWalletState({
        status: isWrong ? 'WRONG_NETWORK' : 'CONNECTED',
        address: unshieldedAddress,
        network,
        balance,
        error: isWrong ? `Please switch Lace network to ${EXPECTED_NETWORK}.` : null,
        api,
      });

      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (err: unknown) {
      console.error('[connect] connect() rejected/threw:', err);
      const apiError = err as { code?: string; reason?: string; message?: string };
      
      let message = 'Failed to connect to Lace wallet.';
      if (apiError.reason?.toLowerCase().includes('locked') || apiError.message?.toLowerCase().includes('locked')) {
        message = 'Lace wallet is locked. Please open the extension and unlock it.';
      } else if (apiError.code === ErrorCodes.Rejected || apiError.code === ErrorCodes.PermissionRejected) {
        message = 'Connection request was rejected in Lace.';
      } else {
        message = apiError.reason || apiError.message || message;
      }
      
      setWalletState((prev) => ({
        ...prev,
        status: 'ERROR',
        error: message,
      }));
    } finally {
      connectInProgressRef.current = false;
      console.log('[connect] finished — connectInProgressRef reset to false');
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
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    const maxAttempts = 20;
    const intervalMs = 500;

    const check = () => {
      if (cancelled || detectionCompleteRef.current) {
        console.log('[poll] skipped — cancelled or detection already complete');
        return;
      }

      const injected = getInjectedLace();
      console.log(`[poll] attempt ${attempts + 1}/${maxAttempts} — injected:`, !!injected, snapshotMidnight());

      if (injected) {
        detectionCompleteRef.current = true;
        setWalletState((prev) => {
          if (
            connectInProgressRef.current ||
            prev.status === 'CONNECTED' ||
            prev.status === 'ERROR' ||
            prev.status === 'WRONG_NETWORK'
          ) {
            console.log('[poll] wallet found but preserving status:', prev.status);
            return prev;
          }
          console.log('[poll] wallet found → DISCONNECTED');
          return { ...prev, status: 'DISCONNECTED' };
        });
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        detectionCompleteRef.current = true;
        setWalletState((prev) => {
          if (connectInProgressRef.current || prev.status === 'CONNECTED') {
            console.log('[poll] timed out but preserving status:', prev.status);
            return prev;
          }
          console.log('[poll] timed out → NOT_INSTALLED');
          return { ...prev, status: 'NOT_INSTALLED' };
        });
        return;
      }

      timeoutId = setTimeout(check, intervalMs);
    };

    check();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [getInjectedLace]);

  return {
    ...walletState,
    connect,
    disconnect,
    isPreview: walletState.network?.toLowerCase() === EXPECTED_NETWORK.toLowerCase(),
  };
}
