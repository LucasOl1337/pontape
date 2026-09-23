import { describe, expect, it } from 'vitest';
import snapshot from '../data/transparency.json';
import { transparencySnapshotSchema } from './transparency';

describe('snapshot público da F1', () => {
  it('aceita o arquivo versionado com zero, estado e data válidos', () => {
    expect(transparencySnapshotSchema.parse(snapshot)).toEqual(snapshot);
    expect(Object.keys(snapshot).sort()).toEqual([
      'asOf', 'currency', 'donationsEnabled', 'receivedCents',
      'schemaVersion', 'spentCents', 'status',
    ]);
  });

  it.each(['cpf', 'name', 'candidateId', 'notes', 'metadata'])(
    'rejeita o campo não permitido %s em vez de descartá-lo', (key) => {
      expect(() => transparencySnapshotSchema.parse({
        ...snapshot, [key]: 'DADO FICTÍCIO PARA TESTE',
      })).toThrow();
    },
  );

  it.each([
    { receivedCents: 1 },
    { spentCents: -1 },
    { donationsEnabled: true },
    { status: 'DADO FICTÍCIO PARA TESTE' },
    { currency: 'USD' },
    { schemaVersion: 2 },
    { asOf: '2026-02-30' },
    { asOf: 'ontem' },
    { status: { name: 'DADO FICTÍCIO PARA TESTE' } },
  ])('rejeita conteúdo incompatível: %j', (change) => {
    expect(transparencySnapshotSchema.safeParse({ ...snapshot, ...change }).success)
      .toBe(false);
  });

  it.each(Object.keys(snapshot))('rejeita a ausência de %s', (key) => {
    const incomplete = Object.fromEntries(
      Object.entries(snapshot).filter(([field]) => field !== key),
    );
    expect(transparencySnapshotSchema.safeParse(incomplete).success).toBe(false);
  });
});
