import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contractPath = path.resolve(__dirname, '..', 'contracts', 'managed', 'moon-vow', 'contract', 'index.js');
const MoonVow = await import(pathToFileURL(contractPath).href);

describe('Private Eligibility Verifier Tests', () => {
  it('1. proveEligibility with valid value (>= 18) succeeds and sets status to true', () => {
    let currentSalt = randomBytes(32);

    const witnesses = {
      privateValue: (context) => [context.privateState, 20n], // 20 >= 18
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

    const res = contract.circuits.proveEligibility(circuitContext);
    circuitContext = res.context;
    assert.ok(res, 'proveEligibility circuit execution returned result');

    const ledgerState = MoonVow.ledger(circuitContext.currentQueryContext.state);
    
    // Check that the verification is stored correctly
    const expectedCommitment = compactRuntime.persistentCommit(
      new compactRuntime.CompactTypeUint(32),
      20n,
      currentSalt,
    );

    assert.ok(ledgerState.verifications.member(expectedCommitment), 'verifications map contains commitment');
    assert.strictEqual(ledgerState.verifications.lookup(expectedCommitment), true, 'status is eligible (true)');
  });

  it('2. proveEligibility boundary test: raw value is NOT in public state', () => {
    let currentSalt = randomBytes(32);

    const witnesses = {
      privateValue: (context) => [context.privateState, 25n],
      salt: (context) => [context.privateState, currentSalt],
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

    circuitContext = contract.circuits.proveEligibility(circuitContext).context;

    // The raw state is inside circuitContext.currentQueryContext.state
    // We stringify the state and ensure '25' isn't explicitly there as a number, 
    // or rather, we just check ledgerState
    const ledgerState = MoonVow.ledger(circuitContext.currentQueryContext.state);
    const jsonState = JSON.stringify(ledgerState, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
    );
    
    assert.ok(!jsonState.includes('"25"'), 'The raw private value should not be in public state');
  });

  it('3. proveEligibility fails when value is under threshold', () => {
    let currentSalt = randomBytes(32);

    const witnesses = {
      privateValue: (context) => [context.privateState, 17n], // 17 < 18
      salt: (context) => [context.privateState, currentSalt],
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

    assert.throws(
      () => {
        contract.circuits.proveEligibility(circuitContext);
      },
      /Private value does not meet the eligibility threshold/,
      'proveEligibility should throw if value is under threshold'
    );
  });
});
