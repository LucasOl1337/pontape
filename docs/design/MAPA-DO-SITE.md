# Mapa do site

F31 · dono: `prumo` · versão 0.3 · 23/09/2026

Como o site está depois da F29 (home pro leigo) e da F31 (cadernos em páginas próprias). A cara é a Crônica r2 (D018), com a escada como home; a direção geral está em [`DIRECAO.md`](DIRECAO.md). A versão 0.2, de blocos empilhados, ficou no histórico do git.

## Páginas

| Endereço | Página | Pra quem | O que mostra |
|---|---|---|---|
| `/` | A escada | Quem nunca ouviu falar | O que é, se já funciona e o que fazer agora, numa tela |
| `/transparencia` | Livro público | Doador, imprensa, quem desconfia | Toda ação do projeto e o botão Conferir |
| `/construir` | Construir junto | Quem quer ajudar a construir | Quatro portas pros cadernos abaixo |
| `/construir/pecas` | As 9 partes do projeto | Quem constrói | Cada peça com selo de estado e ficha |
| `/construir/gargalos` | O que a gente ainda não sabe resolver | Especialista | As cinco perguntas em aberto |
| `/construir/tarefas` | Tarefas abertas | Contribuidor | As tarefas do GitHub, com filtro |
| `/construir/codigo-aberto` | Código aberto | Contribuidor | Como propor mudança e o repositório |
| qualquer outro | 404 | Quem errou o endereço | Escada com o degrau faltando e três saídas |
| `/livro/*.json` | Dados do livro | Quem confere por fora | `ledger`, `events`, `checkpoint` e `trust`, pro verificador aberto |

Endereço e âncora ficam em português, porque aparecem no link que as pessoas compartilham.

## Em todas as páginas

- **Cabeçalho:** marca e quatro itens: Como funciona, Transparência, Como ajudar, Construir junto. No celular, Menu. O item da página fica marcado; dentro de `/construir/*`, "Construir junto" fica marcado.
- **Faixa preta** "Em construção. O projeto ainda não recebe doação nem atende ninguém. Ver o que já existe" em todas menos a home, que diz isso na primeira tela.
- **Rodapé:** marca, livro público, organização (sem registro formal nem canal de contato), privacidade, data do estado das peças e o link "Pra quem quer construir junto".
- **Botão "Cores · em teste"**, fixo embaixo à esquerda até o Lucas escolher a paleta (D025, D026). `?cor=<nome>` troca e guarda a escolha no aparelho.

## A escada `/`

Nove degraus, cada um é uma aba que abre no mesmo lugar. Setas, Home e End andam na escada.

| Degrau | Rótulo | O que abre |
|---|---|---|
| 0 | Início | Título, uma frase de apoio, a linha "Ainda em construção", os botões "Ver como funciona" e "Quero ajudar" |
| 1 a 7 | Encontro, Conversa, Escolha, Comida e roupa, Trabalho, Apoio da IA, Tudo à vista | "Passo k de 7", título, texto, a linha "já funciona?" na cor do estado da peça, anterior e próximo, "Mais detalhes" |
| 7 | Tudo à vista | Também os dois únicos números da home: ações no livro e R$ recebido, com "Abrir o livro" |
| 8 | Sua vez | Doar, Ser voluntário e Oferecer vaga ("Ainda não abriu", e quando abre); Construir junto ("Já dá pra ajudar", leva pra `/construir`) |

- A linha "já funciona?" de cada passo começa com as palavras do estado da peça em `src/data/site/modules.ts`; um teste falha se não bater. Outro teste barra o jargão de quem constrói (peça, gargalo, M1…) no texto da escada.
- **"Mais detalhes"** abre a ficha da peça: um diálogo pequeno no meio da tela, com o estado, o que é, como funciona, o que falta, quem pode ajudar, e peça anterior e próxima.
- **Âncoras:** `#inicio`, `#como-funciona` (degrau 1), `#degrau-0` a `#degrau-8`, `#transparencia` (degrau 7), `#ajudar` (degrau 8), `#m1` a `#m9` (ficha da peça).

## Livro público `/transparencia`

- **Topo:** "Tudo que o projeto faz, à vista.", a regra "Toda ação aparece. Quem é a pessoa, não.", quatro números (ações no livro, entrou, saiu, marca mais recente), a nota do livro estático e o **Conferir**, que refaz a conta de cada ação no aparelho.
- **Todas as ações:** "Livro de verdade" ou "Ver um exemplo" (`?exemplo`), filtro por tipo, lista em corrente, página por página.
- **Três abas embaixo:** Como conferir, Dinheiro, O que entra.
- **Âncoras:** `#livro`, `#conferir`, `#acoes`, `#como-conferir`, `#dinheiro`, `#o-que-entra`.
- Regras do livro: [contrato da F08](../transparencia/CONTRATO.md).

## Construir junto `/construir`

Os cinco usam o mesmo molde (`src/components/cronica/Caderno.astro`): onde a pessoa está ("Construir junto › Tarefas"), título, uma frase, régua dupla, o conteúdo e, no fim, as outras três portas. Nome, endereço e texto de cada porta moram em `src/data/site/cadernos.ts`. Aqui o jargão pode: é a segunda camada.

| Página | O que tem | Âncoras |
|---|---|---|
| `/construir` | As quatro portas com uma frase cada, e a nota com a data do estado das peças, a licença e as fontes | |
| `/construir/pecas` | Uma frase com a conta por estado; as nove peças com selo; a ficha no clique; "O que quer dizer cada selo" | `#m1` a `#m9` abrem a ficha |
| `/construir/gargalos` | Cinco perguntas, fechadas. Aberta, cada uma mostra por que é difícil, o que já está andando, quem pode ajudar, as tarefas dela e "Tem uma ideia? Conte no GitHub" | `#<id>` abre a pergunta, por exemplo `#escolha-justa` |
| `/construir/tarefas` | "Todas / Boas pra começar" e "Assunto", que combinam. Cada cartão: tipo, "Boa pra começar" quando é, título, uma frase e "Ver a tarefa no GitHub". "Todas" mostra seis e "Mostrar as outras" | |
| `/construir/codigo-aberto` | Três passos (olhe, escolha uma tarefa ou proponha, um admin revisa) e o cartão do repositório | |

Dados: peças em `src/data/site/modules.ts`, perguntas em `bottlenecks.ts`, tarefas em [`docs/contribuicoes/contribuicoes.json`](../contribuicoes/contribuicoes.json).

## Endereços antigos que redirecionam

Até a F29 os cadernos abriam por cima da home. Os links velhos continuam valendo: um script no `<head>` da home manda pro endereço novo antes de pintar, mantendo `?cor=`.

| Antigo | Vai pra |
|---|---|
| `/#construir` | `/construir` |
| `/#modulos` | `/construir/pecas` |
| `/#gargalos` | `/construir/gargalos` |
| `/#gargalo-<id>` | `/construir/gargalos#<id>` |
| `/#contribuicoes` | `/construir/tarefas` |
| `/#codigo-aberto` | `/construir/codigo-aberto` |

As âncoras da versão de blocos que não estão aqui (`#pra-voce`, `#problema`) abrem a home no começo.

## Selo de estado

| Selo | Quer dizer |
|---|---|
| **Funcionando** | Já está no ar e dá pra usar |
| **Em construção** | A equipe está fazendo agora |
| **Precisa de ajuda** | Ainda não sabemos resolver. Aqui sua ajuda vale mais |
| **Planejado** | Está no plano. Ainda não começou |
| **Ainda não abriu** | Existe no plano, mas ninguém de fora consegue usar ainda: doar, ser voluntário, oferecer vaga |

O estado de cada peça mora em `src/data/site/modules.ts`, com a data em `project.ts`.

## Regras que valem pra todas as páginas

- Frase curta e direta, que quem lê pouco entende ouvindo em voz alta. Sem travessão. Jargão só dentro de Construir junto.
- Número que ainda não existe aparece como zero com o motivo. Exemplo só com faixa de exemplo.
- Nada de formulário, lista de aviso ou campo que colete dado (D012).
- Nenhuma foto. Só pictograma, bloco e número.
- Cor só por token de `src/styles/palettes.css`.
- Até 60 KB por página (HTML, CSS e JS com gzip) e 120 KB de fontes, medidos no `npm run check`.
