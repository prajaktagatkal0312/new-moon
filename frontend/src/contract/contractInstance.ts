import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { compiledContract } from './moonVow';
import { createMoonVowProviders } from './providers';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

let cachedContract: any = null;
let currentProviders: any = null;

const PREVIEW_CONTRACT_ADDRESS = import.meta.env.VITE_PREVIEW_CONTRACT_ADDRESS || import.meta.env.VITE_CONTRACT_ADDRESS || 'e9cc9a964372b4d8d1a4bcd839cc70d8055be22fb2d2622616e107dd46059944'; // fallback points to preview

export async function getOrJoinContract(api: ConnectedAPI, address: string, networkId: string) {
  if (cachedContract) return { contract: cachedContract, providers: currentProviders };
  
  const providers = await createMoonVowProviders(api, address, networkId);
  const contract = await findDeployedContract(providers as any, {
    contractAddress: PREVIEW_CONTRACT_ADDRESS,
    compiledContract: compiledContract as any,
    privateStateId: 'moonVowPrivateState',
    initialPrivateState: {},
  });
  
  cachedContract = contract;
  currentProviders = providers;
  return { contract: cachedContract, providers: currentProviders };
}
