# F22 v4 · Maracatu

## 22/09/2026 · Rodada 2

- Rodada 1 preservada em variante/v4-maracatu, PR #39 em rascunho, árvore limpa.
- Branch variante/r2-v4-maracatu criada de origin/main. Servidor anterior parado.
- Lidos AGENTS, QUADRO, feedback F19 e BRIEF F22; vistos os dois prints da Crônica enviados pelo Lucas.
- Decisão: cinco degraus de navegação (ideia, caminho, módulos, transparência e participação). Personagem sobe e cada degrau troca um cartão no mesmo espaço. A jornada de sete etapas fica dentro do cartão Caminho.
- Desktop planejado em uma tela, usando toda a largura. Mobile com escada compacta e cartão logo abaixo. Livro com resumo, Conferir e últimas ações; lista completa paginada.
- Identidade da R1 preservada: amarelo solar, roxo, coral, verde; marca e SVGs próprios. Sem dependências novas nem mudanças em dados/núcleo.
- Próximo: implementar, medir todas as seleções e validar em 1440x900 / 360x780.

## 22/09/2026 · Implementação e validação

- Nova home com cinco degraus e cartão único. A ideia explica o propósito; Caminho contém as sete etapas; Módulos mostra os nove estados; À vista mostra zero honesto e o total de ações; Sua parte abre gargalos, contribuições e ajuda.
- Escada SVG com personagem que sobe por clique, setas e Home/End, com curva de mola. Leitura por voz, foco visível, diálogos com devolução de foco e botão real de tela cheia.
- Livro refeito em duas áreas: Conferir e três registros por página. Registro completo abre em diálogo; paginação e filtros mantêm o restante fora da tela. Exemplo fictício e adulteração preservados.
- Verificação usa a função F08 integral. Controles que trocam os dados ficam desabilitados enquanto ela roda; erro de carregamento permite tentar de novo.
- Bancada exclusiva vidanova-maracatu reaberta no workspace 11, display :85, perfil próprio validado e controle do agente.
- Desktop 1440x900: todos os cinco degraus e todas as sete etapas internas têm documento de 900 px, sem overflow horizontal e com cartão na mesma posição. Livro inicial também tem 900 px.
- Mobile 360x780: degraus 1 a 5 mediram 1256, 1331, 1536, 1278 e 1336 px. Inicial 1,61 telas; pior caso 1,97 telas. Todas as larguras = 360 px. Etapas internas entre 1309 e 1331 px.
- Teclado: ArrowRight selecionou capítulo 2; End selecionou capítulo 5 e moveu personagem para translate(520px,-212px), sem alterar scrollY. End na jornada selecionou Prova. Diálogo M4 abriu e Escape devolveu foco ao botão correto.
- Tela cheia entrou e saiu pelo botão via Enter; estado aria-pressed acompanhou.
- Paginação percorreu 36 registros únicos, de 36 a 1, em 12 páginas de 3, sem rolar o documento. Conferir na página 12 validou as 36 ações. Dinheiro real vazio; exemplo adulterado falhou na ação 2 e restauração voltou a passar.
- Check integral aprovado; orçamento provisório: home 27,8 KB, livro 45,7 KB incluindo Conferir. Fontes 87,1 KB.
- Próximo: capturas finais, README, PR em rascunho e reporte.

## 22/09/2026 · Entrega preparada

- Sete prints finais salvos (home inicial, caminho, módulos no celular, última etapa e livro). README registra a escolha dos degraus, tabela completa de alturas e validações.
- Resultado final de `npm run check`: aprovado integralmente. Home 27,8 KB; livro 37,1 KB inicial / 45,7 KB com F08; fontes 87,1 KB.
- Livro também medido após compactação: 900 px em 1440x900; 1772 px em 360x780.
- Corrigidos: número achatado no primeiro degrau, altura do cartão de módulos no desktop, espaços após quebras ocultadas no celular e data do último registro no fuso de São Paulo.
- Texto ampliado pode crescer em altura para não encobrir controles. Nenhuma mudança no núcleo ou dados.
- Próximo: commit, push, PR em rascunho F22 v4 · Maracatu e reporte pelo Maestri.

## 22/09/2026 · Entregue

- PR #49 aberta e confirmada em rascunho: https://github.com/LucasOl1337/VidaNova/pull/49.
- Regente recebeu o reporte pelo Maestri e registrou a entrega. Orientação recebida: manter 4344 ativa e aguardar avaliação do Lucas.
- Depois do último build, servidor reiniciado para servir a revisão final sem cache antigo de otimização. Conferir repetido no navegador: 36 ações, resultado Tudo certo. Home e livro respondem HTTP 200.
- Bancada vidanova-maracatu encerrada após salvar capturas; nenhuma aba de teste pendente. Processo Astro permanece ativo no worktree da R2, porta 4344.
- Estado final: entregue, sem merge ou deploy, aguardando avaliação. Próxima ação somente por pedido do Regente.
