import { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { dappConnectorProofProvider } from '@midnight-ntwrk/midnight-js-dapp-connector-proof-provider';
import { NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { Transaction, SignatureEnabled, Proof, Binding } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { WalletProvider, MidnightProvider } from '@midnight-ntwrk/midnight-js-types';
import { parseCoinPublicKeyToHex, parseEncPublicKeyToHex } from '@midnight-ntwrk/midnight-js-utils';
import { Buffer } from 'buffer';

const INDEXER_URL = 'wss://indexer.preview.midnight.network/api/v1/graphql';
const INDEXER_WS_URL = 'wss://indexer.preview.midnight.network/api/v1/graphql/ws';

class DAppConnectorWalletAndMidnightProvider implements WalletProvider, MidnightProvider {
  constructor(
    private readonly api: ConnectedAPI,
    private readonly coinPublicKeyHex: string,
    private readonly encryptionPublicKeyHex: string,
  ) {}

  getCoinPublicKey() {
    return this.coinPublicKeyHex;
  }

  getEncryptionPublicKey() {
    return this.encryptionPublicKeyHex;
  }

  async balanceTx(tx: any, ttl?: Date): Promise<any> {
    const serializedTx = Buffer.from(tx.serialize()).toString('hex');
    const { tx: balancedHex } = await (this.api as any).balanceUnsealedTransaction(serializedTx);
    const balancedBytes = Buffer.from(balancedHex, 'hex');
    // Using cast because Transaction.deserialize requires markers in typescript but we can just cast from any
    return (Transaction as any).deserialize(
      balancedBytes,
      SignatureEnabled ? (SignatureEnabled as any).instance : undefined,
      Proof ? (Proof as any).instance : undefined,
      Binding ? (Binding as any).instance : undefined
    ) || (Transaction as any).deserialize(balancedBytes); 
  }

  async submitTx(tx: any): Promise<any> {
    const hexTx = Buffer.from(tx.serialize()).toString('hex');
    await this.api.submitTransaction(hexTx);
    return (tx as any).id ? (tx as any).id() : hexTx; 
  }
}

export async function createCredentialsProviders(api: ConnectedAPI, unshieldedAddress: string, networkId: string) {
  // Get keys from Lace
  const shieldedAddresses = await (api as any).getShieldedAddresses();
  const coinPublicKeyHex = parseCoinPublicKeyToHex(shieldedAddresses.coinPublicKey, networkId as any);
  const encryptionPublicKeyHex = parseEncPublicKeyToHex(shieldedAddresses.encryptionPublicKey, networkId as any);

  const walletAndMidnightProvider = new DAppConnectorWalletAndMidnightProvider(api, coinPublicKeyHex, encryptionPublicKeyHex);

  const zkConfigProvider = new FetchZkConfigProvider(window.location.origin + '/credentials', window.fetch);

  const { CostModel } = await import('@midnight-ntwrk/midnight-js-protocol/ledger');
  const proofProvider = await dappConnectorProofProvider(api as any, zkConfigProvider, CostModel.initialCostModel());
  
  const publicDataProvider = indexerPublicDataProvider(INDEXER_URL, INDEXER_WS_URL);

  const privateStateProvider = levelPrivateStateProvider({
    privateStateStoreName: 'credentials-state',
    accountId: unshieldedAddress
  } as any);

  return {
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
    zkConfigProvider,
    proofProvider,
    publicDataProvider,
    privateStateProvider,
  };
}
