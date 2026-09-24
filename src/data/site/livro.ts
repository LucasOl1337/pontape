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
  lead: `Tudo que o ${PROJECT_NAME} faz fica neste livro. Leia as três respostas e aperte o selo.`,
  questions: [
    { id: 'what', q: 'O que fica no livro?', a: 'Cada real que entra e sai, cada entrega de comida, roupa e higiene, e cada decisão do projeto. Nome, CPF e lugar de pessoa não entram.' },
    { id: 'how', q: 'Como eu sei que ninguém mexeu?', a: 'Cada ação fica presa na anterior, como elo de corrente. Se alguém mexe numa, as seguintes não batem. O selo refaz essa conta no seu aparelho. Nada é enviado pra gente.' },
    { id: 'when', q: 'Quem garante a data?', a: 'A data do fim pode ficar carimbada no Bitcoin, num bloco fora da gente. Depois de carimbado, essa data não muda.' },
  ],
  stampWaiting: 'Neste livro o carimbo ainda não entrou. Quando entrar, o selo mostra o bloco e o dia.',
  chain: 'Cada elo preso no anterior. O último é o que pode ir pro Bitcoin.',
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
