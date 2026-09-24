import { PROJECT_NAME } from './project';
import type { ShareCard } from '../../lib/share/render';

// What each page says when its link is shared. The image is drawn from this at build.
export const SHARE: Record<'home' | 'transparencia', ShareCard & { title: string; description: string; image: string; alt: string }> = {
  home: {
    title: `${PROJECT_NAME} · caridade inteligente`,
    description: 'Plataforma de caridade inteligente, sem fins lucrativos e aberta: a IA ajuda a decidir como a ajuda chega e faz de graça tudo que pode por quem quer mudar de vida. Toda ação fica num livro público que qualquer um confere.',
    image: '/og.png',
    alt: `${PROJECT_NAME}: Uma plataforma de caridade inteligente. Ilustração de cinco degraus.`,
    name: PROJECT_NAME,
    lead: 'Uma plataforma de caridade',
    highlight: 'inteligente.',
    footer: 'Sem fins lucrativos · Código aberto · Tudo à vista',
    art: 'stairs',
  },
  transparencia: {
    title: `Transparência · ${PROJECT_NAME}`,
    description: `Um livro aberto com tudo que o ${PROJECT_NAME} faz: o dinheiro, as atividades e as decisões. Ninguém apaga escondido, e qualquer pessoa confere.`,
    image: '/og-transparencia.png',
    alt: `${PROJECT_NAME}: Tudo que o projeto faz, à vista. Ilustração de uma corrente de ações.`,
    name: PROJECT_NAME,
    lead: 'Tudo que o projeto faz,',
    highlight: 'à vista.',
    footer: 'Toda ação aparece. Quem é a pessoa, não.',
    art: 'chain',
  },
};
