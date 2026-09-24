import { PROJECT_NAME } from './project';

// /transparencia in two layers (F32, D029): the first one in plain words, and the technical
// page behind the "Parte técnica" button. The old anchors of the single page move with it.
export const LIVRO = {
  href: '/transparencia',
  tecnico: '/transparencia/tecnico',
  movedHashes: ['acoes', 'como-conferir', 'dinheiro', 'o-que-entra'],
  movedParams: ['exemplo', 'tipo'],
} as const;

// Everything the first layer says, in one place, so a test keeps the technical words out.
export const PLAIN = {
  lead: `Cada real, cada entrega e cada decisão do ${PROJECT_NAME} entram num livro que ninguém muda escondido. Veja como funciona e confira você mesmo.`,
  // Kept for the technical page and the tests; the lay screen tells this in the five scenes.
  questions: [
    { id: 'what', q: 'O que fica no livro?', a: 'Cada real que entra e sai, cada entrega de comida, roupa e higiene, e cada decisão do projeto. Nome, CPF e lugar de pessoa não entram.' },
    { id: 'how', q: 'Como eu sei que ninguém mexeu?', a: 'Cada ação ganha uma marca feita do texto dela mesma, e leva junto a marca da anterior, como elo de corrente. Se alguém mexe numa, as seguintes não batem. O selo refaz essa conta no seu aparelho. Nada é enviado pra gente.' },
    { id: 'when', q: 'Quem garante a data?', a: 'A marca do fim do livro vai pra um registro público, aberto e fora da gente, e recebe a data de lá. Depois disso, essa data não muda. Sem moeda nenhuma no meio.' },
  ],
  stampWaiting: 'Neste livro esse carimbo ainda não entrou. Quando entrar, o selo mostra o registro e o dia.',
  chain: 'Cada elo preso no anterior. O último vai pro registro público, com a data.',
  // The chain in five scenes (Corrente.astro). `short` names the scene for the dots.
  scenes: [
    { short: 'a doação entra', text: 'Alguém doa R$ 50 pelo site. A doação entra no livro na hora, com valor e data. Sem nome.' },
    { short: 'a marca', text: 'A ação ganha uma marca: uma conta feita a partir do texto dela. Qualquer computador refaz a conta e chega no mesmo resultado.' },
    { short: 'a corrente', text: 'Os R$ 50 viram 5 kits de higiene, e os kits chegam na praça. Cada ação carrega a marca da anterior, como elo de corrente. É o estilo do blockchain, sem moeda nenhuma.' },
    { short: 'alguém mexe', text: 'Se alguém tentar dizer que entraram só R$ 20, a marca muda inteira e as ações seguintes deixam de bater. Qualquer pessoa vê onde quebrou.' },
    { short: 'a data', text: 'A marca do fim vai pra um registro público, fora da gente, e ganha a data de lá. Depois disso, ninguém muda o passado.' },
  ],
  verify: 'O selo baixa o livro e refaz a conta no seu aparelho. Nada é enviado pra gente.',
  seal: 'Conferir agora',
  thisOne: 'Conferir esta',
  details: 'Ver detalhes',
  download: 'Baixar o livro',
  openFile: 'Conferir um arquivo salvo',
  zero: 'Zero real porque a doação ainda não abriu.',
  empty: 'O livro ainda não tem nenhuma ação.',
  end: 'Quer ver por dentro? A lista completa, os arquivos e como conferir no computador.',
} as const;
