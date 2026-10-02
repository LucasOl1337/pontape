# Layout centralizado e corrente explicada

## Pedido e escopo

Lucas pediu em 02/10/2026 conteúdo centralizado, com espaço nas laterais de monitores grandes, e uma explicação de transparência que uma pessoa leiga entenda.

Branch: `regente/layout-centrado`. Trabalho isolado em `.worktrees/regente-layout`.

## Entrega

- Conteúdo limitado a 80rem, mais margens. Cabeçalho, páginas e escada seguem o mesmo alinhamento.
- A corrente mantém três linhas na tela. Cada marca tem uma forma, e a linha seguinte guarda a forma anterior.
- A adulteração troca R$ 50 por R$ 20, muda a marca e destaca onde não bate. A última etapa mostra o registro externo.
- Exemplo identificado como fictício. A explicação promete detectar mudança, não impedir qualquer edição do arquivo.
- Cinco etapas selecionáveis, Voltar, Próximo, Ver de novo e controle de reprodução. Pausa ao passar o ponteiro, manter foco ou esconder a aba. A preferência por movimento reduzido impede autoplay.
- Sem JavaScript, as cinco explicações continuam disponíveis.
- Corrigidos os tokens inexistentes `--space-5` e `--space-10`. Duas colunas a partir de 1280px, cartões empilhados abaixo de 700px.

## Validação local

- `mise exec node@24.21.0 -- npm run check`: passou. Inclui lint, Astro, testes JS e Python, livro, build, CSP e orçamento.
- `git diff --check`: passou.
- Chromium da bancada `pontape-layout`, artefato servido pelo Astro preview: 320, 390, 600, 700, 1024, 1180, 1280, 1366, 1920 e 2560px sem rolagem horizontal, colisão entre colunas ou sobreposição de selo e rótulo.
- Navegação pelas cinco etapas, reinício, Voltar desabilitado na primeira etapa e pausa manual: passaram.
- Movimento reduzido, autoplay com tempo real, foco mantido após saída do ponteiro e pausa preservada após troca da preferência: passaram.
- Sem JavaScript: lista das cinco etapas visível e controles escondidos.
- Capturas e teste de navegador locais: `~/.jcode/scratch/shots/verified-*.png` e `~/.jcode/scratch/verify-layout.mjs`.

## Limites e próximo passo

A revisão visual e os testes não substituem uma sessão com leitor de tela ou uma avaliação de compreensão com pessoas leigas. Nenhum dado real de candidato ou doação foi acrescentado. Próximo passo: PR, CI, merge e conferência do artefato publicado pelo timer existente.
