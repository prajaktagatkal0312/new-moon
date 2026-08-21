import * as compactRuntime from '@midnight-ntwrk/compact-runtime';

export interface EligibilityRecord {
  id: string;
  privateValue: number;
  saltHex: string;
  commitmentHex: string;
  createdAt: string;
  verified: boolean;
  txId?: string;
}

const STORAGE_KEY = 'eligibility_local_secrets_v1';

export function getRecords(): EligibilityRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecord(record: EligibilityRecord): void {
  const records = getRecords();
  records.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function generateRandomSalt(): Uint8Array {
  const salt = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(salt);
  } else {
    for (let i = 0; i < 32; i++) {
      salt[i] = Math.floor(Math.random() * 256);
    }
  }
  return salt;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function computeCommitmentHash(privateValue: number, salt: Uint8Array): string {
  try {
    const commitment = compactRuntime.persistentCommit(
      new compactRuntime.CompactTypeUnsignedInteger((2n ** 32n) - 1n, 4),
      BigInt(privateValue),
      salt
    );
    return bytesToHex(commitment);
  } catch (err) {
    return bytesToHex(salt);
  }
}
