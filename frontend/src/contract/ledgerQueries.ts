import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { ledger } from './moonVow';

const INDEXER_URL = import.meta.env.VITE_MIDNIGHT_INDEXER_URL || 'https://indexer.preprod.midnight.network/api/v1/graphql';
const INDEXER_WS_URL = import.meta.env.VITE_MIDNIGHT_INDEXER_WS_URL || 'wss://indexer.preprod.midnight.network/api/v1/graphql/ws';

export async function queryLedgerState(contractAddress: string) {
  try {
    const provider = indexerPublicDataProvider(INDEXER_URL, INDEXER_WS_URL);
    const onChainState = await provider.queryContractState(contractAddress);
    if (!onChainState) return null;
    return ledger(onChainState.data);
  } catch (error) {
    console.error('Failed to query ledger state:', error);
    return null;
  }
}
