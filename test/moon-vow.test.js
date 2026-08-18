import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomBytes, createHash } from 'node:crypto';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contractPath = path.resolve(__dirname, '..', 'contracts', 'managed', 'moon-vow', 'contract', 'index.js');
const MoonVow = await import(pathToFileURL(contractPath).href);

describe('MoonVow Smart Contract Lifecycle Tests', () => {
  it('1. commitVow with fresh goal and salt succeeds, increments vowCount, and sets commitment in vows as false', () => {
    let currentGoal = 'Run a marathon by December';
    let currentSalt = randomBytes(32);

    const witnesses = {
      goalTextHash: (context) => [context.privateState, new Uint8Array(createHash('sha256').update(currentGoal).digest())],
      salt: (context) => [context.privateState, currentSalt],
    };

    const contract = new MoonVow.Contract(witnesses);
    const constructorContext = {
      initialPrivateState: {},
      initialZswapLocalState: { coinPublicKey: new Uint8Array(32) },
    };

    const initialStateResult = contract.initialState(constructorContext);
    let contractState = initialStateResult.currentContractState;

    let circuitContext = {
      currentQueryContext: new compactRuntime.QueryContext(
        contractState.data,
        compactRuntime.dummyContractAddress(),
      ),
      currentPrivateState: initialStateResult.currentPrivateState,
      currentZswapLocalState: initialStateResult.currentZswapLocalState,
      costModel: compactRuntime.CostModel.initialCostModel(),
    };

    const res = contract.circuits.commitVow(circuitContext);
    circuitContext = res.context;
    assert.ok(res, 'commitVow circuit execution returned result');

    const ledgerState = MoonVow.ledger(circuitContext.currentQueryContext.state);
    assert.strictEqual(ledgerState.vowCount, 1n, 'vowCount should increment to 1');

    const expectedCommitment = compactRuntime.persistentCommit(
      new compactRuntime.CompactTypeBytes(32),
      new Uint8Array(createHash('sha256').update(currentGoal).digest()),
      currentSalt,
    );

    assert.ok(ledgerState.vows.member(expectedCommitment), 'vows map contains commitment');
    assert.strictEqual(ledgerState.vows.lookup(expectedCommitment), false, 'vow status is unfulfilled (false)');
  });

  it('2. commitVow called twice with identical goal and salt is rejected (duplicate commitment)', () => {
    const goal = 'Read 20 books this year';
    const salt = randomBytes(32);

    const witnesses = {
      goalTextHash: (context) => [context.privateState, new Uint8Array(createHash('sha256').update(goal).digest())],
      salt: (context) => [context.privateState, salt],
    };

    const contract = new MoonVow.Contract(witnesses);
    const initialStateResult = contract.initialState({
      initialPrivateState: {},
      initialZswapLocalState: { coinPublicKey: new Uint8Array(32) },
    });

    let circuitContext = {
      currentQueryContext: new compactRuntime.QueryContext(
        initialStateResult.currentContractState.data,
        compactRuntime.dummyContractAddress(),
      ),
      currentPrivateState: initialStateResult.currentPrivateState,
      currentZswapLocalState: initialStateResult.currentZswapLocalState,
      costModel: compactRuntime.CostModel.initialCostModel(),
    };

    // First commitment succeeds
    circuitContext = contract.circuits.commitVow(circuitContext).context;

    // Second commitment with same inputs throws error
    assert.throws(
      () => {
        circuitContext = contract.circuits.commitVow(circuitContext).context;
      },
      /already exists/,
      'Duplicate commitVow should throw Vow commitment already exists error',
    );
  });

  it('3. fulfillVow on existing unfulfilled commitment succeeds and flips status to true', () => {
    const goal = 'Learn Rust programming';
    const salt = randomBytes(32);

    const witnesses = {
      goalTextHash: (context) => [context.privateState, new Uint8Array(createHash('sha256').update(goal).digest())],
      salt: (context) => [context.privateState, salt],
    };

    const contract = new MoonVow.Contract(witnesses);
    const initialStateResult = contract.initialState({
      initialPrivateState: {},
      initialZswapLocalState: { coinPublicKey: new Uint8Array(32) },
    });

    let circuitContext = {
      currentQueryContext: new compactRuntime.QueryContext(
        initialStateResult.currentContractState.data,
        compactRuntime.dummyContractAddress(),
      ),
      currentPrivateState: initialStateResult.currentPrivateState,
      currentZswapLocalState: initialStateResult.currentZswapLocalState,
      costModel: compactRuntime.CostModel.initialCostModel(),
    };

    circuitContext = contract.circuits.commitVow(circuitContext).context;

    const commitment = compactRuntime.persistentCommit(
      new compactRuntime.CompactTypeBytes(32),
      new Uint8Array(createHash('sha256').update(goal).digest()),
      salt,
    );

    let ledgerState = MoonVow.ledger(circuitContext.currentQueryContext.state);
    assert.strictEqual(ledgerState.vows.lookup(commitment), false, 'Vow status before fulfillment is false');

    // Fulfill vow
    circuitContext = contract.circuits.fulfillVow(circuitContext).context;

    ledgerState = MoonVow.ledger(circuitContext.currentQueryContext.state);
    assert.strictEqual(ledgerState.vows.lookup(commitment), true, 'Vow status after fulfillment is true');
  });

  it('4. fulfillVow on nonexistent or already-fulfilled commitment fails', () => {
    let goal = 'Deploy MoonVow on Midnight';
    let salt = randomBytes(32);

    const witnesses = {
      goalTextHash: (context) => [context.privateState, new Uint8Array(createHash('sha256').update(goal).digest())],
      salt: (context) => [context.privateState, salt],
    };

    const contract = new MoonVow.Contract(witnesses);
    const initialStateResult = contract.initialState({
      initialPrivateState: {},
      initialZswapLocalState: { coinPublicKey: new Uint8Array(32) },
    });

    let circuitContext = {
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
        circuitContext = contract.circuits.fulfillVow(circuitContext).context;
      },
      /does not exist/,
      'Fulfilling non-existent vow should throw error',
    );

    // Commit and fulfill once
    circuitContext = contract.circuits.commitVow(circuitContext).context;
    circuitContext = contract.circuits.fulfillVow(circuitContext).context;

    // Case B: Fulfilling already-fulfilled vow fails
    assert.throws(
      () => {
        circuitContext = contract.circuits.fulfillVow(circuitContext).context;
      },
      /already fulfilled/,
      'Fulfilling an already fulfilled vow should throw error',
    );
  });
});
