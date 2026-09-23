import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';
import { ledger } from './moonVow';

const INDEXER_URL = import.meta.env.VITE_MIDNIGHT_INDEXER_URL || 'https://indexer.preview.midnight.network/api/v4/graphql';
const INDEXER_WS_URL = import.meta.env.VITE_MIDNIGHT_INDEXER_WS_URL || 'wss://indexer.preview.midnight.network/api/v4/graphql/ws';

export async function queryLedgerState(contractAddress: string) {
  try {
    const provider = indexerPublicDataProvider(INDEXER_URL, INDEXER_WS_URL);
    const onChainState = await provider.queryContractState(contractAddress);
    if (!onChainState) return null;
    
    // Bypass Vite's dual-chunk prototype mismatch (where the indexer's ContractState prototype
    // is physically separate from the generated contract's compact-runtime prototype):
    const rawBytes = onChainState.serialize();
    const correctState = compactRuntime.ContractState.deserialize(rawBytes);
    
    return ledger(correctState.data);
  } catch (error) {
    console.error('Failed to query ledger state:', error);
    return null;
  }
}
