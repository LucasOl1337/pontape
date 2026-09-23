import type { IconName } from '../../components/site/icon-names';
import { BOTTLENECKS } from './bottlenecks';
import { CONTRIBUTIONS } from './contributions';
import { MODULES } from './modules';

// The builder cadernos (F31): each one is a page of its own under /construir, behind the
// "Construir junto" door. They used to open as a panel over the home, at #modulos, #gargalos,
// #contribuicoes and #codigo-aberto; `oldHash` keeps those links working.
export const CONSTRUIR = { href: '/construir', name: 'Construir junto', oldHash: 'construir' } as const;

export interface Caderno {
  id: 'pecas' | 'gargalos' | 'tarefas' | 'codigo-aberto';
  href: string;
  oldHash: string;
  icon: IconName;
  /** The door's title, also the page title in the browser tab. */
  name: string;
  /** The short name, in the breadcrumb above the headline. */
  short: string;
  text: string;
}

const goodFirst = CONTRIBUTIONS.filter(c => c.goodFirst).length;

export const CADERNOS: Caderno[] = [
  { id: 'pecas', href: '/construir/pecas', oldHash: 'modulos', icon: 'package', short: 'Peças',
    name: `As ${MODULES.length} partes do projeto`, text: 'O que cada uma faz, se já funciona e o que falta.' },
  { id: 'gargalos', href: '/construir/gargalos', oldHash: 'gargalos', icon: 'bulb', short: 'Gargalos',
    name: 'O que a gente ainda não sabe resolver', text: `${BOTTLENECKS.length} perguntas em aberto. Se você entende do assunto, sua ajuda vale muito.` },
  { id: 'tarefas', href: '/construir/tarefas', oldHash: 'contribuicoes', icon: 'wrench', short: 'Tarefas',
    name: 'Tarefas abertas', text: `${CONTRIBUTIONS.length} tarefas, ${goodFirst} boas pra quem está começando.` },
  { id: 'codigo-aberto', href: '/construir/codigo-aberto', oldHash: 'codigo-aberto', icon: 'code', short: 'Código aberto',
    name: 'Código aberto', text: 'O código, os documentos e cada decisão, pra ver e propor melhoria.' },
];

export const caderno = (id: Caderno['id']) => CADERNOS.find(c => c.id === id)!;

// Where each old home link goes now. A single bottleneck (#gargalo-<id>) lands on its question.
export const MOVED: Record<string, string> = Object.fromEntries([CONSTRUIR, ...CADERNOS].map(c => [c.oldHash, c.href]));
export const bottleneckHref = (id: string) => `${caderno('gargalos').href}#${id}`;
