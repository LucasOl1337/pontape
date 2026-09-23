# Quadro

Estado das frentes. Só o Regente edita, a cada evento. Espelhado na nota "VidaNova Quadro" do canvas Maestri.

Atualizado: 22/09/2026

## Em andamento

| ID | Frente | Dono | Branch | Estado | Próximo passo |
|---|---|---|---|---|---|
| F01 | [Direção visual e mapa do site](frentes/F01-design-direcao/BRIEF.md) | design | `design/f01-direcao` | despachada | Protótipo da home + direção visual |
| F02 | [Arquitetura e base do código](frentes/F02-engenharia-base/BRIEF.md) | fino | `fino/f02-codigo` | etapa 2 liberada | Esqueleto Astro + CI, escopo em BRIEF |
| F06 | [Pesquisa: do selecionado ao primeiro salário](frentes/F06-pesquisa-oportunidades/BRIEF.md) | bruto | `bruto/f06-oportunidades` | despachada | Relatório em `docs/pesquisa/` |

## Fila

| ID | Frente | Depende de |
|---|---|---|
| F05 | Captação e seleção: quem é o candidato certo, roteiro da entrevista, voluntários, panfleto, pontos públicos | pronta pra despachar (F04 feita) |
| F07 | Site v1 em código, a partir do protótipo da F01 sobre a base da F02 | F01, F02 |
| F08 | Livro-caixa público e painel de transparência ao vivo | F02, F03, decisão 4 do Lucas |
| F09 | Piloto da entrevista por voz | F02, F04, F05 |
| F10 | Governança open source: licença, contribuição, código de conduta, templates | F03, decisão 7 do Lucas |

## Pra o Lucas decidir

Detalhe em [PRD §10](PRD.md#10-perguntas-pro-lucas).

1. Nome e domínio. F03 recomenda **Virarumo**, **Viraelo** ou **Passarumo**, domínios livres em 22/09 ([NOMES.md](pesquisa/NOMES.md))
2. Trecho perdido do áudio sobre dinheiro e "igreja"
3. Trecho perdido antes da parte do design
4. Doação antes de existir CNPJ. F03 recomenda **só captar depois de associação, CNPJ e conta própria**; Asaas como primeiro teste ([ESTRUTURA-JURIDICA.md](pesquisa/ESTRUTURA-JURIDICA.md), [DOACOES-E-TRANSPARENCIA.md](pesquisa/DOACOES-E-TRANSPARENCIA.md))
5. Cidade do piloto
6. Quem decide a seleção do candidato
7. Licença open source. F03 recomenda **Apache-2.0**; AGPL-3.0 se a prioridade for obrigar quem copia a abrir o código
8. Quando abrir o repositório
9. Responsável legal pelos dados dos candidatos (LGPD)

## Feito

| ID | Frente | Resultado |
|---|---|---|
| F02 etapa 1 | Arquitetura | [PR #4](https://github.com/LucasOl1337/VidaNova/pull/4) integrada. [ARQUITETURA.md](arquitetura/ARQUITETURA.md); stack em D006 e D007 |
| F04 | Pesquisa: voz e dispositivo | [PR #3](https://github.com/LucasOl1337/VidaNova/pull/3) integrada (substituiu a #1 após falha do provedor do Devin). Direção em D008 |
| F03 | Pesquisa: dinheiro, jurídico e nome | [PR #2](https://github.com/LucasOl1337/VidaNova/pull/2) integrada. Três relatórios em `docs/pesquisa/`; recomendações em "Pra o Lucas decidir" |
