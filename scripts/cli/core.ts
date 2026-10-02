import process from 'node:process';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import type { Command } from './catalog.ts';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const CONTRACT_VERSION = 1;
export const MAX_INPUT = 32 * 1024 * 1024;
export type Values = Record<string, string | boolean | undefined>;
export interface Context { command: Command; values: Values; cwd: string }
export class CliError extends Error {
  code: string;
  exitCode: number;
  details: unknown;
  constructor(code: string, message: string, exitCode = 1, details?: unknown) {
    super(message); this.code = code; this.exitCode = exitCode; this.details = details;
  }
}
export function usage(message: string): never { throw new CliError('USAGE', message, 2); }
export function str(values: Values, key: string): string | undefined {
  return typeof values[key] === 'string' ? values[key] as string : undefined;
}
export function integer(value: string | undefined, fallback: number, min = 1, max = Number.MAX_SAFE_INTEGER): number {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < min || Number(value) > max) usage(`Use um inteiro entre ${min} e ${max}.`);
  return Number(value);
}
export function inputPath(ctx: Context, key: string): string | undefined {
  const path = str(ctx.values, key); return path === undefined ? undefined : resolve(ctx.cwd, path);
}
export async function stdinText(limit = MAX_INPUT): Promise<string> {
  if (process.stdin.isTTY) usage('Este comando espera dados em stdin por pipe ou redirecionamento.');
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of process.stdin) {
    const bytes = Buffer.from(chunk); size += bytes.length;
    if (size > limit) throw new CliError('INPUT_TOO_LARGE', 'Entrada excede o limite.');
    chunks.push(bytes);
  }
  return Buffer.concat(chunks).toString('utf8');
}
export async function textFile(path: string): Promise<string> {
  if ((await stat(path)).size > MAX_INPUT) throw new CliError('INPUT_TOO_LARGE', 'Arquivo excede 32 MiB.');
  return readFile(path, 'utf8');
}
export async function jsonInput(ctx: Context): Promise<unknown> {
  const file = str(ctx.values, 'input');
  if (!file) usage('Use --input arquivo.json ou --input -.');
  const raw = file === '-' ? await stdinText() : await textFile(resolve(ctx.cwd, file));
  try { return JSON.parse(raw); } catch { throw new CliError('INVALID_JSON', 'Entrada não é JSON válido.', 2); }
}
export function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function redact(text: string): string {
  let result = text;
  for (const [name, value] of Object.entries(process.env)) {
    if (value && /TOKEN|PASSWORD|SECRET|PKCS8|(?:^|_)KEY$/.test(name)) result = result.replaceAll(value, '[oculto]');
  }
  return result.replace(/pontape_admin=[^\s;"']+/g, 'pontape_admin=[oculto]');
}
