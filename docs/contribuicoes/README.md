# Contribuições abertas

`contribuicoes.json` é o catálogo local que o site pode ler durante o build. Cada entrada representa **uma issue aberta** em [LucasOl1337/pontape](https://github.com/LucasOl1337/pontape/issues). O site mostra a lista em `/construir/tarefas`. A ordem atual põe tarefas da plataforma e da transparência primeiro; não é uma promessa de calendário ou de que os demais módulos já estejam operando.

## Formato

O arquivo contém um array de objetos:

| Campo | Tipo | Uso |
|---|---|---|
| `id` | string | Identificador estável em `kebab-case`; não depende do título nem do número da issue. |
| `title` | string | Título **idêntico** ao da issue aberta. |
| `summary` | string | Uma frase pública para o cartão do site, sem dado pessoal. |
| `type` | string | Uma das labels de tipo: `codigo`, `design`, `pesquisa`, `campo`, `juridico`, `conteudo`. |
| `module` | string | Módulo do [PRD](../PRD.md#5-módulos), de `M1` a `M9`; também é label da issue. |
| `goodFirst` | boolean | `true` quando a issue tem a label `bom-primeiro-passo`. |
| `bottleneck` | string ou null | Pergunta em aberto de `/construir/gargalos` (`src/data/site/bottlenecks.ts`) à qual a tarefa responde; a tarefa aparece embaixo dela. `null` para tarefas sem ligação direta. |
| `issueNumber` | integer | Número da issue; URL: `https://github.com/LucasOl1337/pontape/issues/{issueNumber}`. |

Valores de `bottleneck`: `achar-a-pessoa-certa`, `conversar-com-quem-nao-le`, `receber-doacao-do-jeito-certo`, `escolha-justa`, `seguranca-no-encontro`. Eles cobrem as cinco perguntas de `/construir/gargalos`. O texto mostrado ao público usa o título de cada pergunta, não esses identificadores.

## Como manter

1. Abra ou atualize a issue com contexto em três linhas, como ajudar, critério de pronto, documentos e labels de tipo/módulo. Escreva como se o repositório já fosse público; use exemplos fictícios e nunca dados de candidatos, doadores ou voluntários.
2. Adicione ou atualize a entrada neste JSON na mesma PR de manutenção. Copie número e título **exatos** da issue; confira `type`, `module` e `goodFirst` contra as labels. Mantenha o `id` de uma tarefa existente mesmo se o título mudar.
3. Ao fechar uma issue, remova sua entrada do catálogo de **abertas** na mesma PR. Se uma tarefa mudar de escopo, revise `summary` e `bottleneck`.
4. Revise o estado real das issues antes de publicar o site. A lista é um retrato do GitHub, não uma fonte independente de verdade.

O arquivo não contém inscrição, formulário ou promessa de contato. As tarefas sobre campo e voz descrevem preparações futuras; nenhuma autoriza iniciar o piloto ou coletar dados reais.
