# F22 v5 · Pluma · diário

## 22/09/2026 · início

- Rodada 1 concluída na PR em rascunho #38, branch `variante/v5-pluma`, check verde.
- Li o feedback F19 R1 e o brief F22 na `origin/main`. Os prints da Crônica mostram texto e escada pequenos no meio de muito espaço vazio.
- Parei o servidor da rodada 1 na porta 4345 e criei `variante/r2-v5-pluma` diretamente de `origin/main`.
- Reaproveitei apenas a base visual da Pluma R1: branco, azul, tipografia, cabeçalho, rodapé e estilo do livro.
- Decisão da escada: sete degraus são sete assuntos do site. Cada clique mostra o conteúdo no painel ao lado, no mesmo lugar. No celular, a escada fica vertical e larga para o dedo.
- Próximo passo: home curta e livro compacto, depois medir altura real em 1440×900 e 360×780 na bancada.

## Decisões propostas

- Nenhuma.

## 22/09/2026 · implementação e teste

- Home refeita com sete degraus tipográficos e rádio nativo. Todos os temas exigidos pelo brief ficam em painéis no mesmo lugar. Os nove módulos mostram estado individual; tarefas e gargalos abrem detalhes quando pedido.
- Livro reduzido: topo com valores reais, 36 ações, Conferir e três ações recentes. Lista filtrável, dinheiro detalhado e explicação ficam em três áreas nativas fechadas por padrão.
- Bancada `f22-pluma` no workspace 6, Chromium próprio com `lives_in: f22-pluma`. Capturas em 1440×900 e 360×780 guardadas em `prints/`, sem a barra de desenvolvimento.
- Medição real da home: 900 px de altura em viewport 1440×900, **1,00 tela**; 1.155 px em 360×780, **1,48 tela**. Sem rolagem lateral em nenhuma delas; abrir os nove módulos em 360 px também não criou rolagem lateral.
- A seta direita mudou o rádio do degrau 1 para o 2. O link As partes selecionou o degrau 3. Conferir validou 36 ações reais. O exemplo validou 20 ações e acusou a alteração na ação nº 2.
- `npm run check` passou na primeira versão da rodada 2: 127 testes, livro válido, orçamento de 16,9 KB na home e 37,9 KB no livro com verificador sob demanda. Repetir depois do último ajuste de CSS.
- Próximo passo: check final, commit, PR em rascunho e reporte ao Regente. Servidor Astro deve continuar na porta 4345.
- Durante a revisão, `origin/main` recebeu mais uma ação do projeto. Fiz merge fast-forward do registro e refiz check e prints: agora são **37 ações reais**, Conferir passou, home 17,1 KB e livro 38,4 KB com carga sob demanda. As alturas continuaram 900 px e 1.155 px.
