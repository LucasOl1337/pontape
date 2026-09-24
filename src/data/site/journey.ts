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
export const OPENING = 'Uma plataforma sem fins lucrativos que usa AI pra levar cada doação a quem mais pode mudar de vida. E fica ao lado dessa pessoa, de graça, até o trabalho. Tudo à vista.';

// Candidate journey, PRD §4, in the words of whoever reads the home (F29). It starts with the system
// (D032): the AI helps to choose with care, and how it chooses stays in the open. Then the person is
// found and talks to the AI. The AI support comes before the job (D028), and the AI never stops.
export const STEPS: JourneyStep[] = [
  { shortName: 'Sistema', title: 'Escolha com critério', icon: 'scale', module: 'M3', aiFrom: true,
    text: 'Cada doação vai pra quem mais pode transformar a própria vida. A AI ajuda a encontrar essas pessoas, e o critério é público.',
    now: 'Precisa de ajuda. O critério de escolha está em pesquisa, pra ser justo com todo mundo.' },
  { shortName: 'Busca', title: 'Chegar até a pessoa', icon: 'pin', module: 'M3',
    text: 'Voluntários na rua, panfletos, pontos públicos e este site. Vários caminhos até quem quer recomeçar.',
    now: 'Precisa de ajuda. Ainda não há voluntários na rua. Quem já faz esse trabalho tem muito a ensinar.' },
  { shortName: 'Conversa', title: 'Uma conversa por voz', icon: 'mic', module: 'M4',
    text: 'Uma conversa curta com a AI, só falando. Sem ler, sem escrever. É assim que a gente conhece cada pessoa.',
    now: 'Precisa de ajuda. A AI ainda está aprendendo sotaque, gíria e barulho de rua.' },
  { shortName: 'Comida e roupa', title: 'O básico, garantido', icon: 'plate', module: 'M5',
    text: 'Comida pros primeiros dias, roupa nova e higiene. Tudo pago por doação, e cada compra fica à vista.',
    now: 'Ainda não começou. Depende de doações, e elas ainda não abriram.' },
  { shortName: 'Apoio da AI', title: 'Apoio da AI', icon: 'voice-ai', module: 'M7',
    text: 'A AI ajuda a pessoa a descobrir o que sabe fazer e o que quer. Depois prepara ela pra vaga: currículo, documentos, entrevista. Sem custo.',
    now: 'Ainda não começou. Está no plano.' },
  { shortName: 'Trabalho', title: 'Trabalho', icon: 'briefcase', module: 'M6',
    text: 'Pronta, a pessoa é apresentada a quem oferece vaga, sem expor quem ela é. E a AI segue ao lado dela, sem prazo e sem custo.',
    now: 'Ainda não começou. Está no plano.' },
  { shortName: 'Tudo à vista', title: 'Tudo à vista', icon: 'chart', module: 'M2',
    text: 'Cada ação fica registrada num livro aberto, que qualquer pessoa pode conferir. Aparece o número, nunca o nome.',
    now: 'Precisa de ajuda. O livro já está no ar. Falta poder receber doação, e isso pede uma conta oficial.' },
];
