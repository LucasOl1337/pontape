import { describe, expect, it } from 'vitest';
import fixture from '../../data/ledger/example.fixture.json';
import { ledgerPayloadSchema, projectSourceUrl } from './schema';

describe('contrato público do livro', () => {
  it('aceita as quatro famílias fictícias', () => {
    expect(fixture.notice).toContain('DADOS FICTÍCIOS');
    expect(fixture.payloads.map((payload) => ledgerPayloadSchema.parse(payload).type))
      .toEqual(['project', 'finance', 'field', 'candidate']);
  });

  for (const field of ['cpf', 'name', 'candidateId', 'pseudonym', 'location', 'notes', 'metadata', 'sourceUrl']) {
    it(`rejeita ${field} em cada família`, () => {
      for (const payload of fixture.payloads) {
        expect(ledgerPayloadSchema.safeParse({ ...payload, [field]: 'DADO FICTÍCIO' }).success).toBe(false);
      }
    });
  }

  it('rejeita texto livre, data inválida e inteiro não canônico', () => {
    expect(ledgerPayloadSchema.safeParse({ ...fixture.payloads[0], action: 'qualquer texto' }).success).toBe(false);
    expect(ledgerPayloadSchema.safeParse({ ...fixture.payloads[0], occurredOn: '2000-02-30' }).success).toBe(false);
    for (const amountCents of ['0', '-0', '01', '1.1', 100, '1e3']) {
      expect(ledgerPayloadSchema.safeParse({ ...fixture.payloads[1], amountCents }).success).toBe(false);
    }
  });

  it('mantém precisão inteira além do limite de Number', () => {
    const payload = ledgerPayloadSchema.parse({ ...fixture.payloads[1], amountCents: '9007199254740993' });
    expect(payload.type === 'finance' && payload.amountCents).toBe('9007199254740993');
  });

  it('deriva fontes apenas do repositório do projeto', () => {
    const payload = ledgerPayloadSchema.parse(fixture.payloads[0]);
    expect(projectSourceUrl(payload)).toBe('https://github.com/LucasOl1337/VidaNova/blob/0000000000000000000000000000000000000000/docs/DECISOES.md');
    expect(projectSourceUrl(ledgerPayloadSchema.parse(fixture.payloads[3]))).toBeNull();
  });
});
