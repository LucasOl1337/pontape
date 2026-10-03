# Home e vitrine · 03/10/2026

Pedido do Lucas na sessão jcode `hog`: melhorar o visual da home e ter uma vitrine de componentes no Astro. Retomada no worktree `regente-visual`, branch `regente/visual-vitrine`, a partir de `d01523f`. A sessão anterior tinha preparado o ambiente e os prints; nenhuma alteração de código estava feita.

## O que mudou

- A escada para de crescer até 576 px de subida em tela alta. Cada subida tem teto de 48 px, com ajuste específico pra janela baixa. Em 1920×1080, a faixa da AI termina em 629 px, contra cerca de 798 px no print anterior.
- Leitura e desenho usam colunas de 416 px e 664 px, com 40 px entre elas na grade de 1120 px. Título, texto e aviso ficam mais próximos da base da escada.
- Início e Sua vez reservam a mesma linha de número dos outros passos. Todos os nomes começam na mesma altura. A faixa de rótulos tem espaço pra três linhas quando a fonte é ampliada.
- O título mantém tamanho e posição nos nove estados. Trocar de passo não desloca o mapa. Texto comprido segue no fluxo da página.
- As duas ações do Início ficam lado a lado no celular, com a mesma altura mesmo quando uma frase quebra.
- `/dev/vitrine` reúne a escada real com livro fictício, os quatro estados, ações e tipografia. A integração Astro injeta a rota apenas em desenvolvimento.
- `pontape dev capture` registra home e vitrine e mede a geometria no Chromium da bancada. Usa os recursos nativos do Node 24, sem dependência nova. Guia em [CLI](../cli/README.md#vitrine-e-captura-visual).

## Antes e depois

| Tela | Antes | Depois |
|---|---|---|
| Celular, 390×844 | [Print](prints/2026-10-03-home/antes-home-390x844-s0.png) | [Print](prints/2026-10-03-home/home-390x844-s0.png) |
| Janela curta, 1440×667 | [Print](prints/2026-10-03-home/antes-home-1440x667-s0.png) | [Print](prints/2026-10-03-home/home-1440x667-s0.png) |
| Monitor, 1920×1080 | [Print](prints/2026-10-03-home/antes-home-1920x1080-s0.png) | [Print](prints/2026-10-03-home/home-1920x1080-s0.png) |

[Sistema](prints/2026-10-03-home/home-1440x667-s1.png), [Sua vez](prints/2026-10-03-home/home-1440x667-s8.png) e [vitrine](prints/2026-10-03-home/vitrine-1440x667.png). Prints anteriores são os já capturados pela sessão jcode; os novos saíram da bancada `pontape-visual`. A barra de desenvolvimento do Astro fica fora dos novos prints.

## Validação

- `pontape check --scope all --json`, Node 24.21: sucesso. Lint e tipos sem erro; 223 testes Vitest, 11 Python, livro, build, CSP e orçamento. Continua o hint antigo do protótipo sobre um `await` sem efeito.
- Home: 28,7 KB ao abrir, 30 KB incluindo o carregamento sob demanda, abaixo de 60 KB.
- Comando de captura: [27 estados](prints/2026-10-03-home/report.json) em 390×844, 1440×667 e 1920×1080. Sem rolagem lateral, sobreposição, rolagem interna do painel, mudança de posição, nomes desalinhados ou nomes sobre a faixa da AI.
- [99 estados extras](prints/2026-10-03-home/larguras-e-fonte.json): 320×667, 360×780, 600×600, 960×600, 1024×768, 1179×560, 1180×560, 1280×640, 1366×768, 1920×889 com fonte de 20 px e 2560×1100. Sem os defeitos acima. 55 ações de teclado verificaram setas, Home e End.
- [Build de produção](prints/2026-10-03-home/build.json): 36 estados nos três tamanhos principais e em 1920×889 com fonte ampliada, além de 20 ações de teclado. Todos passaram.
- A vitrine não gerou arquivo no `dist`, não entrou no sitemap e respondeu 404 no preview da build.

O relatório mede posição e seleção. Os PNGs foram revisados também. Painéis longos, como Sua vez em janela baixa, podem exigir rolagem da página; a escada permanece inteira. Não houve publicação nem operação de dinheiro.
