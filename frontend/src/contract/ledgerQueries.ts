import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { ledger } from './moonVow';

const INDEXER_URL_RAW = import.meta.env.VITE_MIDNIGHT_INDEXER_URL || '/api/graphql-proxy';
const INDEXER_URL = INDEXER_URL_RAW.startsWith('/') ? window.location.origin + INDEXER_URL_RAW : INDEXER_URL_RAW;
const INDEXER_WS_URL = import.meta.env.VITE_MIDNIGHT_INDEXER_WS_URL || 'wss://indexer.preview.midnight.network/api/v4/graphql/ws';

export async function queryLedgerState(contractAddress: string) {
  try {
    // Set a default network ID for queries before the wallet connects
    setNetworkId('preview');
    
    const provider = indexerPublicDataProvider(INDEXER_URL, INDEXER_WS_URL);
    const onChainState = await provider.queryContractState(contractAddress);
    if (!onChainState) return null;
    
    return ledger(onChainState.data);
  } catch (error) {
    console.error('Failed to query ledger state:', error);
    return null;
  }
}
