# Protótipo do site

Duas páginas estáticas, sem build: a home (`index.html`) e o livro público (`transparencia.html`). Serve pra bater o olho e aprovar a direção. É descartável: o site de verdade é a F07 etapa 1, em Astro.

## Abrir

```sh
python3 -m http.server 8741 --directory design/prototipo
# http://127.0.0.1:8741/  e  http://127.0.0.1:8741/transparencia.html
```

Também abre direto pelo arquivo. Precisa de internet pras fontes.

## Peças

| Arquivo | O que é |
|---|---|
| `styles.css` | Tokens e componentes das duas páginas |
| `common.js` | Nome do projeto, ícones, selos, Ouvir, topo, avisos |
| `ledger.js` | Livro público: frase de cada ação, desenho da corrente, Conferir |
| `home.js`, `ledger-page.js` | O que é só da home e só do livro |
| `ledger-data.js` | Gerado. O livro do protótipo, no formato do contrato da F08 |
| `contributions-data.js` | Gerado. Cópia de `docs/contribuicoes/contribuicoes.json` |
| `ledger/` | Fontes do livro (`real.source.json`, `sample.source.json`), o livro em JSON pra baixar e o gerador |

## Regerar os dados

```sh
node design/prototipo/ledger/build-ledger.mjs     # Node 24 e npm ci: valida com src/lib/ledger/schema.ts
node design/prototipo/sync-contributions.mjs
```

O livro "de verdade" do protótipo tem só fatos reais do projeto (D001 a D012, criação do repositório, PRs integradas). O livro oficial semeado e o verificador aberto vêm da F08. O exemplo é inventado e só aparece com a faixa de exemplo.

## O que testar

- 360px e desktop, nas duas páginas.
- **Ouvir** em cada bloco e **A+** no topo.
- Home: degraus e cartões de módulo abrem o detalhe (`#m1` a `#m9` no endereço); "Ajuda solta" e "Caminho inteiro"; setas na trilha de "Como funciona"; filtros das contribuições; **Conferir** no bloco 05.
- Livro: **Conferir**; filtros por tipo (Dinheiro, Vida real e Candidato mostram o vazio com o motivo); "Ver um exemplo"; lá dentro, "Simular uma ação chegando" e "Mudar uma linha escondido", e depois Conferir.
- `transparencia.html?tipo=finance` e `?exemplo` abrem já filtrado ou no exemplo.

## Trocar o nome

`const PROJECT_NAME` em `common.js`.

## Prints

Em [`prints/`](prints/): home e livro em 360px e 1440px, o detalhe de um módulo e o Conferir pegando uma linha mudada no exemplo.
