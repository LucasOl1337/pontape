# Mapa do site

F31 · dono: `prumo` · versão 0.3 · 23/09/2026

Como o site está depois da F29 (home pro leigo) e da F31 (cadernos em páginas próprias). A cara é a Crônica r2 (D018), com a escada como home; a direção geral está em [`DIRECAO.md`](DIRECAO.md). A versão 0.2, de blocos empilhados, ficou no histórico do git.

## Páginas

| Endereço | Página | Pra quem | O que mostra |
|---|---|---|---|
| `/` | A escada | Quem nunca ouviu falar | O que é, se já funciona e o que fazer agora, numa tela |
| `/transparencia` | Transparência | Doador, imprensa, quem desconfia | O livro em palavra de gente: o que entra, por que confiar, o que já aconteceu e o botão Conferir |
| `/transparencia/tecnico` | Parte técnica do livro | Quem é técnico | Toda ação com marca e fonte, o exemplo adulterado, os arquivos e os conferidores |
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
- **Faixa preta** "Em construção. O projeto ainda não recebe doação nem atende ninguém. Ver o que já existe" em todas menos a home e `/transparencia`, que dizem isso no próprio texto.
- **Rodapé:** marca, livro público, organização (sem registro formal nem canal de contato), privacidade, data do estado das peças e o link "Pra quem quer construir junto".
- **Botão "Cores · em teste"**, fixo embaixo à direita até o Lucas escolher a paleta (D025, D026); no celular, numa barra de ponta a ponta. `?cor=<nome>` troca e guarda a escolha no aparelho. O aviso que aparece embaixo (toast) sobe pra ficar acima dele.

## A escada `/`

Nove degraus, cada um é uma aba que abre no mesmo lugar. Setas, Home e End andam na escada.

| Degrau | Rótulo | O que abre |
|---|---|---|
| 0 | Início | Título, uma frase de apoio (`OPENING` em `journey.ts`: primeiro a IA que escolhe com cuidado e o tudo à vista, depois comida, roupa e trabalho), a linha "Ainda em construção", os botões "Ver como funciona" e "Quero ajudar" |
| 1 a 7 | Sistema, Busca, Conversa, Comida e roupa, Apoio da IA, Trabalho, Tudo à vista | "Passo k de 7", título, texto, a linha "já funciona?" na cor do estado da peça, anterior e próximo, "Mais detalhes" |
| 7 | Tudo à vista | Também os dois únicos números da home: ações no livro e R$ recebido, com "Abrir o livro" |
| 8 | Sua vez | Doar, Ser voluntário e Oferecer vaga ("Ainda não abriu", e quando abre); Construir junto ("Já dá pra ajudar", leva pra `/construir`) |

- **A escada começa pelo sistema** (D032): o passo 1 é escolher com cuidado quem entra, com IA e com tudo à vista. É a M3, e a linha da IA nasce nele (campo `aiFrom` do passo). Um teste falha se o passo 1 deixar de ser esse ou se a frase de abertura falar de comida antes da IA.
- **O apoio da IA vem antes do trabalho** (D028): primeiro a IA ajuda a pessoa a entender o que ela sabe fazer e o que ela quer; depois ela é apresentada pra vaga. Um teste falha se a ordem inverter.
- **O trilho da IA:** uma linha vermelha por baixo dos nomes dos degraus, que nasce no Sistema (o passo com `aiFrom`), passa por todos e segue depois do "Sua vez" com uma seta, com a frase "a IA vai junto, sempre e de graça". É o desenho da D028: a IA acompanha a pessoa desde a escolha e nunca para. O leitor de tela ouve a mesma coisa numa frase escondida logo depois da escada.
- A linha "já funciona?" de cada passo começa com as palavras do estado da peça em `src/data/site/modules.ts`; um teste falha se não bater. Outro teste barra o jargão de quem constrói (peça, gargalo, M1…) no texto da escada.
- **"Mais detalhes"** abre a ficha da peça: um diálogo pequeno no meio da tela, com o estado, o que é, como funciona, o que falta, quem pode ajudar, e peça anterior e próxima.
- **Âncoras:** `#inicio`, `#como-funciona` (degrau 1), `#degrau-0` a `#degrau-8`, `#transparencia` (degrau 7), `#ajudar` (degrau 8), `#m1` a `#m9` (ficha da peça).

## Transparência `/transparencia` e a parte técnica (F32, D029)

Duas camadas. A primeira fala com quem nunca ouviu falar de GitHub; um teste barra nela GitHub, PR, commit, hash, JSON, SHA-256, marca e número de PR. Todo o texto dela mora em `src/data/site/livro.ts`.

- **Primeira camada `/transparencia`,** sem a faixa preta: "Transparência" e o botão **Parte técnica**; o título "Tudo que o projeto faz, à vista." e duas frases; os números numa linha (ações, entrou, saiu) com a hora da última; o **Conferir**, com o resultado em palavra de gente; **O que entra no livro** (o dinheiro, as atividades, as decisões, cada um com o estado); **Por que dá pra confiar** (o lacre e a corrente, com desenho); **O que já aconteceu** (as cinco últimas, com a frase simples de cada decisão e as mudanças do mesmo dia numa linha); e a Parte técnica de novo no fim.
- **Parte técnica `/transparencia/tecnico`:** "Transparência › Parte técnica", os quatro números com a marca mais recente, o Conferir com a marca, todas as ações ("Livro de verdade" ou "Ver um exemplo", filtro por tipo, página por página, "Mudar uma linha escondido") e três abas: Como conferir (com os downloads e os links do GitHub: como conferir, conferidor em Python, contrato, operação, repositório), Dinheiro, O que entra.
- **Frase simples da decisão:** a coluna "Em palavras simples" do `DECISOES.md`, lida no build como o título (D013). Sem ela, "Decisão nova sobre o projeto", e um teste avisa.
- **Âncoras:** `#conferir` e `#confiar` na primeira camada. `#livro`, `#conferir`, `#acoes`, `#como-conferir`, `#dinheiro`, `#o-que-entra` na parte técnica. Os links antigos `/transparencia#acoes`, `#como-conferir`, `#dinheiro`, `#o-que-entra`, `?exemplo` e `?tipo=` levam pra parte técnica.
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
