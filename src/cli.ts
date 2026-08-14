/**
 * MoonVow Interactive CLI — Commit & Fulfill personal goals on Midnight Network
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';
import { Buffer } from 'buffer';
import { randomBytes } from 'node:crypto';

// Midnight SDK imports
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { resolveNetwork, getOrCreateSeed, getDeployment } from './network';
import { createWallet, persistWalletState, unshieldedToken, type WalletContext } from './wallet';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';

// Enable WebSocket for GraphQL subscriptions
// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

const PRIVATE_STATE_ID = 'moonVowPrivateState';
const { network, config: networkConfig } = resolveNetwork();
const SEED = getOrCreateSeed(network);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = path.resolve(__dirname, '..', 'contracts', 'managed', 'moon-vow');
const contractPath = path.join(zkConfigPath, 'contract', 'index.js');
const SECRETS_FILE = path.resolve(__dirname, '..', '.moonvow-local-secrets.json');

if (!fs.existsSync(contractPath)) {
  console.error('\n❌ Contract not compiled! Run: npm run compile\n');
  process.exit(1);
}

const MoonVow = await import(pathToFileURL(contractPath).href);

// ─── Local Secret Storage ───────────────────────────────────────────────────────

export interface SavedVow {
  goalText: string;
  saltHex: string;
  commitmentHex: string;
  committedAt: string;
  fulfilled: boolean;
}

export function readSavedVows(): SavedVow[] {
  if (!fs.existsSync(SECRETS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

export function saveVowSecret(vow: SavedVow) {
  const vows = readSavedVows();
  vows.push(vow);
  fs.writeFileSync(SECRETS_FILE, JSON.stringify(vows, null, 2));
}

export function markVowFulfilledLocally(commitmentHex: string) {
  const vows = readSavedVows();
  const target = vows.find((v) => v.commitmentHex === commitmentHex);
  if (target) {
    target.fulfilled = true;
    fs.writeFileSync(SECRETS_FILE, JSON.stringify(vows, null, 2));
  }
}

// ─── Dynamic Witness State ─────────────────────────────────────────────────────

let activeGoalText = '';
let activeSalt = new Uint8Array(32);

const witnessHandlers = {
  goalText: (context: any) => [context.privateState, activeGoalText],
  salt: (context: any) => [context.privateState, activeSalt],
};

const compiledContract = CompiledContract.make('moon-vow', MoonVow.Contract).pipe(
  CompiledContract.withCustomWitnesses(witnessHandlers as any),
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);

// ─── Providers ─────────────────────────────────────────────────────────────────

async function createProviders(walletCtx: WalletContext) {
  const privateStatePassword = process.env.PRIVATE_STATE_PASSWORD?.trim() || 'Local-Devnet-Development-Placeholder-1';

  const walletProvider = {
    getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      return walletCtx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };

  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  const accountId = walletCtx.unshieldedKeystore.getBech32Address().toString();

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'moon-vow-state',
      accountId,
      privateStoragePasswordProvider: () => privateStatePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}

// ─── Main CLI ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║               🌙 MoonVow Commitment CLI                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const rl = createInterface({ input: stdin, output: stdout });
  const deployment = getDeployment(network);

  if (!deployment) {
    console.error(`No deploy on file for network ${network}. Run \`npm run setup -- --network ${network}\` first.`);
    process.exit(1);
  }

  console.log(`  Contract Address: ${deployment.address}`);
  console.log(`  Active Network:   ${network}\n`);

  try {
    const seed = SEED;
    console.log('  Connecting to wallet & syncing state...');
    const walletCtx = await createWallet({ network, networkConfig, seed });
    const state = await walletCtx.wallet.waitForSyncedState();
    await persistWalletState(network, walletCtx);

    const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
    console.log(`  ✓ Synced! Balance: ${balance.toLocaleString()} tNight\n`);

    console.log('  Connecting to MoonVow contract...');
    const providers = await createProviders(walletCtx);

    const deployed: any = await findDeployedContract(providers, {
      compiledContract: compiledContract as any,
      contractAddress: deployment.address,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: {},
    });

    console.log('  ✅ Connected!\n');

    let running = true;
    while (running) {
      console.log('─── MoonVow Options ───────────────────────────────────────────');
      console.log('  1. 🌑 Commit a new private vow (commitVow)');
      console.log('  2. 🌕 Fulfill an existing vow (fulfillVow)');
      console.log('  3. 📋 View public ledger status (vowCount & vows)');
      console.log('  4. 💰 Check wallet balance');
      console.log('  5. 🚪 Exit\n');

      const choice = await rl.question('  Select option [1-5]: ');

      switch (choice.trim()) {
        case '1': {
          const goal = await rl.question('\n  Enter your secret goal text: ');
          if (!goal.trim()) {
            console.log('  ❌ Goal text cannot be empty.\n');
            break;
          }

          const saltBytes = randomBytes(32);
          activeGoalText = goal;
          activeSalt = saltBytes;

          // Compute commitment locally
          const commitment = compactRuntime.persistentCommit(
            compactRuntime.CompactTypeOpaqueString,
            goal,
            saltBytes,
          );
          const commitmentHex = Buffer.from(commitment).toString('hex');

          console.log(`  Generated commitment hash: ${commitmentHex}`);
          console.log('  Submitting commitVow transaction...');

          try {
            const tx = await deployed.callTx.commitVow();
            saveVowSecret({
              goalText: goal,
              saltHex: Buffer.from(saltBytes).toString('hex'),
              commitmentHex,
              committedAt: new Date().toISOString(),
              fulfilled: false,
            });
            console.log(`\n  ✅ Vow committed successfully on-chain!`);
            console.log(`  Tx ID: ${tx.public.txId}`);
            console.log(`  Saved secret locally to .moonvow-local-secrets.json\n`);
          } catch (error) {
            console.error('\n  ❌ Commit failed:', error instanceof Error ? error.message : error);
          }
          break;
        }

        case '2': {
          const vows = readSavedVows().filter((v) => !v.fulfilled);
          console.log('\n─── Unfulfilled Local Vows ───────────────────────────────────');

          let selectedGoal = '';
          let selectedSaltHex = '';
          let selectedCommitmentHex = '';

          if (vows.length > 0) {
            vows.forEach((v, idx) => {
              console.log(`  [${idx + 1}] "${v.goalText}" (Hash: ${v.commitmentHex.slice(0, 16)}...)`);
            });
            console.log('  [M] Enter goal text + salt manually');

            const pick = await rl.question('\n  Select vow to fulfill or M: ');
            if (pick.trim().toUpperCase() === 'M') {
              selectedGoal = await rl.question('  Enter secret goal text: ');
              selectedSaltHex = await rl.question('  Enter 64-char hex salt: ');
            } else {
              const idx = parseInt(pick.trim(), 10) - 1;
              if (idx >= 0 && idx < vows.length) {
                selectedGoal = vows[idx].goalText;
                selectedSaltHex = vows[idx].saltHex;
                selectedCommitmentHex = vows[idx].commitmentHex;
              } else {
                console.log('  ❌ Invalid selection.\n');
                break;
              }
            }
          } else {
            console.log('  No unfulfilled local vows found.');
            selectedGoal = await rl.question('  Enter secret goal text: ');
            selectedSaltHex = await rl.question('  Enter 64-char hex salt: ');
          }

          if (!selectedGoal || !selectedSaltHex) {
            console.log('  ❌ Goal text and salt are required.\n');
            break;
          }

          const saltBytes = Uint8Array.from(Buffer.from(selectedSaltHex, 'hex'));
          activeGoalText = selectedGoal;
          activeSalt = saltBytes;

          if (!selectedCommitmentHex) {
            const commitment = compactRuntime.persistentCommit(
              compactRuntime.CompactTypeOpaqueString,
              selectedGoal,
              saltBytes,
            );
            selectedCommitmentHex = Buffer.from(commitment).toString('hex');
          }

          console.log(`\n  Fulfilling vow commitment: ${selectedCommitmentHex}`);
          console.log('  Submitting fulfillVow transaction...');

          try {
            const tx = await deployed.callTx.fulfillVow();
            markVowFulfilledLocally(selectedCommitmentHex);
            console.log(`\n  ✅ Vow marked as FULFILLED on-chain!`);
            console.log(`  Tx ID: ${tx.public.txId}\n`);
          } catch (error) {
            console.error('\n  ❌ Fulfillment failed:', error instanceof Error ? error.message : error);
          }
          break;
        }

        case '3': {
          console.log('\n  Reading public ledger state...');
          try {
            const contractState = await providers.publicDataProvider.queryContractState(deployment.address);
            if (contractState) {
              const ledgerState = MoonVow.ledger(contractState.data);
              console.log(`\n  📊 Total Vows Committed (vowCount): ${ledgerState.vowCount}`);
              console.log('  (Content of goals remains 100% private off-chain)\n');
            } else {
              console.log('\n  📋 Contract state empty\n');
            }
          } catch (error) {
            console.error('\n  ❌ Failed to query ledger:', error instanceof Error ? error.message : error);
          }
          break;
        }

        case '4': {
          console.log('\n  Checking wallet balance...');
          const currentState = await walletCtx.wallet.waitForSyncedState();
          const currentBalance = currentState.unshielded.balances[unshieldedToken().raw] ?? 0n;
          const dustBalance = currentState.dust.balance(new Date());
          console.log(`\n  tNight: ${currentBalance.toLocaleString()}`);
          console.log(`  DUST:   ${dustBalance.toLocaleString()}\n`);
          break;
        }

        case '5':
          running = false;
          console.log('\n  👋 Goodbye!\n');
          break;

        default:
          console.log('\n  ❌ Invalid choice. Enter 1-5.\n');
      }
    }

    await persistWalletState(network, walletCtx);
    await walletCtx.wallet.stop();
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
  } finally {
    rl.close();
  }
}

main().catch(console.error);
