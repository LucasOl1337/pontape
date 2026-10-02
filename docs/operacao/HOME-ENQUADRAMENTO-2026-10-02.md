# Home depois do print do Lucas, 02/10/2026

## O que o teste anterior não pegou

A PR #127 validou larguras, mas usou telas altas. O print do Lucas mostrou a escada cortada, com navegação abaixo da área útil. Em 1440×667 CSS, cenário equivalente a 1920×889 com ampliação de cerca de 133%, a versão publicada terminava a linha da AI em y=729. A home impunha piso de 41,5rem mais folga, mesmo quando a janela não tinha essa altura. A escada absoluta e o painel com rolagem interna tornavam a composição dependente dessa sobra.

## Correção

- Home com conteúdo de até 1120px, incluindo cabeçalho e fechamento alinhados. Outras páginas mantêm a largura anterior.
- No início, título e apresentação em duas colunas, escada em uma linha própria abaixo. Não há sobreposição entre texto e degraus.
- Ao abrir um passo, a escada vem antes do texto e continua inteira. Texto longo rola com a página, nunca dentro de um painel.
- Saem piso de altura, posicionamento absoluto e dependência de container de tamanho.
- Ícones ficam junto dos números e nomes, abaixo do chão, sem depender da altura de um degrau.
- Alturas entre 560 e 650px recebem espaçamento compacto, sem esconder conteúdo.

## Evidência

`mise exec node@24.21.0 -- npm run check` passou. Revisão independente sem bloqueador estático.

117 combinações no Chromium da bancada: nove etapas em 13 cenários, incluindo 1440×667, 1280×593, 1180×560, 1179×560, 1920×889 com fonte raiz de 20px, 2560×1100 e celulares de 320 e 390px. Sem rolagem horizontal, sobreposição entre painel e escada ou rolagem interna. Em desktop, linha da AI visível em todas as etapas e contador inicial dentro da altura útil.

No limite 1180×560, linha da AI termina em 520,5px e contador em 551,5px. Em 1440×667, a linha termina em 577,1px, contra 729px antes. Home/End e retorno de Sua vez ao Início testados com foco preservado.

Artefatos locais: `~/.jcode/scratch/verify-home.mjs`, `home-test.log`, `home-check.log` e `shots/home-*.png`.

## Limite

A escala exata do Brave do Lucas não foi lida. A reprodução usa viewport equivalente e fonte ampliada na bancada, sem tocar na sessão dele. Passos longos podem exigir rolagem normal da página. A escada não é escondida nem cortada por um painel.
