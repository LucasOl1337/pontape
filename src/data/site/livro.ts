import type { IconName } from '../../components/site/icon-names';
import type { LedgerType } from '../../lib/ledger-view/phrases';
import { PROJECT_NAME } from './project';

// /transparencia in two layers (F32, D029): the first one in plain words, and the technical
// page behind the "Parte técnica" button. The old anchors of the single page move with it.
export const LIVRO = {
  href: '/transparencia',
  tecnico: '/transparencia/tecnico',
  movedHashes: ['acoes', 'como-conferir', 'dinheiro', 'o-que-entra'],
  movedParams: ['exemplo', 'tipo'],
} as const;

export interface PlainKind {
  id: 'dinheiro' | 'atividades' | 'decisoes';
  types: LedgerType[];
  icon: IconName;
  title: string;
  text: string;
  /** Said while nothing of this kind is in the ledger yet. */
  waiting: string;
  /** Said once it is: only the project actions enter by themselves, a few minutes later. */
  running: string;
  live?: boolean;
}

// Everything the first layer says, in one place, so a test keeps the technical words out.
export const PLAIN = {
  lead: `Um livro aberto com tudo que o ${PROJECT_NAME} faz: o dinheiro, as atividades e as decisões. Ninguém consegue apagar nem mudar escondido, e qualquer pessoa confere.`,
  verify: 'Seu aparelho refaz a conta de cada ação e mostra se alguém mexeu em alguma. Nada é enviado pra gente.',
  zero: 'Zero real porque a doação ainda não abriu.',
  empty: 'O livro ainda não tem nenhuma ação.',
  kinds: [
    { id: 'dinheiro', types: ['finance'], icon: 'coin', title: 'O dinheiro',
      text: 'Cada real que entra e cada real que sai, até o custo de manter o projeto de pé.',
      waiting: 'Começa quando a doação abrir.', running: 'Já está entrando.' },
    { id: 'atividades', types: ['field', 'candidate'], icon: 'package', title: 'As atividades',
      text: 'Cada conversa com quem quer mudar de vida, e cada entrega de comida, roupa e higiene.',
      waiting: 'Começa quando o atendimento abrir.', running: 'Já está entrando.' },
    { id: 'decisoes', types: ['project'], icon: 'flag', title: 'As decisões',
      text: 'Cada decisão tomada e cada mudança feita no projeto.',
      waiting: 'Começa com a primeira decisão.', running: 'Ao vivo: entram sozinhas, poucos minutos depois.', live: true },
  ] satisfies PlainKind[],
  rule: 'Toda ação aparece. Quem é a pessoa, não: nunca entra nome, rosto, CPF nem lugar.',
  trust: [
    'Cada ação ganha um lacre, feito com criptografia aberta: uma conta pública, que qualquer computador sabe fazer. Mudou uma vírgula, o lacre muda inteiro.',
    'E o lacre de cada ação leva junto o da anterior, como os elos de uma corrente.',
  ],
  chain: { whole: 'Assim está: cada ação presa na anterior.', broken: 'Se alguém mexer numa, a corrente quebra dali pra frente. E qualquer um vê.' },
  correction: 'Errou? A correção entra como ação nova, e a errada continua à vista.',
  soon: 'Vai ter também: a assinatura do projeto em cada lacre e a data guardada num lugar público, fora do nosso alcance.',
  end: 'Quer ver por dentro? A lista completa, os arquivos e como conferir no computador.',
} as const;
