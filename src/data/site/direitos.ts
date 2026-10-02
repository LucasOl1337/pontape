// The benefits tool (D045): fixed rules taken from the government's own pages, run only in the browser.
// Nothing typed here leaves the device (D012). The rules decide; nothing is guessed by an AI.
// Open to anyone, reached from step 4 of the staircase and the footer, never from the menu.
export const DIREITOS = { href: '/ferramentas/direitos', name: 'Quais direitos eu tenho?' } as const;

// Every value below changes by law or decree. Update the numbers and CHECKED together.
export const CHECKED = '2026-09-30';
export const MINIMUM_WAGE = 1621;
const HALF_WAGE = MINIMUM_WAGE / 2;
const BOLSA_LINE = 218;
const PROTECTION_LINE = 706;
const BOLSA = { perPerson: 142, floor: 600, earlyChild: 150, variable: 50 } as const;

export interface Source { label: string; url: string }
export const SOURCES = {
  cadunico: { label: 'gov.br: Inscrever-se no Cadastro Único', url: 'https://www.gov.br/pt-br/servicos/inscrever-se-no-cadastro-unico-para-programas-sociais-do-governo-federal' },
  bolsa: { label: 'gov.br: Receber o Bolsa Família', url: 'https://www.gov.br/pt-br/servicos/receber-o-bolsa-familia' },
  protecao: { label: 'MDS: Regra de Proteção', url: 'https://www.gov.br/mds/pt-br/acoes-e-programas/bolsa-familia/regra-de-protecao' },
  gas: { label: 'gov.br: Receber o Vale Gás', url: 'https://www.gov.br/pt-br/servicos/programa-gas-do-povo?id=13161&origem=servico' },
  luz: { label: 'Ministério de Minas e Energia: Luz do Povo', url: 'https://www.gov.br/mme/pt-br/luzdopovo' },
  agua: { label: 'ANA: Tarifa Social de Água e Esgoto', url: 'https://www.gov.br/ana/pt-br/assuntos/saneamento-basico/tarifa-social-de-agua-e-esgoto' },
  salario: { label: 'Planalto: salário mínimo de R$ 1.621 em 2026', url: 'https://www.gov.br/planalto/pt-br/acompanhe-o-planalto/noticias/2025/12/publicado-decreto-que-reajusta-salario-minimo-para-r-1-621-a-partir-de-1o-de-janeiro' },
  // Art. 4, § 1, III: the Bolsa Família itself does not count as income. The income question says so.
  lei: { label: 'Lei 14.601/2023, do Bolsa Família', url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/L14601.htm' },
} as const satisfies Record<string, Source>;

export type Cadunico = 'recent' | 'old' | 'no' | 'unknown';
export interface Answers {
  people: number;
  /** Money that comes into the house in a month, everyone together, in reais. */
  income: number;
  kidsUpTo6: number;
  kids7to17: number;
  pregnantOrNursing: boolean;
  medicalDevice: boolean;
  receivesBolsa: boolean;
  cadunico: Cadunico;
}

export interface Benefit {
  id: 'cadunico' | 'bolsa' | 'protecao' | 'gas' | 'luz' | 'luz-desconto' | 'agua';
  title: string;
  what: string;
  /** "cerca de R$ 750 por mês": an estimate, never a promise. */
  estimate?: string;
  steps: string[];
  papers?: string[];
  source: Source;
}

export interface Result {
  perPerson: number;
  benefits: Benefit[];
  /** The CadÚnico is missing, old or unknown while something depends on it. */
  updateCadunico: boolean;
}

export const reais = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

// The income as people write it: "600", "600,00", "1.200,50", even "600.00". The comma marks the
// cents; a dot is a thousands mark, unless only one or two digits come after it.
export function parseIncome(text: string): number {
  const s = text.replace(/[^\d.,]/g, '');
  const comma = s.lastIndexOf(',');
  const dot = s.lastIndexOf('.');
  const cut = comma >= 0 ? comma : /\.\d{1,2}$/.test(s) ? dot : -1;
  const whole = (cut >= 0 ? s.slice(0, cut) : s).replace(/\D/g, '');
  const cents = cut >= 0 ? s.slice(cut + 1).replace(/\D/g, '').slice(0, 2).padEnd(2, '0') : '00';
  return Number(whole || 0) + Number(cents) / 100;
}

export function bolsaEstimate(a: Pick<Answers, 'people' | 'kidsUpTo6' | 'kids7to17' | 'pregnantOrNursing'>): number {
  return Math.max(BOLSA.floor, BOLSA.perPerson * a.people)
    + BOLSA.earlyChild * a.kidsUpTo6
    + BOLSA.variable * (a.kids7to17 + (a.pregnantOrNursing ? 1 : 0));
}

const HELP = 'Na dúvida, ligue de graça pro 121, o Disque Social. Funciona todo dia, a qualquer hora.';

export function check(a: Answers): Result {
  const people = Math.max(1, Math.floor(a.people));
  const income = Math.max(0, a.income);
  const perPerson = Math.round((income / people) * 100) / 100;
  const low = perPerson <= HALF_WAGE;
  const benefits: Benefit[] = [];

  if (perPerson <= BOLSA_LINE) {
    benefits.push({
      id: 'bolsa', title: 'Bolsa Família',
      what: 'Dinheiro todo mês pra família. Não precisa pedir: quem está no CadÚnico entra na seleção do governo.',
      estimate: `cerca de ${reais(bolsaEstimate({ ...a, people }))} por mês`,
      steps: [
        'Faça ou atualize o CadÚnico. É isso que coloca a família na seleção.',
        'Mantenha em dia a vacina das crianças, o pré-natal de quem está grávida e a escola.',
        'Acompanhe pelo aplicativo Bolsa Família ou ligando pro 121.',
      ],
      source: SOURCES.bolsa,
    });
  } else if (a.receivesBolsa && perPerson <= PROTECTION_LINE) {
    benefits.push({
      id: 'protecao', title: 'Regra de Proteção do Bolsa Família',
      what: 'Se a renda subiu, você não perde tudo de uma vez. A família continua recebendo metade do valor por até 18 meses. Dá pra aceitar um emprego sem perder o Bolsa Família no mesmo mês.',
      steps: [
        'Conte a renda nova no CRAS quando atualizar o CadÚnico. Esconder a renda pode cortar o benefício.',
        'Na dúvida sobre o seu caso, ligue pro 121.',
      ],
      source: SOURCES.protecao,
    });
  }

  // Today the programme only reaches Bolsa Família families of 2 or more (gov.br, Receber Vale Gás).
  // Without the Bolsa, or the income to get it, the card would promise what the government does not give.
  const bolsaFamily = a.receivesBolsa || perPerson <= BOLSA_LINE;
  if (low && people >= 2 && bolsaFamily) {
    benefits.push({
      id: 'gas', title: 'Gás do Povo',
      what: `Botijão de gás de graça: 1 a cada ${people >= 4 ? '2' : '3'} meses. Por enquanto, vale só pra família do Bolsa Família.`,
      steps: [
        'Não precisa pedir. Todo mês o governo escolhe as famílias pelo CadÚnico, que precisa estar atualizado nos últimos 2 anos.',
        'Veja se já tem vale no aplicativo Meu Social ou ligando pro 121. Lá também aparecem as revendas de gás credenciadas.',
        'Na revenda, use o cartão do Bolsa Família com chip ou informe o CPF de quem é responsável pela família. Chega um código por SMS.',
      ],
      source: SOURCES.gas,
    });
  }

  if (low || (a.medicalDevice && income <= 3 * MINIMUM_WAGE)) {
    benefits.push({
      id: 'luz', title: 'Conta de luz de graça',
      what: 'Até 80 kWh por mês sem pagar a energia. Na conta sobram as taxas, como a iluminação pública, e o que passar de 80 kWh.',
      steps: [
        'É automático pra quem tem o CadÚnico.',
        'Olhe a conta de luz. Se o desconto não aparecer, ligue pra empresa de luz da sua cidade ou pro 121.',
        ...(a.medicalDevice && !low ? ['Por causa do aparelho médico, fale com a empresa de luz e conte que alguém da casa precisa dele.'] : []),
      ],
      source: SOURCES.luz,
    });
  } else if (perPerson <= MINIMUM_WAGE) {
    benefits.push({
      id: 'luz-desconto', title: 'Desconto na conta de luz',
      what: 'Desconto na conta em até 120 kWh por mês, pra família no CadÚnico que ganha um pouco mais.',
      steps: [
        'É automático pra quem tem o CadÚnico.',
        'Se o desconto não aparecer na conta, ligue pra empresa de luz da sua cidade ou pro 121.',
      ],
      source: SOURCES.luz,
    });
  }

  if (low) {
    benefits.push({
      id: 'agua', title: 'Água mais barata',
      what: 'Metade do preço nos primeiros 15 mil litros de água por mês.',
      steps: [
        'Deveria ser automático pra quem tem o CadÚnico, mas nem toda cidade já aplica.',
        'Se não aparecer na conta, peça a Tarifa Social na empresa de água da sua cidade.',
      ],
      source: SOURCES.agua,
    });
  }

  // Everything above goes through the CadÚnico, so it leads the list whenever anything showed up.
  if (benefits.length || low) {
    const has = a.cadunico === 'recent';
    benefits.unshift({
      id: 'cadunico', title: has ? 'CadÚnico: mantenha em dia' : 'CadÚnico',
      what: has
        ? 'Você já tem. Atualize a cada 2 anos ou quando mudar alguém na casa, a renda ou o endereço.'
        : 'É a porta de entrada. Com ele a família pode receber tudo o que aparece aqui embaixo.',
      steps: [
        'Vá ao CRAS da sua cidade. Se não souber onde fica, ligue pro 121.',
        'Quem vai é a pessoa responsável pela família, de preferência uma mulher com 16 anos ou mais.',
        'A conversa dura mais ou menos 1 hora e não custa nada.',
      ],
      papers: [
        'Da pessoa responsável: CPF ou título de eleitor, e um documento com foto.',
        'Comprovante de endereço, de preferência a conta de luz. Se não tiver, dá pra declarar onde mora.',
        'De cada pessoa da casa: um documento, que pode ser certidão de nascimento ou casamento, RG, CPF ou carteira de trabalho.',
        'Se tiver: comprovante de matrícula das crianças e jovens na escola.',
      ],
      source: SOURCES.cadunico,
    });
  }

  return { perPerson, benefits, updateCadunico: benefits.length > 0 && a.cadunico !== 'recent' };
}

const CONSTITUTION = { label: 'Constituição Federal, artigos 196 e 134', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm' };

// What anyone can use, shown when nothing above applies. Each one with its source, like the rest.
export const ALWAYS: { title: string; what: string; source: Source }[] = [
  { title: 'SUS', what: 'Consulta, exame e vacina no posto de saúde. De graça, pra qualquer pessoa.', source: CONSTITUTION },
  { title: 'Defensoria Pública', what: 'Advogado de graça pra quem não pode pagar. Procure a Defensoria do seu estado.', source: CONSTITUTION },
  { title: 'Disque Social 121', what: HELP, source: SOURCES.cadunico },
];

// Fictitious family, for the "Ver um exemplo" button. Not a real person.
export const EXAMPLE: Answers = {
  people: 4, income: 700, kidsUpTo6: 1, kids7to17: 1,
  pregnantOrNursing: false, medicalDevice: false, receivesBolsa: false, cadunico: 'no',
};
