import { describe, expect, it } from 'vitest';
import { checkoutRequest, checkoutUrl, envelopesFromStatement, envelopesFromWebhook, reaisToCents, statementGap } from './asaas';

/** Fictitious Asaas webhook. Not a real payment and not a real person. */
const fictitiousPayment = {
  id: 'evt_ficticio_1',
  event: 'PAYMENT_RECEIVED',
  dateCreated: '2000-01-01 12:00:00',
  payment: {
    id: 'pay_ficticio_1',
    value: 20,
    netValue: 18.01,
    billingType: 'PIX',
    status: 'RECEIVED',
    paymentDate: '2000-01-01',
    customer: 'cus_ficticio',
    name: 'Pessoa Fictícia',
    email: 'pessoa.ficticia@example.com',
    cpfCnpj: '00000000000',
  },
};

describe('Asaas sandbox (F42 E3)', () => {
  it('separa bruto e tarifa e não copia nome, CPF ou e-mail', () => {
    expect(reaisToCents(18.01)).toBe(1801n);
    const parsed = envelopesFromWebhook(fictitiousPayment);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.envelopes.map(item => {
      if (item.payload.type !== 'finance') return [];
      return [item.eventId, item.payload.amountCents, item.payload.category];
    })).toEqual([
      ['pay_ficticio_1', '2000', 'donation'],
      ['pay_ficticio_1:fee', '-199', 'fee'],
    ]);
    const text = JSON.stringify(parsed.envelopes);
    expect(text).not.toContain('Pessoa');
    expect(text).not.toContain('pessoa.ficticia@example.com');
    expect(text).not.toContain('00000000000');
    expect(text).not.toContain('cus_ficticio');
  });

  it('ignora o aviso de checkout e recusa valor quebrado', () => {
    expect(envelopesFromWebhook({ event: 'CHECKOUT_PAID', checkout: { id: 'c_ficticio' } })).toEqual({ ok: true, envelopes: [] });
    expect(envelopesFromWebhook({ event: 'PAYMENT_RECEIVED', payment: { id: 'pay_x', value: 20.001, netValue: 18, paymentDate: '2000-01-01' } }).ok).toBe(false);
  });

  it('monta o checkout hospedado sem dados de pessoa', () => {
    const body = checkoutRequest(2000, 'https://pontape.org');
    expect(body?.items[0]?.value).toBe(20);
    expect(JSON.stringify(body)).not.toContain('customer');
    expect(checkoutRequest(1500, 'https://pontape.org')).toBeNull();
    expect(checkoutUrl('https://api-sandbox.asaas.com/v3', 'chk_ficticio')).toBe('https://sandbox.asaas.com/checkoutSession/show?id=chk_ficticio');
  });

  it('acha no extrato o que falta no livro e não apaga o que o extrato esqueceu', () => {
    const envelopes = envelopesFromStatement([
      { type: 'PAYMENT_RECEIVED', paymentId: 'pay_ficticio_2', value: 20, date: '2000-01-02' },
      { type: 'PAYMENT_FEE', paymentId: 'pay_ficticio_2', value: -1.99, date: '2000-01-02' },
    ]);
    const gap = statementGap(envelopes, ['asaas:pay_ficticio_1', 'asaas:pay_ficticio_2']);
    expect(gap.missingInBook.map(item => item.eventId)).toEqual(['pay_ficticio_2:fee']);
    expect(gap.missingInStatement).toEqual(['asaas:pay_ficticio_1']);
  });
});
