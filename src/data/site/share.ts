import { PROJECT_NAME } from './project';
import type { ShareCard } from '../../lib/share/render';

// What each page says when its link is shared. The image is drawn from this at build.
export const SHARE: Record<'home' | 'transparencia', ShareCard & { title: string; description: string; image: string; alt: string }> = {
  home: {
    title: `${PROJECT_NAME} · o primeiro passo pra quem quer mudar de vida`,
    description: 'Projeto sem fins lucrativos e aberto: comida, roupa, higiene, trabalho e IA pra quem quer recomeçar. Toda ação num livro público que qualquer um confere.',
    image: '/og.png',
    alt: `${PROJECT_NAME}: O primeiro passo pra quem quer mudar de vida. Ilustração de cinco degraus.`,
    name: PROJECT_NAME,
    lead: 'O primeiro passo pra quem quer',
    highlight: 'mudar de vida.',
    footer: 'Sem fins lucrativos · Código aberto · Tudo à vista',
    art: 'stairs',
  },
  transparencia: {
    title: `Livro público · ${PROJECT_NAME}`,
    description: 'Todas as ações do projeto num livro público: dinheiro, vida real, candidato e projeto. Cada linha presa na anterior, e qualquer pessoa confere.',
    image: '/og-transparencia.png',
    alt: `${PROJECT_NAME}: Tudo que o projeto faz, à vista. Ilustração de uma corrente de ações.`,
    name: PROJECT_NAME,
    lead: 'Tudo que o projeto faz,',
    highlight: 'à vista.',
    footer: 'Toda ação aparece. Quem é a pessoa, não.',
    art: 'chain',
  },
};
