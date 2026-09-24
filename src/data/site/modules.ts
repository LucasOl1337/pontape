import type { ModuleStatus } from './statuses';

export interface ProjectModule {
  id: `M${number}`;
  name: string;
  status: ModuleStatus;
  summary: string;
  what: string;
  how: string;
  operation: string;
  strength: string;
  missing: string;
  helpers: string;
}

// One block per PRD §5 module. Status as of STATUS_DATE (project.ts). Text may use {name}.
export const MODULES: ProjectModule[] = [
  { id: 'M1', name: 'Site público', status: 'live',
    summary: 'Esta página. Explica o projeto e mostra tudo em aberto.',
    what: 'A porta de entrada do projeto. Mostra o que é, como funciona, o livro público e o que ainda falta.',
    how: 'Cada parte do projeto vira um bloco com estado: funcionando, em construção, precisa de ajuda ou planejado.',
    operation: 'Feito pela equipe e por quem quiser contribuir. Pensado pra abrir rápido em celular barato.',
    strength: 'Tudo num lugar só, sem esconder o que ainda não funciona.',
    missing: 'Ouvir quem lê pouco usando o site de verdade e ajustar o texto.',
    helpers: 'Design, texto simples, acessibilidade, código.' },
  { id: 'M2', name: 'Doação e transparência total', status: 'bottleneck',
    summary: 'Um livro público de todas as ações, que qualquer pessoa confere. E, quando abrir, a doação.',
    what: 'Um livro público com toda ação do projeto: dinheiro, entrega na rua, passo de candidato e decisão.',
    how: 'Cada ação vira uma linha presa na anterior por uma marca. Mudou uma linha, a corrente quebra, e qualquer pessoa vê.',
    operation: 'A equipe registra cada ação e cobre o dado pessoal antes de publicar. O botão Conferir refaz as contas no aparelho de quem olha.',
    strength: 'Ninguém precisa confiar na gente: dá pra conferir.',
    missing: 'Receber doação pede estrutura legal e conta oficial. Isso ainda não existe.',
    helpers: 'Advogado do terceiro setor, contador, quem entende de criptografia e prestação de contas pública.' },
  { id: 'M3', name: 'Captação de candidatos', status: 'bottleneck',
    summary: 'Escolher com cuidado quem quer mudar de vida de fato, e ir até essa pessoa.',
    what: 'O jeito de escolher quem entra, com ajuda da AI e à vista de todos. E os jeitos de chegar até a pessoa: voluntário na rua, panfleto, ponto público e este site.',
    how: 'O jeito de escolher vai sair de muita pesquisa e ficar aberto. A pessoa é convidada pra uma conversa curta, de graça e sem compromisso.',
    operation: 'Voluntários treinados vão até onde a pessoa está. Panfleto e ponto público chamam quem passa.',
    strength: 'Vários caminhos. Quem não tem celular também chega.',
    missing: 'Como saber quem quer mudar de vida de fato, sem deixar de fora quem mais precisa.',
    helpers: 'Assistência social, abrigo, organização que já trabalha na rua.' },
  { id: 'M4', name: 'Entrevista por voz', status: 'bottleneck',
    summary: 'Uma conversa por voz com AI. Não precisa ler nem escrever.',
    what: 'Uma AI que conversa pela voz, e talvez com imagem, pra conhecer a pessoa e o que ela quer.',
    how: 'A pessoa fala, a AI escuta e responde falando. A conversa é curta e simples.',
    operation: 'No celular do voluntário, com ele sempre junto.',
    strength: 'Quem lê pouco ou não lê passa pela conversa do mesmo jeito.',
    missing: 'Entender sotaque, gíria e barulho de rua. E um aparelho barato que aguente o dia a dia.',
    helpers: 'Engenharia de voz, hardware, quem desenha conversa pra quem não lê.' },
  { id: 'M5', name: 'Ponte inicial', status: 'planned',
    summary: 'Comida, roupa e higiene nos primeiros dias.',
    what: 'O básico pra pessoa se reerguer: comer por alguns dias, roupa nova e limpa, higiene.',
    how: 'O dinheiro vem da doação. Cada compra e cada entrega entram no livro público.',
    operation: 'Compra direta ou com parceiros: mercado, loja de roupa, ponto de banho.',
    strength: 'Ajuda concreta, na hora em que faz mais diferença.',
    missing: 'Achar parceiros e entregar sem burocracia e sem constrangimento.',
    helpers: 'Mercado, loja de roupa, ponto de banho, quem entende de logística.' },
  { id: 'M6', name: 'Rede de oportunidades', status: 'planned',
    summary: 'Levar quem foi escolhido até uma vaga de trabalho.',
    what: 'Uma rede que liga as pessoas escolhidas a quem oferece trabalho.',
    how: 'O perfil vai pra redes de emprego sem expor quem a pessoa é. Empresas e pessoas oferecem vaga.',
    operation: 'A equipe faz a ponte e acompanha os primeiros meses.',
    strength: 'Trabalho é o que mantém a mudança de pé.',
    missing: 'Convencer empregador a dar a primeira chance.',
    helpers: 'Empresa com vaga, RH, quem conhece rede de emprego.' },
  { id: 'M7', name: 'AI contínua', status: 'planned',
    summary: 'Uma AI simples, por voz, que acompanha a pessoa do começo ao fim, sem prazo e de graça.',
    what: 'Uma AI fácil, por voz, que fica com a pessoa desde a escolha e nunca para. Antes do trabalho, ajuda a entender o que ela sabe fazer e o que ela quer.',
    how: 'A pessoa conversa por voz quando quiser: treinar entrevista, planejar a semana, aprender algo novo.',
    operation: 'Pelo celular, ou num ponto público pra quem não tem aparelho.',
    strength: 'A mesma AI que está mudando o mundo, nas mãos de quem mais precisa.',
    missing: 'Custo por pessoa e um jeito de usar que não dependa de leitura.',
    helpers: 'Quem desenvolve AI de voz, educação de adultos.' },
  { id: 'M8', name: 'Código aberto e governança', status: 'building',
    summary: 'Código e decisões abertos, com aprovação de admin.',
    what: 'Todo o código, todo documento e o livro público ficam num lugar aberto.',
    how: 'Qualquer pessoa propõe melhoria. Um admin revisa e aprova antes de entrar.',
    operation: 'Admins cuidam da revisão. O caminho é virar uma organização sem fins lucrativos formal.',
    strength: 'Ninguém precisa confiar de olho fechado: está tudo lá pra ver.',
    missing: 'Mais admins revisando e um canal privado pra aviso de segurança.',
    helpers: 'Código, revisão, documentação.' },
  { id: 'M9', name: 'Marca, nome e domínio', status: 'building',
    summary: 'Nome próprio, endereço na internet e identidade visual.',
    what: 'O nome do projeto, o endereço do site e a cara que você está vendo.',
    how: 'Nome curto, fácil de falar e de lembrar. Nada genérico.',
    operation: 'Nome e endereço escolhidos: {name}, em pontape.org. A direção visual está no ar.',
    strength: 'Uma cara que se reconhece na rua, no panfleto e no site.',
    missing: 'Logo definitivo e o material de rua: panfleto e placa do ponto público.',
    helpers: 'Ideia de nome, design, quem entende de marca.' },
];

export const DETAIL_FIELDS: { key: keyof ProjectModule; label: string; tone?: 'missing' | 'helpers' }[] = [
  { key: 'what', label: 'O que é' },
  { key: 'how', label: 'Como funciona' },
  { key: 'operation', label: 'Como opera' },
  { key: 'strength', label: 'Ponto forte' },
  { key: 'missing', label: 'O que falta resolver', tone: 'missing' },
  { key: 'helpers', label: 'Quem pode ajudar', tone: 'helpers' },
];
