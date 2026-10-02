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
  // The book in five steps (Corrente.astro). `short` names the step on its button; `title` is the
  // idea in one line, `text` says it with the example on screen.
  scenes: [
    { short: 'O livro', title: 'Tudo vira uma linha no livro.', text: 'Entraram R$ 50 de doação? Isso vira a linha 1, com o valor e a data. Sem nome de ninguém.' },
    { short: 'A marca', title: 'Cada linha ganha uma marca.', text: 'A marca sai do texto da linha, como uma impressão digital. Qualquer celular refaz a conta e chega na mesma marca.' },
    { short: 'A corrente', title: 'Cada linha guarda a marca da anterior.', text: 'Dos R$ 50, R$ 48 pagam 5 kits, que chegam na praça. A linha 2 guarda a marca da linha 1, e a 3 guarda a da 2. Fica uma corrente.' },
    { short: 'Alguém mexe', title: 'Se alguém muda o passado, aparece.', text: 'Trocar R$ 50 por R$ 20 muda a marca da linha 1. A linha 2 ainda guarda a marca antiga, então não bate mais. Qualquer pessoa vê onde quebrou.' },
    { short: 'A data', title: 'A última marca fica guardada fora daqui.', text: 'Um registro público, que não é nosso, guarda a marca da última linha com a data. Depois disso, nem a gente consegue mudar essas linhas sem deixar sinal.' },
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
