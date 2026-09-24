import { ed25519, ed25519ph } from '@noble/curves/ed25519.js';

// Public witnesses with no coin (D038): Sigstore Rekor and an RFC 3161 time authority.

export const REKOR_URL = 'https://rekor.sigstore.dev/api/v1/log/entries';
export const TSA_URL = 'https://freetsa.org/tsr';

const SHA256_OID = Uint8Array.of(0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01);

export type StampWitness = {
  registry: 'Sigstore Rekor';
  id: string;
  seenAt: string;
  url: string;
  rfc3161: { url: string; time: string };
};

function concat(parts: Uint8Array[]): Uint8Array {
  const size = parts.reduce((total, part) => total + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}

function der(tag: number, content: Uint8Array): Uint8Array {
  const length = content.length < 128
    ? Uint8Array.of(content.length)
    : Uint8Array.of(0x80 | (content.length > 255 ? 2 : 1), ...(content.length > 255 ? [content.length >> 8, content.length & 0xff] : [content.length]));
  return concat([Uint8Array.of(tag), length, content]);
}

function seq(parts: Uint8Array[]): Uint8Array {
  return der(0x30, concat(parts));
}

export function publicPem(publicKeyHex: string): string {
  const raw = Uint8Array.from(publicKeyHex.match(/../g)!, (byte) => parseInt(byte, 16));
  const spki = seq([
    seq([Uint8Array.of(0x06, 0x03, 0x2b, 0x65, 0x70)]),
    der(0x03, concat([Uint8Array.of(0x00), raw])),
  ]);
  const body = btoa(String.fromCharCode(...spki));
  return `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----\n`;
}

function base64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function hex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Ed25519ph over the checkpoint bytes. Rekor rejects a pure Ed25519 signature. */
export function signForRekor(seed: Uint8Array, message: Uint8Array): Uint8Array {
  return ed25519ph.sign(message, seed);
}

export function publicKeyHexFromSeed(seed: Uint8Array): string {
  return hex(ed25519.getPublicKey(seed));
}

export function rekorHashedRekord(hashHex: string, signature: Uint8Array, publicKeyHex: string) {
  const pem = publicPem(publicKeyHex);
  return {
    apiVersion: '0.0.1',
    kind: 'hashedrekord',
    spec: {
      data: { hash: { algorithm: 'sha512', value: hashHex } },
      signature: {
        content: base64(signature),
        publicKey: { content: base64(new TextEncoder().encode(pem)) },
      },
    },
  };
}

export async function readRekorResponse(response: Response, fetchImpl: typeof fetch): Promise<{ id: string; seenAt: string; url: string } | null> {
  if (response.ok) return parseRekor(await response.json());
  if (response.status !== 409) return null;
  const location = response.headers.get('location');
  if (!location) return null;
  let url: URL;
  try { url = new URL(location, REKOR_URL); } catch { return null; }
  if (url.protocol !== 'https:' || url.host !== new URL(REKOR_URL).host) return null;
  const found = await fetchImpl(url);
  if (!found.ok) return null;
  return parseRekor(await found.json());
}

export function parseRekor(body: unknown): { id: string; seenAt: string; url: string } | null {
  if (!body || typeof body !== 'object') return null;
  const entries = Object.entries(body as Record<string, unknown>);
  const first = entries[0];
  if (!first || entries.length !== 1 || !/^[0-9a-f]+$/i.test(first[0])) return null;
  const value = first[1];
  if (!value || typeof value !== 'object' || typeof (value as { integratedTime?: unknown }).integratedTime !== 'number') return null;
  const seenAt = new Date((value as { integratedTime: number }).integratedTime * 1000).toISOString();
  return { id: first[0], seenAt, url: `${REKOR_URL}/${first[0]}` };
}

/** RFC 3161 TimeStampReq over a SHA-256 digest. */
export function timestampQuery(hash: Uint8Array): Uint8Array {
  const imprint = seq([
    seq([SHA256_OID, Uint8Array.of(0x05, 0x00)]),
    der(0x04, hash),
  ]);
  return seq([Uint8Array.of(0x02, 0x01, 0x01), imprint, Uint8Array.of(0x01, 0x01, 0xff)]);
}

export function timeFromTimestampReply(reply: Uint8Array): string | null {
  for (let i = 0; i < reply.length - 16; i++) {
    if (reply[i] === 0x18 && reply[i + 1] === 15) {
      const text = String.fromCharCode(...reply.slice(i + 2, i + 17));
      const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(text);
      if (match) return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.000Z`;
    }
  }
  return null;
}

async function sha512Hex(text: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-512', new TextEncoder().encode(text)));
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function stampCheckpoint(canonical: string, seed: Uint8Array, publicKeyHex: string, fetchImpl: typeof fetch = fetch): Promise<StampWitness> {
  if (publicKeyHexFromSeed(seed) !== publicKeyHex) throw new Error('A chave de assinatura não é a chave publicada.');
  const message = new TextEncoder().encode(canonical);
  const signature = signForRekor(seed, message);
  const rekor = await fetchImpl(REKOR_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(rekorHashedRekord(await sha512Hex(canonical), signature, publicKeyHex)),
  });
  const entry = await readRekorResponse(rekor, fetchImpl);
  if (!entry) throw new Error('O registro público recusou o checkpoint.');
  const sha256 = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical)));
  const query = timestampQuery(sha256);
  const tsa = await fetchImpl(TSA_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/timestamp-query', accept: 'application/timestamp-reply' },
    body: Uint8Array.from(query),
  });
  if (!tsa.ok) throw new Error('A autoridade de tempo recusou o carimbo.');
  const time = timeFromTimestampReply(new Uint8Array(await tsa.arrayBuffer()));
  if (!time) throw new Error('O carimbo de tempo veio sem data.');
  return { registry: 'Sigstore Rekor', id: entry.id, seenAt: entry.seenAt, url: entry.url, rfc3161: { url: 'https://freetsa.org', time } };
}
