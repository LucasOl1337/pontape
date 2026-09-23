# F22 v5 · Pluma

A escada é texto: sete títulos crescem e se deslocam, sem desenho nem animação.
Cada degrau representa um assunto: ideia, caminho, partes, livro, dúvidas, tarefas e ajuda.
Rádios nativos permitem toque, clique e setas; o conteúdo muda no mesmo painel.
No desktop a home ocupa **1,00 tela** em 1440×900 (900 px); no celular, **1,48 tela** em 360×780 (1.155 px).
O livro abre com zero honesto, 37 ações, Conferir e as três mais recentes; o resto aparece quando pedido.

## Capturas

- [Home · 1440×900](prints/home-1440.png) · [Home · 360×780](prints/home-360.png)
- [Livro · 1440](prints/livro-1440.png) · [Livro · 360](prints/livro-360.png)

## Implementação

A home só usa JavaScript para abrir o degrau certo ao seguir os links antigos do cabeçalho. O rádio nativo faz a navegação por setas e a troca de painel por CSS. O livro mantém o verificador real da F08, os filtros e o exemplo fictício, agora dentro de áreas abertas sob demanda. Nenhuma dependência nova.
