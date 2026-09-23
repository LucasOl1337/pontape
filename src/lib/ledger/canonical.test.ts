import { describe, expect, it } from 'vitest';
import { canonicalize, parseCanonicalJson, parseJson } from './canonical';
import { sha256 } from './verify';

describe('JCS e entrada JSON', () => {
  it('ordena chaves UTF-16 recursivamente sem ordenar arrays', () => {
    expect(canonicalize({ z: [{ b: 2, a: 1 }, 0], '2': 2, '10': 10, a: '\n' }))
      .toBe('{"10":10,"2":2,"a":"\\n","z":[{"a":1,"b":2},0]}');
    expect(canonicalize({ '\ufb33': 1, '😀': 2, '\r': 3, '€': 4 }))
      .toBe('{"\\r":3,"€":4,"😀":2,"דּ":1}');
  });
  it('preserva a serialização numérica ECMAScript, sem normalizar Unicode', () => {
    expect(canonicalize([Number('333333333.33333329'), 1e30, 4.50, 2e-3, 1e-27, -0]))
      .toBe('[333333333.3333333,1e+30,4.5,0.002,1e-27,0]');
    expect(canonicalize('e\u0301')).not.toBe(canonicalize('é'));
  });
  it.each([NaN, Infinity, undefined, 1n, '\ud800', '\udfff', new Date(), Array(2)])('rejeita valor fora de JSON: %s', (value) => {
    expect(() => canonicalize(value)).toThrow();
  });
  it('rejeita ciclos, chaves Unicode inválidas e propriedades indefinidas', () => {
    const cyclic: Record<string, unknown> = {}; cyclic.self = cyclic;
    expect(() => canonicalize(cyclic)).toThrow();
    expect(() => canonicalize({ '\ud800': 1 })).toThrow();
    expect(() => canonicalize({ key: undefined })).toThrow();
  });
  it('rejeita chaves duplicadas, inclusive escapadas e aninhadas', () => {
    for (const input of ['{"a":1,"a":2}', '{"a":1,"\\u0061":2}', '[{"x":{"a":1,"a":2}}]', '{"x":1e999}']) {
      expect(() => parseJson(input)).toThrow();
    }
    expect(parseJson(' { "a": [], "b": [{"a":"c\\"d"}, {"a":2}] } ')).toEqual({ a: [], b: [{ a: 'c"d' }, { a: 2 }] });
  });
  it('exige bytes canônicos nos arquivos publicados', () => {
    expect(parseCanonicalJson('{"a":1,"b":2}')).toEqual({ a: 1, b: 2 });
    expect(() => parseCanonicalJson('{"b":2,"a":1}')).toThrow();
    expect(() => parseCanonicalJson('{"a":1}\n')).toThrow();
  });
  it('bate com o vetor SHA-256 de abc', async () => {
    expect(await sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
