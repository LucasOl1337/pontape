# F30 · Paletas, rodada 2 (Fable)

Dono: `anil` (Anil · Claude Fable 5.1, esforço xhigh) · Branch: `anil/f30-paletas` a partir da `main` · Worktree: `.worktrees/anil` · Começo: 23/09/2026

## O que o Lucas disse

[Feedback de 23/09](../../fontes/2026-09-23-feedback-paletas-e-cadernos.md): as cinco paletas da F28 "ficaram todas horríveis. A original continua melhor. As outras estão reprovadas." Ele quer um Fable cuidando só disso, "caprichando bastante e buscando fonte externa". D026.

Tua frente é só cor. O layout está com o Prumo (F31), ao mesmo tempo.

## Onde está hoje

- Seletor "Cores · em teste" no canto de baixo à esquerda de todas as páginas, e `?cor=<nome>` na URL (F28, PR #64). Funciona e fica.
- Todas as cores saem de `src/styles/palettes.css`. O bloco `:root` (Jornal) é o padrão e a referência. `src/styles/palettes.test.ts` confere contraste AA de cada par em toda paleta.
- As reprovadas: Mata, Mar, Ipê, Sol e Noite. Veja cada uma no ar (`https://pontape.org/?cor=mata` etc.) pra entender o que não dá certo antes de começar.

## O que fazer

1. **Entender por que a Jornal funciona.** Papel creme quente, tinta quase preta, um acento só e contido, cara de jornal impresso. O Lucas gosta dela. Escreva em cinco linhas o que ela acerta e o que as reprovadas erraram.
2. **Buscar referência de fora**, com link e data de acesso (regra do `AGENTS.md`): sites editoriais e de organizações sociais com cor bem resolvida, sistemas de cor publicados, teoria de cor aplicada a texto longo e a papel. Sem copiar marca de ninguém. Vai em `docs/pesquisa/PALETAS.md`. Navegador só na tua bancada agent-bench (workspaces 6 a 11).
3. **Cinco candidatas novas**, no lugar das reprovadas, com nome curto em português. Cada uma é uma paleta inteira pensada junta: papel, tinta, acento, as faixas escuras (`--inverse-*`), o caderno do livro (`--night-*`) e as cores de estado. Nada de só girar o matiz. Pode ter candidata perto da Jornal (outra temperatura de papel, outro acento) e candidata mais longe, mas todas no nível de acabamento da Jornal.
4. **Autocrítica antes de mandar:** as seis lado a lado, na home, num degrau aberto, num caderno aberto e no `/transparencia`, em 1440 e em 360. Corte e refaça a que parecer barata. O critério é o Lucas achar pelo menos uma tão boa quanto a Jornal.

## Onde mexer

Só `src/styles/palettes.css`, `src/styles/palettes.test.ts`, a lista de nomes em `PaletteSwitcher.astro` e a regex de nomes no script inline do `BaseLayout.astro`. O `site.css` e os componentes são do Prumo; se faltar um token pra paleta ficar boa (um segundo acento, por exemplo), escreva a proposta no DIARIO e me avise, que eu combino com ele.

## Pronto quando

1. `npm run check` passa, com o teste de contraste cobrindo as cinco novas.
2. `docs/pesquisa/PALETAS.md` com as referências e o porquê de cada candidata numa linha.
3. Prints das seis na tua bancada (home em 1440, home em 360, um caderno aberto em 1440) em `docs/frentes/F30-paletas-fable/prints/`.
4. PR `F30 · Paletas, rodada 2` com os prints e os links `https://pontape.org/?cor=<nome>`. Report: `maestri ask "Regente" "F30 pronta: <PR>"`.

## Regras

O checkout `~/Projects/VidaNova` é do Regente: não commite, troque branch, faça stash ou reset nele. DIARIO em `docs/frentes/F30-paletas-fable/DIARIO.md`. Nada de `src/lib/ledger/**`, `scripts/**`, `.github/**`.
