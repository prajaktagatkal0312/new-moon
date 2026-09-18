import { Buffer } from 'buffer';

export function getOrGenerateSalts(credStr: string) {
  const key = 'salts_' + Buffer.from(credStr).toString('hex');
  const existing = localStorage.getItem(key);
  if (existing) {
     const parsed = JSON.parse(existing);
     return { 
       cSalt: new Uint8Array(Buffer.from(parsed.cSalt, 'hex')), 
       nSalt: new Uint8Array(Buffer.from(parsed.nSalt, 'hex')) 
     };
  }
  const cSalt = crypto.getRandomValues(new Uint8Array(32));
  const nSalt = crypto.getRandomValues(new Uint8Array(32));
  localStorage.setItem(key, JSON.stringify({
     cSalt: Buffer.from(cSalt).toString('hex'),
     nSalt: Buffer.from(nSalt).toString('hex')
  }));
  return { cSalt, nSalt };
}
