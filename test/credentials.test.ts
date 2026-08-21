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
    // 1. Setup simulated ledger state
    const validCredentials = new compactRuntime.LedgerMap();
    const verifiedProofs = new compactRuntime.LedgerMap();

    // 2. Create private witness data (the credential, cred salt, and nullifier salt)
    const rawCredentialBytes = randomBytes(32);
    const credentialSaltBytes = randomBytes(32);
    const nullifierSaltBytes = randomBytes(32);

    // Provide witness callback
    const witnessProvider = {
      credential: () => rawCredentialBytes,
      credentialSalt: () => credentialSaltBytes,
      nullifierSalt: () => nullifierSaltBytes,
    };

    // 3. Issue the credential
    const issueContext = new compactRuntime.CircuitContext(
      {
        validCredentials,
        verifiedProofs,
      },
      witnessProvider
    );

    const issueResult = await Credentials.circuits.issueCredential(issueContext);
    assert.strictEqual(issueResult.transaction.isSuccess, true, 'Issue circuit should succeed');
    
    // Apply state changes from issue
    for (const change of issueResult.stateChanges) {
      if (change.tag === 'insert') {
        validCredentials.insert(change.key, change.value);
      }
    }

    // 4. Prove the credential is valid
    const proveContext = new compactRuntime.CircuitContext(
      {
        validCredentials,
        verifiedProofs,
      },
      witnessProvider
    );

    const proveResult = await Credentials.circuits.proveCredentialValid(proveContext);
    assert.strictEqual(proveResult.transaction.isSuccess, true, 'Prove circuit should succeed');
    
    // Privacy boundary assertions: ensure the raw credential is not in the transaction output
    const txStateChangesStr = JSON.stringify(proveResult.stateChanges);
    const rawCredentialHex = rawCredentialBytes.toString('hex');
    
    assert.strictEqual(
      txStateChangesStr.includes(rawCredentialHex), 
      false, 
      'Raw credential must not leak in state changes'
    );
    
    // Calculate the original commitment and verify it's NOT in the prove result state changes
    // (proveCredentialValid only discloses the nullifier, not the commitment it checked)
    const commitment = compactRuntime.persistentCommit(
      new compactRuntime.CompactTypeBytes(32),
      rawCredentialBytes,
      credentialSaltBytes
    );
    
    assert.strictEqual(
      txStateChangesStr.includes(Buffer.from(commitment).toString('hex')),
      false,
      'Original commitment must not leak in proof state changes'
    );
  });

  it('Edge case: unissued credential fails proveCredentialValid', async () => {
    const validCredentials = new compactRuntime.LedgerMap();
    const verifiedProofs = new compactRuntime.LedgerMap();

    const rawCredentialBytes = randomBytes(32);
    const credentialSaltBytes = randomBytes(32);
    const nullifierSaltBytes = randomBytes(32);

    const witnessProvider = {
      credential: () => rawCredentialBytes,
      credentialSalt: () => credentialSaltBytes,
      nullifierSalt: () => nullifierSaltBytes,
    };

    const proveContext = new compactRuntime.CircuitContext(
      {
        validCredentials,
        verifiedProofs,
      },
      witnessProvider
    );

    // Attempt to prove without issuing first
    try {
      await Credentials.circuits.proveCredentialValid(proveContext);
      assert.fail('Proof should fail for an unissued credential');
    } catch (e) {
      assert.ok(e.message.includes('Assertion failed') || e.message.includes('Credential is not registered') || e.message.includes('Execution failed'), 'Circuit correctly rejected unissued credential');
    }
  });
});
