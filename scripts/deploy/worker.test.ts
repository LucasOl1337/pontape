import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from './worker.js';
import { YUMI_SYSTEM } from './yumi.js';
import { YUMI_KNOWLEDGE } from './yumi-knowledge.js';
import { FAQ } from '../../src/data/site/perguntas';

const request = (messages: unknown) => new Request('http://localhost/api/chat', {
  method: 'POST', headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '192.0.2.4' },
  body: JSON.stringify({ messages }),
});
const env = (secret = 'test-only') => ({ NINEROUTER_TOKEN: secret,
  CHAT_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) },
  ASSETS: { fetch: vi.fn() },
});

afterEach(() => vi.unstubAllGlobals());

describe('Yume no Worker', () => {
  it('não expõe chave e recusa mensagem longa', async () => {
    const missing = await worker.fetch(request([{ role: 'user', content: 'Olá' }]), env(''));
    expect(missing.status).toBe(503);
    expect(await missing.text()).not.toContain('test-only');
    const long = await worker.fetch(request([{ role: 'user', content: 'a'.repeat(601) }]), env());
    expect(long.status).toBe(400);
  });

  it('aplica o limite antes de chamar o gateway', async () => {
    const limited = env();
    limited.CHAT_RATE_LIMITER.limit.mockResolvedValue({ success: false });
    const upstream = vi.fn();
    vi.stubGlobal('fetch', upstream);
    const result = await worker.fetch(request([{ role: 'user', content: 'Como funciona?' }]), limited);
    expect(result.status).toBe(429);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('não repassa dado pessoal e não guarda a resposta', async () => {
    const upstream = vi.fn();
    vi.stubGlobal('fetch', upstream);
    const result = await worker.fetch(request([{ role: 'user', content: 'Meu e-mail é pessoa@example.com' }]), env());
    expect(result.status).toBe(200);
    expect(result.headers.get('cache-control')).toBe('no-store');
    expect(result.headers.get('x-yumi-private')).toBe('1');
    expect(await result.text()).toContain('Não guardo nem uso dados pessoais');
    expect(upstream).not.toHaveBeenCalled();
  });

  it('usa o segundo modelo quando o primeiro falha e entrega SSE', async () => {
    const upstream = vi.fn()
      .mockResolvedValueOnce(new Response('indisponível', { status: 503 }))
      .mockResolvedValueOnce(new Response('data: {"choices":[{"delta":{"content":"Olá"}}]}\n\ndata: [DONE]\n\n'));
    vi.stubGlobal('fetch', upstream);
    const result = await worker.fetch(request([{ role: 'user', content: 'O que é o projeto?' }]), env());
    expect(result.status).toBe(200);
    expect(result.headers.get('content-type')).toContain('text/event-stream');
    expect(await result.text()).toContain('Olá');
    const sent = upstream.mock.calls.map(call => JSON.parse(String(call[1]?.body)));
    expect(sent[0]?.model).toBe('cc/claude-haiku-4-5-20251001');
    expect(sent[1]?.model).toBe('cx/gpt-5.4-mini');
    expect(sent[0]?.messages[0].role).toBe('system');
  });

  it('mantém a doação fechada e não copia pessoa do aviso', async () => {
    const closed = await worker.fetch(new Request('http://localhost/api/doar', { method: 'POST' }), env());
    expect(closed.status).toBe(403);
    const upstream = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', upstream);
    const webhook = await worker.fetch(new Request('http://localhost/api/asaas/webhook', {
      method: 'POST',
      headers: { 'asaas-access-token': 'token-ficticio', 'content-type': 'application/json' },
      body: JSON.stringify({
        event: 'PAYMENT_RECEIVED',
        payment: {
          id: 'pay_ficticio_1', value: 20, netValue: 18.01, paymentDate: '2000-01-01',
          name: 'Pessoa Fictícia', email: 'pessoa.ficticia@example.com', cpfCnpj: '00000000000',
        },
      }),
    }), { ...env(), ASAAS_WEBHOOK_TOKEN: 'token-ficticio', LEDGER_DISPATCH_TOKEN: 'dispatch-ficticio' });
    expect(webhook.status).toBe(200);
    const sent = String(upstream.mock.calls[0]?.[1]?.body);
    expect(sent).toContain('pay_ficticio_1');
    expect(sent).not.toContain('Pessoa');
    expect(sent).not.toContain('pessoa.ficticia@example.com');
    expect(sent).not.toContain('00000000000');
  });

  it('gera conhecimento público sem nomes pessoais nem termos vetados', () => {
    expect(FAQ).toHaveLength(9);
    for (const item of FAQ) expect(YUMI_KNOWLEDGE).toContain(item.q);
    expect(YUMI_KNOWLEDGE).not.toMatch(/\bLucas\b|Oliveira|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
    expect(YUMI_SYSTEM).not.toMatch(/\bIA\b|Bitcoin/i);
    expect(YUMI_SYSTEM).toContain('Ninguém é atendido e nenhuma doação é recebida hoje.');
  });
});
