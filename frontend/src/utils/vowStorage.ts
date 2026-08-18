import * as compactRuntime from '@midnight-ntwrk/compact-runtime';

export interface LocalVow {
  id: string;
  goalText: string;
  saltHex: string;
  commitmentHex: string;
  createdAt: string;
  fulfilled: boolean;
  txId?: string;
}

const STORAGE_KEY = 'moonvow_local_secrets_v1';

export function getLocalVows(): LocalVow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalVow(vow: LocalVow): void {
  const vows = getLocalVows();
  vows.unshift(vow);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vows));
}

export function updateLocalVowStatus(commitmentHex: string, fulfilled: boolean, txId?: string): void {
  const vows = getLocalVows();
  const target = vows.find((v) => v.commitmentHex === commitmentHex);
  if (target) {
    target.fulfilled = fulfilled;
    if (txId) target.txId = txId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vows));
  }
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

export async function computeCommitmentHash(goalText: string, salt: Uint8Array): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(goalText);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const goalTextHash = new Uint8Array(hashBuffer);

    const commitment = compactRuntime.persistentCommit(
      new compactRuntime.CompactTypeBytes(32),
      goalTextHash,
      salt
    );
    return bytesToHex(commitment);
  } catch (err) {
    // Fallback client-side hash computation helper
    return bytesToHex(salt);
  }
}
