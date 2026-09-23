# Quadro

Estado das frentes. Só o Regente edita, a cada evento. Espelhado na nota "VidaNova Quadro" do canvas Maestri.

Atualizado: 22/09/2026 · Ordem de execução do Lucas (D009): **plataforma e transparência total primeiro**, entrevista e conexões depois.

## Em andamento

| ID | Frente | Dono | Branch | Estado | Próximo passo |
|---|---|---|---|---|---|
| F08 | [Livro público de ações](frentes/F08-livro-publico/BRIEF.md) | fino | `fino/f08-livro` | despachada | Schema, hash encadeado, verificador, livro semeado com ações reais |
| F07 | [Site v1 em código](frentes/F07-site-v1/BRIEF.md) | design | `design/f07-prep`, depois `design/f07-site` | etapa 0 em andamento; base já na main | Protótipo com `/transparencia` e contribuições abertas, depois código |
| F10 | [Governança open source, sem licença](frentes/F10-governanca/BRIEF.md) | bruto | `bruto/f10-governanca` | despachada | GOVERNANCA, conduta, segurança, modelo de PR |

## Fila

| ID | Frente | Depende de |
|---|---|---|
| F10b | `LICENSE` | decisão 7 do Lucas |
| F05 | Captação e seleção: candidato certo, roteiro, voluntários, panfleto | depois da plataforma (D009) |
| F06 | [Do selecionado ao primeiro salário](frentes/F06-pesquisa-oportunidades/BRIEF.md) | em espera (D009) |
| F09 | Piloto da entrevista por voz | F05, depois da plataforma (D009) |

## Pra o Lucas decidir

Detalhe em [PRD §10](PRD.md#10-perguntas-pro-lucas).

1. **Nome e domínio.** Em conversa. Domínio grátis da Hostinger cobre `.com`
2. Trecho perdido do áudio sobre dinheiro e "igreja"
3. Trecho perdido antes da parte do design
4. Doação antes de existir CNPJ. F03 recomenda **só captar depois de associação, CNPJ e conta própria**; Asaas como primeiro teste ([ESTRUTURA-JURIDICA.md](pesquisa/ESTRUTURA-JURIDICA.md), [DOACOES-E-TRANSPARENCIA.md](pesquisa/DOACOES-E-TRANSPARENCIA.md))
5. Cidade do piloto
6. Quem decide a seleção do candidato
7. Licença open source. F03 e F02 recomendam **Apache-2.0**; AGPL-3.0 se a prioridade for obrigar quem copia a abrir o código
8. Quando abrir o repositório
9. Responsável legal pelos dados dos candidatos (LGPD)
10. Apelido por pessoa ("pessoa #014") no livro público, só com consentimento?

## Feito

| ID | Frente | Resultado |
|---|---|---|
| F02 etapa 2 | Base do código | [PR #23](https://github.com/LucasOl1337/VidaNova/pull/23) integrada. Astro + TS + React, ESLint, Vitest, CI verde; conferida pelo Regente num worktree limpo |
| F13 | Contribuições abertas | [PR #24](https://github.com/LucasOl1337/VidaNova/pull/24) integrada. 17 issues (#6 a #22), 17 labels, 3 modelos, `docs/contribuicoes/contribuicoes.json` |
| F01 | Direção visual e protótipo | [PR #5](https://github.com/LucasOl1337/VidaNova/pull/5) integrada. [DIRECAO](design/DIRECAO.md), [MAPA-DO-SITE](design/MAPA-DO-SITE.md), protótipo em `design/prototipo/`; propostas em D011 |
| F02 etapa 1 | Arquitetura | [PR #4](https://github.com/LucasOl1337/VidaNova/pull/4) integrada. [ARQUITETURA.md](arquitetura/ARQUITETURA.md); stack em D006 e D007 |
| F04 | Pesquisa: voz e dispositivo | [PR #3](https://github.com/LucasOl1337/VidaNova/pull/3) integrada (substituiu a #1 após falha do provedor do Devin). Direção em D008 |
| F03 | Pesquisa: dinheiro, jurídico e nome | [PR #2](https://github.com/LucasOl1337/VidaNova/pull/2) integrada. Três relatórios em `docs/pesquisa/` |
