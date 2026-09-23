# F18 · Ensaio do lançamento

Dono: `bruto` (ExecutorBruto) · Worktree: `.worktrees/bruto` · Branch: `bruto/f18-ensaio` a partir da `main` atualizada

## Por que agora

O site v1 e o livro real estão na `main`. Falta o nome pra ir pro ar, mas todo o resto dá pra ensaiar agora, no build de produção local. Se algo estiver quebrado, a gente descobre antes do público.

## Como

1. `npm ci && npm run build && npm run preview` no teu worktree, com a porta que o preview mostrar.
2. Abra o site na **tua bancada agent-bench** (nunca no navegador do Lucas) e passe por cada item do [CHECKLIST-LANCAMENTO](../../operacao/CHECKLIST-LANCAMENTO.md) que dá pra conferir localmente, mais:
   - console sem erro de CSP em home, `/transparencia` e 404;
   - teclado do começo ao fim (Tab, Enter, Esc nos diálogos, setas nas abas), foco sempre visível;
   - 360px e 320px sem rolagem lateral; zoom 200%; botão A+; `prefers-reduced-motion`; modo de alto contraste (`forced-colors`);
   - Conferir no livro real dá "Tudo certo" e, no modo exemplo, pega a linha mudada;
   - todos os links internos; links pro GitHub marcados como "repositório ainda fechado";
   - tempo de carga com a rede limitada a 3G lento (DevTools/CDP) e o tamanho transferido.
3. Pra cada falha: issue no GitHub com passos, print e label (`M1`, `design` ou `codigo`), sem consertar componente do Design/UI. Conserto trivial em documento pode ir na tua PR.

## Entregáveis

- `docs/operacao/ENSAIO-LANCAMENTO.md`: data, commit testado, cada item com passou/falhou/não deu pra testar e o porquê, números de carga, prints em `docs/operacao/ensaio/`.
- Issues abertas pras falhas.
- Diário em `docs/frentes/F18-ensaio-lancamento/DIARIO.md`.

## Limites

Sem deploy e sem conta. Só a tua bancada. Não mexa em `src/`.

## Pronto quando

Todo item do checklist tem resultado, cada falha virou issue e a PR foi reportada ao Regente. O Design/UI tá trocando o livro provisório pelo real e fazendo o polimento (F16): se eles entrarem na `main` durante o ensaio, refaça os itens afetados.
