# F22 v4 · Maracatu

Uma escada que se sobe, com um personagem sem rosto acompanhando cada escolha.<br />
Cinco degraus representam cinco partes do projeto: ideia, caminho, módulos, livro e participação.<br />
O degrau selecionado abre um cartão grande no mesmo lugar, sem mandar o leitor descer a página.<br />
Amarelo solar, roxo, coral, verde, formas geométricas e movimento de mola preservam a identidade da rodada 1.<br />
O conteúdo completo fica a um clique, e o livro troca o rolo de registros por páginas de três ações.

## Ver

[Home local](http://127.0.0.1:4344/) · [Livro local](http://127.0.0.1:4344/transparencia)

```sh
npx astro dev --host 127.0.0.1 --port 4344
```

Branch `variante/r2-v4-maracatu`, criada de `origin/main`. A rodada 1 permanece na PR #39, em rascunho. A porta foi mantida para o seletor de variantes.

## Quantas telas

Medida pelo `document.documentElement.scrollHeight`, incluindo cabeçalho, faixa honesta e rodapé, dividida pela altura do viewport. Texto no tamanho padrão. Diálogos fechados; o detalhe é aberto por pedido.

| Estado da home | 1440×900 | 360×780 |
|---|---:|---:|
| A ideia, inicial | 900 px · **1 tela** | 1256 px · **1,61 telas** |
| O caminho | 900 px · 1 tela | 1331 px · 1,71 telas |
| Os módulos | 900 px · 1 tela | 1536 px · **1,97 telas** |
| À vista | 900 px · 1 tela | 1278 px · 1,64 telas |
| Sua parte | 900 px · 1 tela | 1336 px · 1,71 telas |

**Pior caso da home: 1 tela em 1440; menos de 2 telas em 360.** As sete etapas dentro de O caminho também cabem em uma tela no desktop; no celular variam entre 1309 e 1331 px. Nenhum estado teve rolagem lateral.

Livro inicial: **900 px / 1 tela** no desktop e **1772 px / 2,27 telas** no celular. Totais, Conferir e últimas ações aparecem juntos no desktop. A lista tem três registros por página, em qualquer largura.

## Navegação e conteúdo

- **A ideia:** intenção, apoio inicial, trabalho, IA e natureza sem fins lucrativos.
- **O caminho:** sete passos da jornada, a partir dos dados existentes. Os números internos trocam a explicação e levam ao módulo correspondente.
- **Os módulos:** todos os nove módulos com estado. Cada botão abre definição, operação, ponto forte, o que falta e quem pode ajudar.
- **À vista:** dinheiro real, número de ações e acesso direto ao livro.
- **Sua parte:** cinco gargalos, 17 contribuições listadas e os quatro jeitos de ajudar, com a disponibilidade honesta de cada canal.

Escolhi seções do projeto como degraus para que toda a apresentação possa ser navegada pela mesma escada, inclusive transparência e participação. A jornada da pessoa continua completa dentro de O caminho.

Os degraus usam tabs com setas, Home/End, Enter e foco visível. O personagem acompanha a seleção com uma curva de mola; `prefers-reduced-motion` remove o deslocamento animado. O cartão não muda de posição no desktop. Diálogos devolvem o foco ao botão que os abriu. O cabeçalho oferece tela cheia no desktop; em um iframe que não permita esse recurso, uma mensagem orienta a abrir uma aba própria.

No livro, a paginação muda apenas os registros visíveis. Conferir continua verificando **o conjunto inteiro**, incluindo as outras páginas. Filtros, livro real, exemplo fictício e demonstração de adulteração foram preservados. Enquanto confere, não é possível trocar ou alterar os dados em conferência. Falha de carregamento libera uma nova tentativa.

Sem dependências novas. Nome vindo de `PROJECT_NAME`, SVGs próprios e fontes locais. Nenhuma alteração própria em `src/data`, `src/lib`, scripts de operação, workflows ou package.json.

## Validação

Em 22/09/2026, `npm run check` **passou integralmente**: lint, tipos, 127 testes, integridade das 36 ações reais, build, CSP e orçamento.

| Página | Inicial, gzip | Com Conferir | Meta |
|---|---:|---:|---:|
| Home | 27,8 KB | 27,8 KB | 60 KB |
| Livro | 37,1 KB | 45,7 KB | 60 KB |

Fontes: 87,1 KB de 120 KB. Verificador F08: 8,6 KB sob demanda. A home tem atalho para conferir na página do livro.

Verificado no Chromium da bancada exclusiva `vidanova-maracatu`, workspace 11:

- Cinco degraus e sete etapas internas medidos nas duas larguras; limites da tabela acima.
- ArrowRight e End trocam o capítulo e o personagem sem alterar `scrollY`; End na jornada abre Prova.
- Módulo M4 abre; Escape fecha e devolve foco ao botão do módulo.
- Tela cheia entra e sai por Enter; `aria-pressed` acompanha.
- Paginação alcança **36 registros únicos, do nº 36 ao nº 1**, em 12 páginas.
- Conferir na última página valida as **36 ações**, e libera os seletores ao terminar.
- Dinheiro real mostra vazio honesto; exemplo alterado quebra na ação 2; desfazer permite conferir novamente.
- Console sem erros na rodada funcional. Ouvir conserva a síntese do navegador; saída de áudio não aferida nesta bancada.

## Prints

As capturas mostram a página inteira, nos viewports da tabela.

| Página/estado | 1440 px | 360 px |
|---|---|---|
| Home inicial | [Ver](prints/home-1440.png) | [Ver](prints/home-360.png) |
| Caminho / Trabalho | [Ver](prints/home-caminho-1440.png) | |
| Módulos, maior altura no celular | | [Ver](prints/home-modulos-360.png) |
| Sua parte, personagem no topo | [Ver](prints/home-somar-1440.png) | |
| Livro | [Ver](prints/livro-1440.png) | [Ver](prints/livro-360.png) |
