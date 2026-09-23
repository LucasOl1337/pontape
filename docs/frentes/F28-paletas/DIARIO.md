# F28 · Diário

## 23/09/2026

- Parti de `origin/main` no worktree `.worktrees/bruto`, branch `bruto/f28-paletas`.
- Reuni as cores em `src/styles/palettes.css`: Jornal sem atributo e cinco variações. As amostras usam os mesmos tokens por seletor CSS, sem cópia dos hexadecimais. `tokens.css` ficou só com medidas e tipografia.
- Troquei as cores fixas de `site.css` e `LogoMark.astro` por tokens. Criei tokens próprios para as faixas invertidas, os estados e os ícones do livro. Noite mantém o caderno mais claro que o fundo.
- Montei o seletor temporário em `PaletteSwitcher.astro` e `palette.ts`. O script do `<head>` resolve `?cor=` antes da primeira pintura e guarda a escolha quando o armazenamento está disponível. A cor da barra do navegador acompanha `--paper`.
- O teste `palettes.test.ts` lê o CSS como fonte e mede pares de texto, acento, estados, faixas invertidas e caderno. As seis paletas passam 4,5:1.
- `npm run check` passou após a implementação inicial: 133 testes, CSP com quatro hashes e home de 29,7 KB ao abrir. Depois fiz um ajuste pequeno no script do `<head>` para preservar `?cor=` mesmo se o armazenamento falhar; vou repetir o check antes da PR.
- Na bancada `f28-paletas`, workspace 6, perfil/CDP próprios verificados. Capturas em `prints/`: seis homes em 1440 × 900; home e `/transparencia` em 360 px, Mata e Noite. Nenhuma das dez páginas teve rolagem horizontal. A troca atualizou URL, armazenamento e `theme-color`; recarregar manteve Noite; Esc fechou e devolveu o foco.

## Decisões propostas

- Depois que o Lucas escolher a paleta, renomear `--red` para `--accent` numa frente coordenada com Design/UI. Mantive o nome agora para não disputar a F29.

## Próximo passo

- Repetir `npm run check`, atualizar a branch com `origin/main`, abrir a PR com links das capturas e orientar como retirar o seletor/promover a paleta escolhida. Avisar o Regente.
