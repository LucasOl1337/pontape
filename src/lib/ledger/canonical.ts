/** RFC 8785: UTF-16 key order, ECMAScript primitives, UTF-8 at the hash boundary. */
export function canonicalize(value: unknown): string {
  const ancestors = new Set<object>();
  function string(value: string): string {
    if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value)) {
      throw new Error('Unicode inválido.');
    }
    return JSON.stringify(value);
  }
  function visit(value: unknown): string {
    if (value === null) return 'null';
    if (typeof value === 'string') return string(value);
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
    if (typeof value !== 'object' || ancestors.has(value)) throw new Error('Valor fora de JSON.');
    ancestors.add(value);
    let result: string;
    if (Array.isArray(value)) {
      result = `[${Array.from(value, visit).join(',')}]`;
    } else {
      if (![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new Error('Objeto fora de JSON.');
      const record = value as Record<string, unknown>;
      result = `{${Object.keys(record).sort().map((key) => `${string(key)}:${visit(record[key])}`).join(',')}}`;
    }
    ancestors.delete(value);
    return result;
  }
  return visit(value);
}

/** Native syntax parsing followed by a token walk to reject duplicate object keys. */
export function parseJson(text: string): unknown {
  const parsed: unknown = JSON.parse(text);
  const tokens = text.match(/"(?:[^"\\]|\\.)*"|[{}[\],:]|[^\s{}[\],:]+/g) ?? [];
  let position = 0;
  function walk(depth: number): void {
    if (depth > 64) throw new Error('JSON muito profundo.');
    const token = tokens[position++];
    if (token === '{') {
      const keys = new Set<string>();
      while (tokens[position] !== '}') {
        const key: string = JSON.parse(tokens[position++]!);
        if (keys.has(key)) throw new Error('Campo JSON repetido.');
        keys.add(key);
        position++; // Colon; syntax already validated by JSON.parse.
        walk(depth + 1);
        if (tokens[position] !== ',') break;
        position++;
      }
      position++;
    } else if (token === '[') {
      while (tokens[position] !== ']') {
        walk(depth + 1);
        if (tokens[position] !== ',') break;
        position++;
      }
      position++;
    }
  }
  walk(0);
  canonicalize(parsed); // Reject invalid Unicode and non-finite parsed numbers.
  return parsed;
}

/** Files published by the ledger are exactly JCS bytes, with no trailing newline. */
export function parseCanonicalJson(text: string): unknown {
  const value = parseJson(text);
  if (canonicalize(value) !== text) throw new Error('Arquivo não está em JSON canônico.');
  return value;
}
