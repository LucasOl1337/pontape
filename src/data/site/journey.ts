import type { IconName } from '../../components/site/icon-names';
import type { ModuleStatus } from './statuses';

export interface JourneyStep {
  shortName: string;
  title: string;
  icon: IconName;
  module: `M${number}`;
  text: string;
  /** "Já funciona?" in plain words. Opens with NOW_LEAD for the module's state (site-data.test.ts). */
  now: string;
}

// How a step answers "já funciona?": the words for its module's state, then why.
export const NOW_LEAD: Record<ModuleStatus, string> = {
  live: 'Já funciona.',
  building: 'Em construção.',
  bottleneck: 'Precisa de ajuda.',
  planned: 'Ainda não começou.',
};

// Candidate journey, PRD §4, in the words of whoever reads the home (F29). The AI support comes
// before the job (D028): first the person finds out what she knows how to do and what she wants,
// then she is introduced to a job. From the conversation on, the AI goes along and never stops.
export const STEPS: JourneyStep[] = [
  { shortName: 'Encontro', title: 'Encontro', icon: 'pin', module: 'M3',
    text: 'Um voluntário na rua, um panfleto, um ponto público ou este site. Vários jeitos de chegar até quem quer recomeçar.',
    now: 'Precisa de ajuda. Ainda não tem voluntário na rua. Quem já faz esse trabalho pode ensinar muito.' },
  { shortName: 'Conversa', title: 'Conversa por voz', icon: 'mic', module: 'M4',
    text: 'Uma conversa curta com a nossa IA, falando e ouvindo. Não precisa ler nem escrever. Daqui em diante, a IA vai junto.',
    now: 'Precisa de ajuda. A IA ainda aprende a entender sotaque, gíria e barulho de rua.' },
  { shortName: 'Escolha', title: 'Escolha', icon: 'check-circle', module: 'M3',
    text: 'A pessoa escolhe se quer participar. Depois da conversa, alguém da equipe confirma a entrada, com ajuda da IA.',
    now: 'Precisa de ajuda. Como fazer essa escolha de um jeito justo ainda está em decisão.' },
  { shortName: 'Comida e roupa', title: 'Comida, roupa e higiene', icon: 'plate', module: 'M5',
    text: 'Comida por alguns dias, roupa nova e limpa, higiene básica. Tudo pago com doação, e cada compra fica à vista.',
    now: 'Ainda não começou. Depende de receber doação, e isso ainda não abriu.' },
  { shortName: 'Apoio da IA', title: 'Apoio da IA', icon: 'voice-ai', module: 'M7',
    text: 'A IA conversa com a pessoa pra entender o que ela sabe fazer e o que ela quer. Depois ajuda a se preparar pra buscar trabalho.',
    now: 'Ainda não começou. Está no plano.' },
  { shortName: 'Trabalho', title: 'Trabalho', icon: 'briefcase', module: 'M6',
    text: 'Sabendo o que quer, a pessoa é apresentada pra quem oferece vaga, sem expor quem ela é. Depois disso, a IA segue junto, sem prazo e de graça.',
    now: 'Ainda não começou. Está no plano.' },
  { shortName: 'Tudo à vista', title: 'Tudo à vista', icon: 'chart', module: 'M2',
    text: 'Tudo o que a gente faz fica anotado num livro aberto, que qualquer pessoa confere. Ninguém é exposto: aparece o número, nunca o nome.',
    now: 'Precisa de ajuda. O livro já está no ar. Falta poder receber doação, e isso pede uma conta oficial.' },
];
