# F21 · Comparativo das cinco variantes

Dono: `bruto` (ExecutorBruto) · Worktree: `.worktrees/bruto` · Branch: `bruto/f21-comparativo` a partir da `main` atualizada

## Por que agora

O Lucas vai escolher uma das cinco variantes visuais (F19) pelo gosto. Esta frente dá a ele, junto do gosto, uma régua objetiva e igual pra todas, pra ninguém escolher uma direção bonita que quebra no celular barato.

## Como

Cada variante roda na própria porta (Prisma 4341, Crônica 4342, Ábaco 4343, Maracatu 4344, Pluma 4345) e tem PR em rascunho. Só leitura: **não mexa em nenhum worktree de variante** nem peça mudança aos agentes delas. Use a tua bancada agent-bench.

Pra cada variante que estiver pronta (PR aberta), meça o mesmo conjunto que o ensaio da F18 mediu no v1:

1. `npm run check` no commit da PR (num worktree temporário teu, fora dos delas) e o budget ao abrir e com o Conferir.
2. Console sem erro de CSP, Conferir no livro real e no exemplo, adulteração detectada.
3. 320px e 360px sem rolagem lateral, com e sem o A+ (se existir); zoom 200%.
4. Teclado do começo ao fim, foco visível; `prefers-reduced-motion`; `forced-colors`.
5. Contraste dos textos principais (AA).
6. Carga com 3G lento: tempo e bytes transferidos.
7. As regras que não caem do BRIEF da F19: faixa honesta, zero honesto, selo por módulo, nenhuma foto de pessoa, sem travessão no texto.

## Entregável

`docs/operacao/COMPARATIVO-VARIANTES.md`: uma tabela com as cinco nas colunas e os itens nas linhas (passou, falhou, número), mais três linhas por variante do que chamou atenção, **sem opinar sobre qual é mais bonita**. Prints de problema em `docs/operacao/comparativo/`. Se uma variante ainda não estiver pronta quando você chegar nela, pule e volte.

Diário em `docs/frentes/F21-comparativo-variantes/DIARIO.md`.

## Pronto quando

As cinco colunas preenchidas, a PR aberta e o report ao Regente.

## Etapa b · rodada 2 (aberta pelo Regente depois da PR #51)

Branch `bruto/f21b-comparativo-r2` a partir da `main`. A rodada 1 virou referência: o Lucas pediu a rodada 2 (F22), com a escada e a home curta. Aplique a mesma régua nas PRs da F22 (`gh pr list`, títulos `F22 vN`), no commit da PR e também no merge com a `main`, como você fez com o Ábaco. Acrescente duas linhas novas na tabela:

- **Telas de altura** da home e do livro em 1440×900 e em 360×780, medidas por você (não copie o README da variante).
- **Escada:** cada degrau abre o conteúdo no mesmo lugar, as setas do teclado andam entre degraus, e o link direto pra um degrau funciona.

Entregue em `docs/operacao/COMPARATIVO-VARIANTES-R2.md`. Pluma (#48), Maracatu (#49) e Ábaco (#50) já estão prontas; Prisma e Crônica chegam depois.
