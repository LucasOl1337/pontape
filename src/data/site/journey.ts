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
  /** The step where the AI starts going along (F36): the staircase draws its line from here. */
  aiFrom?: true;
}

// How a step answers "já funciona?": the words for its module's state, then why.
export const NOW_LEAD: Record<ModuleStatus, string> = {
  live: 'Já funciona.',
  building: 'Em construção.',
  bottleneck: 'Precisa de ajuda.',
  planned: 'Ainda não começou.',
};

// What the ground of the staircase says to whoever just arrived (D032): the system comes first,
// the basics and the job after it. Kept as long as the old one (F36 frames the page around it).
export const OPENING = 'A AI ajuda a levar cada doação a quem tem mais chance de mudar de vida. E acompanha essa pessoa de graça, da comida ao trabalho. Tudo à vista.';

// Candidate journey, PRD §4, in the words of whoever reads the home (F29). It starts with the system
// (D032): the AI helps to choose with care, and how it chooses stays in the open. Then the person is
// found and talks to the AI. The AI support comes before the job (D028), and the AI never stops.
export const STEPS: JourneyStep[] = [
  { shortName: 'Sistema', title: 'Escolher com cuidado', icon: 'scale', module: 'M3', aiFrom: true,
    text: 'A doação não é infinita. Pra ela render o máximo, a AI ajuda a achar quem tem mais vontade e mais chance de mudar de vida. E o jeito de escolher fica à vista.',
    now: 'Precisa de ajuda. A gente está pesquisando o jeito de escolher, pra ser justo com todo mundo.' },
  { shortName: 'Busca', title: 'Ir até a pessoa', icon: 'pin', module: 'M3',
    text: 'Um voluntário na rua, um panfleto, um ponto público ou este site. Vários jeitos de chegar até quem quer recomeçar.',
    now: 'Precisa de ajuda. Ainda não tem voluntário na rua. Quem já faz esse trabalho pode ensinar muito.' },
  { shortName: 'Conversa', title: 'Conversa por voz', icon: 'mic', module: 'M4',
    text: 'Uma conversa curta com a nossa AI, falando e ouvindo. Não precisa ler nem escrever. É assim que a gente conhece quem quer entrar.',
    now: 'Precisa de ajuda. A AI ainda aprende a entender sotaque, gíria e barulho de rua.' },
  { shortName: 'Comida e roupa', title: 'Comida, roupa e higiene', icon: 'plate', module: 'M5',
    text: 'Quem entra ganha comida por alguns dias, roupa nova e limpa e higiene básica. Tudo pago com doação, e cada compra fica à vista.',
    now: 'Ainda não começou. Depende de receber doação, e isso ainda não abriu.' },
  { shortName: 'Apoio da AI', title: 'Apoio da AI', icon: 'voice-ai', module: 'M7',
    text: 'A AI ajuda a pessoa a descobrir no que ela é boa e o que quer fazer. Depois ajuda no que precisar pra buscar trabalho: currículo, documento, entrevista. De graça.',
    now: 'Ainda não começou. Está no plano.' },
  { shortName: 'Trabalho', title: 'Trabalho', icon: 'briefcase', module: 'M6',
    text: 'Sabendo o que quer, a pessoa é apresentada pra quem oferece vaga, sem expor quem ela é. Depois disso, a AI segue junto, sem prazo e de graça.',
    now: 'Ainda não começou. Está no plano.' },
  { shortName: 'Tudo à vista', title: 'Tudo à vista', icon: 'chart', module: 'M2',
    text: 'Tudo o que a gente faz fica anotado num livro aberto, que qualquer pessoa confere. Ninguém é exposto: aparece o número, nunca o nome.',
    now: 'Precisa de ajuda. O livro já está no ar. Falta poder receber doação, e isso pede uma conta oficial.' },
];
