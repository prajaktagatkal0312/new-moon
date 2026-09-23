import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { ledger } from './moonVow';

const INDEXER_URL = import.meta.env.VITE_MIDNIGHT_INDEXER_URL || 'https://indexer.preview.midnight.network/api/v4/graphql';
const INDEXER_WS_URL = import.meta.env.VITE_MIDNIGHT_INDEXER_WS_URL || 'wss://indexer.preview.midnight.network/api/v4/graphql/ws';

export async function queryLedgerState(contractAddress: string) {
  try {
    const provider = indexerPublicDataProvider(INDEXER_URL, INDEXER_WS_URL);
    const onChainState = await provider.queryContractState(contractAddress);
    if (!onChainState) return null;
    console.log('[DEBUG] onChainState:', onChainState);
    console.log('[DEBUG] onChainState.data:', onChainState.data);
    console.log('[DEBUG] onChainState.data constructor:', onChainState.data?.constructor?.name);
    console.log('[DEBUG] onChainState.data instanceof check target — compare against __compactRuntime.StateValue');
    return ledger(onChainState.data);
  } catch (error) {
    console.error('Failed to query ledger state:', error);
    return null;
  }
}
