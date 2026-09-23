# F34 · Celular, trilho da IA e números em cima dos botões

Dono: `prumo` (Prumo · Claude Opus 5.5, xhigh) · Branches `prumo/f34-<assunto>` a partir da `main` · Worktree: `.worktrees/prumo` · Começo: 23/09/2026

## O que o Lucas disse

[Feedback de 23/09](../../fontes/2026-09-23-feedback-anil-e-celular.md), com [print da base da escada no computador](../../fontes/prints/escada-trilho-numeros-2026-09-23.png):

1. "Agora vamos **otimizar a versão pro celular**."
2. "A parte onde fala que **a IA vai junto, sempre e de graça, precisa melhorar o encaixe**."
3. "**Os números estão invadindo alguns botões.** Principalmente no celular, mas no PC eu já observei isso também."

## O que o print mostra

Leia o print antes de começar. Na base da escada, no computador, com a paleta Anil:

- Os números dos degraus (1 a 7) ficam **em cima da linha do chão**, cortados por ela.
- O trilho "a IA vai junto" fica espremido embaixo dos nomes, colado na borda, e a seta some embaixo do botão Cores.
- Tem **texto claro aparecendo por trás da escada**, à direita, a partir do degrau 5 (parece o texto de um painel ou da ficha vazando). Descubra de onde vem e prove a causa antes de mexer.

## O que fazer

1. **Reproduzir primeiro:** as três coisas do print, na tua bancada, na largura do Lucas (o print tem uns 1750 px) e nos quatro tamanhos de sempre. Anote no DIARIO a causa provada de cada uma.
2. **Números e botões:** nenhum número de degrau pode encostar em linha, botão ou texto, em nenhum tamanho. No celular isso é o principal.
3. **O trilho da IA:** tem que parecer parte da escada, não uma legenda solta. Você escolhe o desenho, com a regra da F31: não cruzar o texto nem os botões do degrau aberto.
4. **Celular de ponta a ponta:** home (os 9 degraus), `/construir/*`, `/transparencia` e `/transparencia/tecnico`, em 360×780 e 390×844. Alvo de toque de 44 px, texto que cabe, primeira tela que responde "o que é e o que eu faço". Uma PR por causa, por gravidade.

## Ordem com a F33

O Anil está tirando o botão Cores e tudo que existia por causa dele (`--dock-h`, `scroll-padding-bottom`, toast levantado), numa PR pequena. **Comece reproduzindo e diagnosticando, e só mexa no CSS depois que a F33 entrar na `main`** (eu aviso). Sem o botão, a primeira tela muda de altura.

## Pronto quando

Por PR: `npm run check`, prints antes e depois em 1920 e 360 (e na largura onde o defeito aparece), report `maestri ask "Regente" "F34 <assunto> pronta: <PR>"`. A frente: nenhum número encostando em nada, o trilho encaixado e o site inteiro redondo no celular.
