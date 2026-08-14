import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contractPath = path.resolve(__dirname, '..', 'contracts', 'managed', 'moon-vow', 'contract', 'index.js');
const MoonVow = await import(pathToFileURL(contractPath).href);

describe('MoonVow Smart Contract Lifecycle Tests', () => {
  it('1. commitVow with fresh goal and salt succeeds, increments vowCount, and sets commitment in vows as false', () => {
    let currentGoal = 'Run a marathon by December';
    let currentSalt = randomBytes(32);

    const witnesses = {
      goalText: (context: any) => [context.privateState, currentGoal],
      salt: (context: any) => [context.privateState, currentSalt],
    };

    const contract = new MoonVow.Contract(witnesses);
    const constructorContext = {
      initialPrivateState: {},
      initialZswapLocalState: { coinPublicKey: new Uint8Array(32) },
    };

    const initialStateResult = contract.initialState(constructorContext);
    let contractState = initialStateResult.currentContractState;

    const circuitContext: any = {
      currentQueryContext: new compactRuntime.QueryContext(
        contractState.data,
        compactRuntime.dummyContractAddress(),
      ),
      currentPrivateState: initialStateResult.currentPrivateState,
      currentZswapLocalState: initialStateResult.currentZswapLocalState,
      costModel: compactRuntime.CostModel.initialCostModel(),
    };

    const res = contract.circuits.commitVow(circuitContext);
    assert.ok(res, 'commitVow circuit execution returned result');

    const ledgerState = MoonVow.ledger(circuitContext.currentQueryContext.state);
    assert.strictEqual(ledgerState.vowCount, 1n, 'vowCount should increment to 1');

    const expectedCommitment = compactRuntime.persistentCommit(
      compactRuntime.CompactTypeOpaqueString,
      currentGoal,
      currentSalt,
    );

    assert.ok(ledgerState.vows.has(expectedCommitment), 'vows map contains commitment');
    assert.strictEqual(ledgerState.vows.get(expectedCommitment), false, 'vow status is unfulfilled (false)');
  });

  it('2. commitVow called twice with identical goal and salt is rejected (duplicate commitment)', () => {
    const goal = 'Read 20 books this year';
    const salt = randomBytes(32);

    const witnesses = {
      goalText: (context: any) => [context.privateState, goal],
      salt: (context: any) => [context.privateState, salt],
    };

    const contract = new MoonVow.Contract(witnesses);
    const initialStateResult = contract.initialState({
      initialPrivateState: {},
      initialZswapLocalState: { coinPublicKey: new Uint8Array(32) },
    });

    const circuitContext: any = {
      currentQueryContext: new compactRuntime.QueryContext(
        initialStateResult.currentContractState.data,
        compactRuntime.dummyContractAddress(),
      ),
      currentPrivateState: initialStateResult.currentPrivateState,
      currentZswapLocalState: initialStateResult.currentZswapLocalState,
      costModel: compactRuntime.CostModel.initialCostModel(),
    };

    // First commitment succeeds
    contract.circuits.commitVow(circuitContext);

    // Second commitment with same inputs throws error
    assert.throws(
      () => {
        contract.circuits.commitVow(circuitContext);
      },
      /already exists/,
      'Duplicate commitVow should throw Vow commitment already exists error',
    );
  });

  it('3. fulfillVow on existing unfulfilled commitment succeeds and flips status to true', () => {
    const goal = 'Learn Rust programming';
    const salt = randomBytes(32);

    const witnesses = {
      goalText: (context: any) => [context.privateState, goal],
      salt: (context: any) => [context.privateState, salt],
    };

    const contract = new MoonVow.Contract(witnesses);
    const initialStateResult = contract.initialState({
      initialPrivateState: {},
      initialZswapLocalState: { coinPublicKey: new Uint8Array(32) },
    });

    const circuitContext: any = {
      currentQueryContext: new compactRuntime.QueryContext(
        initialStateResult.currentContractState.data,
        compactRuntime.dummyContractAddress(),
      ),
      currentPrivateState: initialStateResult.currentPrivateState,
      currentZswapLocalState: initialStateResult.currentZswapLocalState,
      costModel: compactRuntime.CostModel.initialCostModel(),
    };

    contract.circuits.commitVow(circuitContext);

    const commitment = compactRuntime.persistentCommit(
      compactRuntime.CompactTypeOpaqueString,
      goal,
      salt,
    );

    let ledgerState = MoonVow.ledger(circuitContext.currentQueryContext.state);
    assert.strictEqual(ledgerState.vows.get(commitment), false, 'Vow status before fulfillment is false');

    // Fulfill vow
    contract.circuits.fulfillVow(circuitContext);

    ledgerState = MoonVow.ledger(circuitContext.currentQueryContext.state);
    assert.strictEqual(ledgerState.vows.get(commitment), true, 'Vow status after fulfillment is true');
  });

  it('4. fulfillVow on nonexistent or already-fulfilled commitment fails', () => {
    let goal = 'Deploy MoonVow on Midnight';
    let salt = randomBytes(32);

    const witnesses = {
      goalText: (context: any) => [context.privateState, goal],
      salt: (context: any) => [context.privateState, salt],
    };

    const contract = new MoonVow.Contract(witnesses);
    const initialStateResult = contract.initialState({
      initialPrivateState: {},
      initialZswapLocalState: { coinPublicKey: new Uint8Array(32) },
    });

    const circuitContext: any = {
      currentQueryContext: new compactRuntime.QueryContext(
        initialStateResult.currentContractState.data,
        compactRuntime.dummyContractAddress(),
      ),
      currentPrivateState: initialStateResult.currentPrivateState,
      currentZswapLocalState: initialStateResult.currentZswapLocalState,
      costModel: compactRuntime.CostModel.initialCostModel(),
    };

    // Case A: Fulfill nonexistent vow fails
    assert.throws(
      () => {
        contract.circuits.fulfillVow(circuitContext);
      },
      /does not exist/,
      'Fulfilling non-existent vow should throw error',
    );

    // Commit and fulfill once
    contract.circuits.commitVow(circuitContext);
    contract.circuits.fulfillVow(circuitContext);

    // Case B: Fulfilling already-fulfilled vow fails
    assert.throws(
      () => {
        contract.circuits.fulfillVow(circuitContext);
      },
      /already fulfilled/,
      'Fulfilling an already fulfilled vow should throw error',
    );
  });
});
