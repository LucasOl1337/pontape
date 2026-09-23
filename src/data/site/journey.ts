import type { IconName } from '../../components/site/icon-names';
import type { ModuleStatus } from './statuses';

export interface JourneyStep {
  shortName: string;
  title: string;
  icon: IconName;
  module: `M${number}`;
  who: string[];
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

// Candidate journey, PRD §4, in the words of whoever reads the home (F29).
export const STEPS: JourneyStep[] = [
  { shortName: 'Encontro', title: 'Encontro', icon: 'pin', module: 'M3', who: ['Voluntário', 'Panfleto', 'Site'],
    text: 'Um voluntário na rua, um panfleto, um ponto público ou este site. Vários jeitos de chegar até quem quer recomeçar.',
    now: 'Precisa de ajuda. Ainda não tem voluntário na rua. Quem já faz esse trabalho pode ensinar muito.' },
  { shortName: 'Conversa', title: 'Conversa por voz', icon: 'mic', module: 'M4', who: ['IA', 'Voluntário'],
    text: 'Uma conversa curta com a nossa IA, falando e ouvindo. Não precisa ler nem escrever.',
    now: 'Precisa de ajuda. A IA ainda aprende a entender sotaque, gíria e barulho de rua.' },
  { shortName: 'Escolha', title: 'Escolha', icon: 'check-circle', module: 'M3', who: ['IA', 'Pessoa da equipe'],
    text: 'A pessoa escolhe se quer participar. Depois da conversa, alguém da equipe confirma a entrada, com ajuda da IA.',
    now: 'Precisa de ajuda. Como fazer essa escolha de um jeito justo ainda está em decisão.' },
  { shortName: 'Comida e roupa', title: 'Comida, roupa e higiene', icon: 'plate', module: 'M5', who: ['Doação', 'Parceiros'],
    text: 'Comida por alguns dias, roupa nova e limpa, higiene básica. Tudo pago com doação, e cada compra fica à vista.',
    now: 'Ainda não começou. Depende de receber doação, e isso ainda não abriu.' },
  { shortName: 'Trabalho', title: 'Trabalho', icon: 'briefcase', module: 'M6', who: ['Empregador', 'Equipe'],
    text: 'A gente apresenta a pessoa pra quem oferece vaga, sem expor quem ela é. A equipe acompanha os primeiros meses.',
    now: 'Ainda não começou. Está no plano.' },
  { shortName: 'Apoio da IA', title: 'Uma IA pra acompanhar', icon: 'voice-ai', module: 'M7', who: ['IA'],
    text: 'Depois de entrar, a pessoa segue com uma IA simples, por voz, pra planejar o que quer conquistar.',
    now: 'Ainda não começou. Está no plano.' },
  { shortName: 'Tudo à vista', title: 'Tudo à vista', icon: 'chart', module: 'M2', who: ['Livro público'],
    text: 'Tudo o que a gente faz fica anotado num livro aberto, que qualquer pessoa confere. Ninguém é exposto: aparece o número, nunca o nome.',
    now: 'Precisa de ajuda. O livro já está no ar. Falta poder receber doação, e isso pede uma conta oficial.' },
];
