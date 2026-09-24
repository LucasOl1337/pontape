// Public half only. The private key lives in the GitHub secret LEDGER_SIGNING_PKCS8.
export const SIGNING_PUBLIC_KEY = 'e332cae4d252fca11d48f183027c134e565b908a099e94a1a112a5ed41ecb0b6';
// F25 key, kept published after the rotation on 24/09/2026.
export const PREVIOUS_SIGNING_PUBLIC_KEY = 'ab8b5cfb6bf0f218e2514fe47fa9a014827376ec9f0c556bcb1df3a3c3d81dc6';

const SPKI_PREFIX = Uint8Array.of(0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00);

export function publicKeyPem(hex: string): string {
  const raw = Uint8Array.from(hex.match(/../g)!, (byte) => parseInt(byte, 16));
  const spki = new Uint8Array(SPKI_PREFIX.length + raw.length);
  spki.set(SPKI_PREFIX);
  spki.set(raw, SPKI_PREFIX.length);
  const body = btoa(String.fromCharCode(...spki));
  return `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----\n`;
}
