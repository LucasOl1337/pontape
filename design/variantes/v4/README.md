# F19 v4 · Maracatu

Uma praça gráfica brasileira para dar o primeiro passo junto.<br />
Amarelo solar, roxo profundo, coral e verde, com cor chapada e bastante presença.<br />
Personagens geométricos sem rosto, flores, arcos e um livro desenhados em SVG próprio.<br />
A pessoa escolhe um apoio e sobe a escada, com movimento de mola e explicação curta.<br />
O mesmo sistema visual chega à jornada, aos módulos e ao livro real do PontaPé.

## Ver a variante

[Home local](http://127.0.0.1:4344/) · [Livro local](http://127.0.0.1:4344/transparencia)

```sh
npx astro dev --host 127.0.0.1 --port 4344
```

Branch: `variante/v4-maracatu`. Proposta visual para escolha, sem deploy.
Nome recebido de `PROJECT_NAME`, após integrar a D016 pela main.

## O que muda e por quê

- **Entrada solar:** título grande, ilustração dominante e apoios manipuláveis. No celular, a ilustração vem logo após o título.
- **Escada de verdade:** cinco botões movem o personagem, anunciam o texto do apoio e abrem seu módulo. Aceita toque, Tab, Enter, setas, Home e End. A flor sai do caminho no último degrau.
- **SVG como linguagem:** quatro desenhos reutilizáveis, sem imagem externa, pessoa real ou biblioteca de animação. A marca usa duas formas que crescem juntas.
- **Jornada e transparência próximas da abertura:** o leitor encontra cedo como funciona e como conferir. As sete etapas, os nove módulos e seus estados continuam vindo dos dados existentes.
- **Livro com a mesma identidade:** capa gráfica, blocos de cor, valores reais e verificador F08. Exemplo fictício permanece explicitamente marcado.
- **Mola discreta:** botões, cartões e personagem usam curvas CSS com retorno. `prefers-reduced-motion` elimina o deslocamento animado do personagem.

Não há dependência nova. Fontes Archivo e Atkinson servidas localmente. Nenhuma alteração própria em dados, núcleo do livro, scripts de operação, workflows ou package.json.

## Validação

`npm run check` aprovado integralmente em 22/09/2026, após integrar a PR #37 da main: lint, tipos, **127 testes**, livro real, build, CSP e orçamento de ambas as páginas.

| Página | Ao abrir, gzip | Incluindo Conferir | Meta |
|---|---:|---:|---:|
| Home | 37,1 KB | 45,7 KB | 60 KB |
| Livro | 35,1 KB | 43,7 KB | 60 KB |

O verificador F08 com Zod Mini, recebido da main na PR #37, soma 8,6 KB sob demanda. As duas páginas ficam abaixo da meta, inclusive depois de conferir. O CSS específico do livro foi separado e declarações substituídas da base foram removidas. Fontes: 87,1 KB, abaixo da meta de 120 KB.

Validação no Chromium da bancada exclusiva `vidanova-maracatu`, workspace 6:

- Documento com largura exata de 360 e 1440 CSS px, sem rolagem lateral nas duas páginas; texto ampliado também cabe em 360 px na home.
- Escada por clique e seta; foco acompanha a seleção; diálogo de IA contínua abre e fecha com Escape.
- Jornada muda para Trabalho; filtro Planejado mostra três módulos. Menu móvel abre e fecha.
- Conferir confirma as 34 ações reais nas duas páginas. Filtro Dinheiro mostra o vazio honesto.
- Exemplo adulterado falha na ação 2; depois de desfazer, confere novamente.
- Pares principais de texto medidos: roxo escuro/amarelo 10,08:1; violeta/amarelo 4,78:1; creme/violeta 7,11:1; texto secundário/creme 6,78:1; texto claro/violeta 5,86:1; roxo/coral 5,06:1.
- Ouvir conserva o recurso existente e depende da voz disponível no aparelho; síntese de áudio não foi aferida nesta bancada.

A execução simultânea de build e dev invalidou uma dependência otimizada do Vite durante os testes. O servidor foi reiniciado e o Conferir foi repetido com sucesso. A porta 4344 permanece ativa.

## Prints

Capturas na bancada autorizada, antes da atualização final do livro recebida da main, quando havia 34 ações. Arquivos sem `-completa` mostram a primeira tela; os demais mostram a página inteira.

| Página | 360 px | 1440 px |
|---|---|---|
| Home | [Primeira tela](prints/home-360.png) · [Completa](prints/home-360-completa.png) | [Primeira tela](prints/home-1440.png) · [Completa](prints/home-1440-completa.png) |
| Livro | [Primeira tela](prints/livro-360.png) · [Completa](prints/livro-360-completa.png) | [Primeira tela](prints/livro-1440.png) · [Completa](prints/livro-1440-completa.png) |
