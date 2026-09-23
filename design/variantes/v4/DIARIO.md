# F19 v4 · Maracatu

## 22/09/2026 · Direção

- Li AGENTS, PRD, QUADRO e BRIEF da F19. Branch confirmada: `variante/v4-maracatu`.
- Conceito: uma praça gráfica brasileira. Amarelo solar, roxo profundo, coral e verde. Formas de azulejo, arcos, flores e personagens sem rosto.
- A escada será manipulável por toque e teclado, com personagem que acompanha o degrau e movimento de mola. Dados, estados, filtros, módulos e verificador existentes serão preservados.
- Sem dependência nova. SVG local e fontes locais existentes.
- Bancada exclusiva `vidanova-maracatu`, display :81, workspace 6, controle do agente.
- Próximo: implementar home e livro, validar em 360/1440, registrar prints e check.

## Decisões propostas

Nenhuma alteração de escopo ou de dados.

## 22/09/2026 · Implementação e validação

- Home e livro redesenhados com amarelo solar, roxo, coral e verde, componentes arredondados e marca de dois arcos.
- Sistema SVG próprio: personagem sem rosto, flor, arco e livro. Escada de cinco apoios com personagem móvel, texto anunciado por `aria-live`, atalhos de setas/Home/End e ligação com os diálogos reais dos módulos.
- Jornada de sete passos, filtros, diálogo, Ouvir, texto maior, livros real/fictício e dados preservados. Ordem da home coloca jornada e transparência logo depois da abertura.
- Merge de `origin/main` em 9bc2883, por pedido do Regente: nome PontaPé vindo de PROJECT_NAME e livro atualizado com 34 ações. Sem edição própria em src/data, src/lib ou scripts.
- 360 px: largura do documento = 360, nas duas páginas. Ilustração aparece logo após o título no celular.
- Teclado: ArrowRight levou do degrau 4 ao 5; diálogo abriu IA contínua; Escape fechou. Jornada selecionou Trabalho e filtro Planejado mostrou os três módulos esperados.
- Livro: 34 ações reais conferidas, zero dinheiro. Filtro Dinheiro mostrou vazio honesto. Exemplo adulterado quebrou na ação 2; restauração em conferência final.
- O build durante o dev invalidou o cache de otimização do Vite (504). Reiniciei somente o servidor desta variante, e Conferir passou sem erro de console. Porta 4344 ativa.
- Check: lint, tipos, 127 testes, verificação do livro, build e CSP passaram. Budget final provisório: home 37,0 KB inicial / 61,4 KB com verificador; livro 34,9 / 59,2 KB. Fontes 87,1 KB. Exceção da home permitida pelo BRIEF será explicada no README: 1,4 KB acima da meta incluindo F08 com Zod, preservando o mesmo verificador.
- CSS exclusivo do livro separado; declarações substituídas da base removidas. Import do verificador aponta direto para a mesma função F08.
- Próximo: prints finais, README, commits e PR em rascunho.

## 22/09/2026 · Entrega visual fechada

- Conferir real passou com 34 ações; exemplo alterado quebrou na ação 2 e voltou a conferir depois de desfazer.
- Corrigi o grid da capa do livro após extrair seu CSS e a sobreposição da flor sobre o personagem no último degrau.
- Menu mobile e texto maior verificados. Home com A+ permanece em 360 px sem overflow.
- Pares principais da paleta medidos entre 4,78:1 e 10,08:1. Movimento reduzido contemplado em CSS.
- Oito PNGs salvos: home/livro em 360 e 1440, primeira tela e página completa. README inclui conceito, escopo, validação, limites e budget exato (37,1/61,4 KB home; 34,9/59,3 KB livro).
- Último `npm run check`: todos os passos aprovados exceto orçamento da home (1,4 KB além da meta após carregar F08). Exceção expressamente documentada, como permite o BRIEF.
- Próximo: commit, push, PR em rascunho e reporte ao Regente.
