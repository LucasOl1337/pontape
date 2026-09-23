import type { IconName } from '../../components/site/icon-names';

export interface JourneyStep {
  shortName: string;
  title: string;
  icon: IconName;
  module: `M${number}`;
  who: string[];
  text: string;
}

// Candidate journey, PRD §4.
export const STEPS: JourneyStep[] = [
  { shortName: 'Encontro', title: 'Encontro', icon: 'pin', module: 'M3', who: ['Voluntário', 'Panfleto', 'Site'],
    text: 'Um voluntário na rua, um panfleto, um ponto público ou este site. Vários jeitos de chegar até quem quer recomeçar.' },
  { shortName: 'Conversa', title: 'Conversa por voz', icon: 'mic', module: 'M4', who: ['IA', 'Voluntário'],
    text: 'Uma conversa curta com a nossa IA, falando e ouvindo. Não precisa ler nem escrever.' },
  { shortName: 'Escolha', title: 'Escolha', icon: 'check-circle', module: 'M3', who: ['IA', 'Pessoa da equipe'],
    text: 'A IA recomenda quem está pronto pra mudar. A proposta é que uma pessoa sempre confirme. Isso ainda está em decisão.' },
  { shortName: 'Primeiros dias', title: 'Primeiros dias', icon: 'plate', module: 'M5', who: ['Doação', 'Parceiros'],
    text: 'Comida por alguns dias, roupa nova e limpa, higiene básica. Tudo pago com doação e registrado no livro público.' },
  { shortName: 'Trabalho', title: 'Trabalho', icon: 'briefcase', module: 'M6', who: ['Empregador', 'Equipe'],
    text: 'O perfil entra na rede de oportunidades, sem expor a pessoa. Empresas e pessoas oferecem vaga.' },
  { shortName: 'IA junto', title: 'IA que acompanha', icon: 'voice-ai', module: 'M7', who: ['IA'],
    text: 'Depois da escolha, a pessoa segue com uma IA simples, por voz, pra planejar o que quer conquistar.' },
  { shortName: 'Prova', title: 'Prova', icon: 'chart', module: 'M2', who: ['Livro público'],
    text: 'Cada passo entra no livro público só como contagem: quantas entrevistas, quantos encaminhamentos. Ninguém é exposto.' },
];
