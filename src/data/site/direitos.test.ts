import { describe, expect, it } from 'vitest';
import { bolsaEstimate, check, reais, type Answers } from './direitos';

const base: Answers = {
  people: 1, income: 0, kidsUpTo6: 0, kids7to17: 0,
  pregnantOrNursing: false, medicalDevice: false, receivesBolsa: false, cadunico: 'no',
};
const ids = (a: Partial<Answers>) => check({ ...base, ...a }).benefits.map(b => b.id);

describe('direitos', () => {
  it('divide a renda da casa pelo número de pessoas', () => {
    expect(check({ ...base, people: 3, income: 1000 }).perPerson).toBe(333.33);
  });

  it('Bolsa Família até R$ 218 por pessoa, e não um centavo acima', () => {
    expect(ids({ people: 2, income: 436 })).toContain('bolsa');
    expect(ids({ people: 2, income: 437 })).not.toContain('bolsa');
  });

  it('estimativa do Bolsa Família: piso de R$ 600, mais criança, jovem e gestante', () => {
    expect(bolsaEstimate({ people: 2, kidsUpTo6: 0, kids7to17: 0, pregnantOrNursing: false })).toBe(600);
    expect(bolsaEstimate({ people: 5, kidsUpTo6: 1, kids7to17: 2, pregnantOrNursing: true })).toBe(710 + 150 + 150);
  });

  it('Regra de Proteção só pra quem já recebe e ganha até R$ 706 por pessoa', () => {
    expect(ids({ people: 2, income: 1000, receivesBolsa: true })).toContain('protecao');
    expect(ids({ people: 2, income: 1000 })).not.toContain('protecao');
    expect(ids({ people: 2, income: 1413, receivesBolsa: true })).not.toContain('protecao');
  });

  it('Gás do Povo pede 2 pessoas ou mais e muda a frequência com 4', () => {
    expect(ids({ people: 1, income: 0 })).not.toContain('gas');
    const gas = (people: number) => check({ ...base, people }).benefits.find(b => b.id === 'gas')!.what;
    expect(gas(3)).toContain('1 a cada 3 meses');
    expect(gas(4)).toContain('1 a cada 2 meses');
  });

  it('Gás do Povo por enquanto só pra família do Bolsa Família, ou com renda pra entrar nele', () => {
    expect(ids({ people: 2, income: 1000 })).not.toContain('gas');
    expect(ids({ people: 2, income: 1000, receivesBolsa: true })).toContain('gas');
    expect(ids({ people: 2, income: 436 })).toContain('gas');
  });

  it('luz de graça até meio salário mínimo; desconto até um salário mínimo; nada acima', () => {
    expect(ids({ income: 810.5 })).toContain('luz');
    expect(ids({ income: 811 })).toEqual(['cadunico', 'luz-desconto']);
    expect(ids({ income: 1621 })).toEqual(['cadunico', 'luz-desconto']);
    expect(ids({ income: 1622 })).toEqual([]);
  });

  it('aparelho médico dá luz de graça com renda da casa até 3 salários mínimos', () => {
    expect(ids({ people: 2, income: 4863, medicalDevice: true })).toContain('luz');
    expect(ids({ people: 2, income: 4864, medicalDevice: true })).not.toContain('luz');
  });

  it('o CadÚnico vem primeiro sempre que aparece algum benefício', () => {
    expect(ids({ people: 4, income: 700 })).toEqual(['cadunico', 'bolsa', 'gas', 'luz', 'agua']);
    expect(ids({ income: 1500 })[0]).toBe('cadunico');
  });

  it('pede pra atualizar o CadÚnico quando ele falta, venceu ou a pessoa não sabe', () => {
    expect(check({ ...base, cadunico: 'recent' }).updateCadunico).toBe(false);
    expect(check({ ...base, cadunico: 'old' }).updateCadunico).toBe(true);
    expect(check({ ...base, cadunico: 'unknown', income: 5000 }).updateCadunico).toBe(false);
  });

  it('escreve dinheiro do jeito brasileiro', () => {
    expect(reais(1621)).toBe('R$ 1.621');
    expect(reais(810.5)).toBe('R$ 810,50');
  });

  it('todo benefício leva a fonte oficial', () => {
    for (const b of check({ ...base, people: 4, income: 0, receivesBolsa: true }).benefits) {
      expect(b.source.url).toMatch(/^https:\/\/www\.(gov|planalto\.gov)\.br\//);
    }
  });
});
