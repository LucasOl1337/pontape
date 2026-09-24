// Block 06 (Gargalos). The ids are the same ones F13 uses in docs/contribuicoes/contribuicoes.json.
export interface Bottleneck {
  id: 'achar-a-pessoa-certa' | 'conversar-com-quem-nao-le' | 'receber-doacao-do-jeito-certo' | 'escolha-justa' | 'seguranca-no-encontro';
  title: string;
  modules: string;
  why: string;
  progress: string;
  helpers: string;
}

export const BOTTLENECKS: Bottleneck[] = [
  { id: 'achar-a-pessoa-certa', title: 'Achar a pessoa certa', modules: 'M3',
    why: 'Quem quer mudar de vida de verdade? Um critério errado deixa de fora justamente quem mais precisa.',
    progress: 'O roteiro da conversa e os critérios entram logo depois da plataforma e da transparência.',
    helpers: 'Assistente social, gente de abrigo, organização que já trabalha na rua.' },
  { id: 'escolha-justa', title: 'Escolha justa', modules: 'M3 · M4',
    why: 'AI erra e pode ter preconceito escondido. Se errar, deixa de fora gente que merecia a chance.',
    progress: 'A proposta é: a AI recomenda, uma pessoa confirma. Ainda em decisão.',
    helpers: 'Pesquisa em viés de AI, ética, direitos humanos.' },
  { id: 'conversar-com-quem-nao-le', title: 'Conversar com quem não lê', modules: 'M4',
    why: 'A AI tem que entender sotaque, gíria e barulho de rua. E o aparelho precisa ser barato, aguentar o dia a dia e funcionar com internet ruim.',
    progress: 'A pesquisa de voz e de aparelho saiu. O piloto vem depois da plataforma.',
    helpers: 'Engenharia de voz, hardware, quem desenha conversa pra quem não lê.' },
  { id: 'receber-doacao-do-jeito-certo', title: 'Receber doação do jeito certo', modules: 'M2',
    why: 'Receber e prestar contas pede uma organização registrada e uma conta oficial. Isso ainda não existe.',
    progress: 'A pesquisa jurídica saiu. Falta a decisão sobre a associação e a conta.',
    helpers: 'Advogado do terceiro setor, contador, quem já montou prestação de contas pública.' },
  { id: 'seguranca-no-encontro', title: 'Segurança no encontro', modules: 'M3',
    why: 'Voluntário e candidato se encontram na rua. Os dois precisam estar seguros.',
    progress: 'Ainda não começou.',
    helpers: 'Quem já fez abordagem de rua, redução de danos, segurança comunitária.' },
];

export const bottleneckTitle = (id: string | null) => BOTTLENECKS.find(b => b.id === id)?.title ?? null;
