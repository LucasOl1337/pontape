import { canonicalize } from './canonical.ts';
import { fromHex, verifyCheckpointSignature, type SignedCheckpoint } from './signature.ts';
import type { LedgerCheckpoint } from './schema.ts';

function decodeBase64(value: string): Uint8Array<ArrayBuffer> {
  const bytes = Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
  return bytes;
}

export function pemBody(pem: string): Uint8Array<ArrayBuffer> {
  const body = pem.replace(/-----BEGIN [^-]+-----/g, '').replace(/-----END [^-]+-----/g, '').replace(/\s+/g, '');
  return decodeBase64(body);
}

export async function importPkcs8Pem(pem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('pkcs8', pemBody(pem), { name: 'Ed25519' }, false, ['sign']);
}

/** Last 32 bytes of an OpenSSL or WebCrypto Ed25519 PKCS8. */
export function ed25519Seed(pkcs8: Uint8Array): Uint8Array<ArrayBuffer> {
  if (pkcs8.length < 34 || pkcs8[pkcs8.length - 34] !== 0x04 || pkcs8[pkcs8.length - 33] !== 0x20) {
    throw new Error('PKCS8 Ed25519 sem semente reconhecida.');
  }
  return Uint8Array.from(pkcs8.subarray(pkcs8.length - 32));
}

export async function publicKeyMatches(privateKey: CryptoKey, publicKeyHex: string): Promise<boolean> {
  const data = new TextEncoder().encode('pontape-ledger-key-check');
  const signature = await crypto.subtle.sign('Ed25519', privateKey, data);
  const key = await crypto.subtle.importKey('raw', fromHex(publicKeyHex), { name: 'Ed25519' }, false, ['verify']);
  return crypto.subtle.verify('Ed25519', key, signature, data);
}

export async function signCheckpoint(checkpoint: LedgerCheckpoint, privateKey: CryptoKey, publicKeyHex: string): Promise<SignedCheckpoint> {
  const signature = new Uint8Array(await crypto.subtle.sign('Ed25519', privateKey, new TextEncoder().encode(canonicalize(checkpoint))));
  const signed = {
    schemaVersion: 1 as const, algorithm: 'Ed25519' as const, publicKey: publicKeyHex, checkpoint,
    signature: [...signature].map((byte) => byte.toString(16).padStart(2, '0')).join(''),
  };
  if (!await verifyCheckpointSignature(signed, publicKeyHex)) throw new Error('Assinatura não confere com a chave publicada.');
  return signed;
}
