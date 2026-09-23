# Diário · F19 v2 · Crônica

## 22/09/2026 · rodada 1

**Feito**
- Li AGENTS, PRD e BRIEF da F19. Direção: editorial e narrativo, scrollytelling com seções presas e traço SVG que se desenha no scroll.
- Fontes: Newsreader (OFL) subsetada em instâncias fixas pra caber nos 120 KB. A variável inteira passava de 100 KB sozinha.
- Home reescrita em `src/components/cronica/`: Capa, Pra você, capítulos 1 a 5, Classificados, Como entrar, Expediente, Fim. Blocos antigos da v1 removidos.
- `/transparencia` reescrita: capa do caderno, registro com Conferir preso ao lado, dinheiro, como conferir (scrollytelling com o texto canônico real da última ação) e manual de redação (o que entra e o que nunca entra).
- Motor de scroll em `src/scripts/story.ts`: cada cena recebe `--p` de 0 a 1 e o CSS desenha os traços com `stroke-dashoffset`. Sem JS ou com movimento reduzido, tudo aparece desenhado.
- Merge da main com o nome PontaPé (D016). O nome só vem de `PROJECT_NAME`.

**Achados**
- A bancada roda o Chromium em escala 1.1 e ignora a emulação de tela por CDP. Solução: janelas popup redimensionadas com xdotool pra dar 360 e 1440 CSS exatos, e prints costurados de capturas reais.
- O orçamento da home fica no limite (60,0 KB com o verificador) porque o livro inteiro vai embutido pro Conferir.

**Decisões propostas**
- Pro futuro: o Conferir da home poderia buscar `/livro/ledger.json` só no clique, em vez de embutir o livro inteiro. Isso tira uns 3 KB da home e para de crescer com o livro. Mexe no caminho do verificador, então fica pro EngenheiroFino avaliar.

**Onde parou**
- Rodada 1 fechada como está, PR em rascunho. O Regente abriu a rodada 2 (F22) com o feedback do Lucas: scroll longo demais, a escada da Crônica acertou o jeito de explicar, espaço da tela mal usado.
