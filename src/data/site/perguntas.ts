import { REPO_URL } from './contributions';

// The page for whoever arrives from a post (F40): the questions everyone asks, who is behind the
// project and how to reach him. Nothing here asks for a name or a contact (D012).
export const PERGUNTAS = { href: '/perguntas', name: 'Perguntas', contactHash: 'contato' } as const;

export interface Pergunta { id: string; q: string; a: string }

export const FAQ: Pergunta[] = [
  { id: 'o-que-e', q: 'O que é o PontaPé?',
    a: 'Uma plataforma sem fins lucrativos de caridade inteligente. A AI ajuda a levar cada doação a quem mais pode mudar de vida, e fica ao lado dessa pessoa até o trabalho. Tudo que a gente faz fica num livro aberto, que qualquer pessoa confere.' },
  { id: 'ja-funciona', q: 'Já funciona?',
    a: 'Ainda não. Está em construção, e em aberto. Por enquanto ninguém é atendido e nenhuma doação é recebida. O site mostra o que já existe e o que ainda falta, sem enfeite.' },
  { id: 'posso-doar', q: 'Posso doar?',
    a: 'Ainda não. Primeiro vem a associação registrada, com CNPJ e conta própria. Só depois a doação abre, e cada real vai aparecer no livro público. Até lá, a melhor ajuda é contar pra alguém.' },
  { id: 'por-que-ai', q: 'Por que AI numa caridade?',
    a: 'Doação não é infinita. A AI ajuda a encontrar quem mais quer e mais pode mudar de vida, com critério público. E faz de graça pela pessoa tudo que uma AI pode fazer: conversa, orientação, preparo pra vaga. A proposta é que uma pessoa confirme cada escolha; a AI não decide sozinha.' },
  { id: 'como-escolhe', q: 'Como a pessoa é escolhida?',
    a: 'Por uma conversa curta por voz com a AI, sem precisar ler nem escrever. O critério ainda está em pesquisa, pra ser justo com todo mundo, e vai ficar público quando estiver pronto.' },
  { id: 'e-seguro', q: 'É seguro? Quem vê os dados?',
    a: 'Hoje o site não guarda nada de ninguém: nem nome, nem e-mail, nem cookie. Quando o atendimento começar, quem é a pessoa nunca vai aparecer no livro público. Aparece a ação e o número, nunca o nome.' },
  { id: 'quem-faz', q: 'Quem está por trás?',
    a: 'O Lucas Oliveira, engenheiro de AI em São Paulo. Por enquanto é ele, com agentes de AI ajudando a construir. Sem empresa, sem patrocínio, sem dinheiro de ninguém.' },
  { id: 'como-ajudar', q: 'Como posso ajudar hoje?',
    a: 'Contar pra alguém, ler o site e apontar o que ficou confuso, pegar uma tarefa no GitHub, ou falar com o Lucas com uma ideia ou uma crítica. Voluntário na rua e vaga de trabalho abrem quando o projeto começar na primeira cidade.' },
  { id: 'onde-codigo', q: 'Onde está o código?',
    a: 'No GitHub, aberto pra qualquer pessoa ver, usar e propor melhoria. Licença Apache 2.0. Cada decisão do projeto está escrita lá, com data e quem decidiu.' },
];

export const QUEM_FAZ = {
  name: 'Lucas Oliveira',
  role: 'Engenheiro de AI',
  city: 'São Paulo',
  text: 'Constrói produtos e ferramentas com agentes de AI. O PontaPé é a tentativa dele de usar isso pra quem mais precisa, com cada real e cada passo à vista.',
} as const;

export const CONTATO = [
  { icon: 'people', label: 'LinkedIn', text: 'Mensagem direta ou comentário.', href: 'https://www.linkedin.com/in/lucasoliveiradevai/' },
  { icon: 'link', label: 'X', text: '@Lucas_Ol1337. Resposta ou mensagem.', href: 'https://x.com/Lucas_Ol1337' },
  { icon: 'code', label: 'GitHub', text: 'Ideia, dúvida ou problema, em aberto.', href: `${REPO_URL}/issues/new` },
] as const;
