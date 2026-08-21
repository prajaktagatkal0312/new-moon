import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contractPath = path.resolve(__dirname, '..', 'contracts', 'managed', 'credentials', 'contract', 'index.js');
const Credentials = await import(pathToFileURL(contractPath).href);

describe('Confidential Credentials Tests', () => {
  it('Happy path: valid credential passes proveCredentialValid', async () => {
    const rawCredentialBytes = randomBytes(32);
    const credentialSaltBytes = randomBytes(32);
    const nullifierSaltBytes = randomBytes(32);

    const witnesses = {
      credential: (context) => [context.privateState, rawCredentialBytes],
      credentialSalt: (context) => [context.privateState, credentialSaltBytes],
      nullifierSalt: (context) => [context.privateState, nullifierSaltBytes],
    };

    const contract = new Credentials.Contract(witnesses);
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

    // 1. Issue the credential
    let res = contract.circuits.issueCredential(circuitContext);
    circuitContext = res.context;
    assert.ok(res, 'issueCredential circuit execution returned result');

    const expectedCommitment = compactRuntime.persistentCommit(
      new compactRuntime.CompactTypeBytes(32),
      rawCredentialBytes,
      credentialSaltBytes,
    );

    let ledgerState = Credentials.ledger(circuitContext.currentQueryContext.state);
    assert.ok(ledgerState.validCredentials.member(expectedCommitment), 'validCredentials map contains commitment');
    assert.strictEqual(ledgerState.validCredentials.lookup(expectedCommitment), true, 'credential is valid');

    // 2. Prove the credential is valid
    let proveRes = contract.circuits.proveCredentialValid(circuitContext);
    circuitContext = proveRes.context;
    assert.ok(proveRes, 'proveCredentialValid circuit execution returned result');

    ledgerState = Credentials.ledger(circuitContext.currentQueryContext.state);
    const expectedNullifier = compactRuntime.persistentCommit(
      new compactRuntime.CompactTypeBytes(32),
      rawCredentialBytes,
      nullifierSaltBytes,
    );
    assert.ok(ledgerState.verifiedProofs.member(expectedNullifier), 'verifiedProofs map contains nullifier');

    // Privacy boundary assertions
    const txStateChangesStr = JSON.stringify(proveRes.stateChanges || []);
    const rawCredentialHex = rawCredentialBytes.toString('hex');
    assert.strictEqual(
      txStateChangesStr.includes(rawCredentialHex), 
      false, 
      'Raw credential must not leak in state changes'
    );
    assert.strictEqual(
      txStateChangesStr.includes(Buffer.from(expectedCommitment).toString('hex')),
      false,
      'Original commitment must not leak in proof state changes'
    );
  });

  it('Edge case: unissued credential fails proveCredentialValid', async () => {
    const rawCredentialBytes = randomBytes(32);
    const credentialSaltBytes = randomBytes(32);
    const nullifierSaltBytes = randomBytes(32);

    const witnesses = {
      credential: (context) => [context.privateState, rawCredentialBytes],
      credentialSalt: (context) => [context.privateState, credentialSaltBytes],
      nullifierSalt: (context) => [context.privateState, nullifierSaltBytes],
    };

    const contract = new Credentials.Contract(witnesses);
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

    // Attempt to prove without issuing first
    assert.throws(
      () => {
        contract.circuits.proveCredentialValid(circuitContext);
      },
      /Credential is not registered|Execution failed/,
      'Circuit correctly rejected unissued credential'
    );
  });
});
