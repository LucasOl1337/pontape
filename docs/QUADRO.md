# Quadro · PontaPé

Estado das frentes. Só o Regente edita, a cada evento. Espelhado na nota "VidaNova Quadro" do canvas Maestri.

Atualizado: 23/09/2026, 13:22 · **Site no ar em https://pontape.org** (D019), publicação automática ligada (D021)

**Hoje:** home pro leigo (F29), cadernos em páginas (F31), transparência em duas camadas (F32) e paleta Anil (F33, D030) no ar. A escada da F34 foi **reprovada** (D031): a F36 acha o meio termo entre o antes e o agora. A ordem da escada muda de novo (D032): a F37 põe o sistema de escolha, com IA e transparência, no primeiro degrau. Às 13:04 todos os agentes reiniciaram com conversa nova, a pedido do Lucas; cada um retoma pelo BRIEF e pelo DIARIO. · Ordem de execução do Lucas (D009): **plataforma e transparência total primeiro**, entrevista e conexões depois.

## Em andamento

| ID | Frente | Dono | Branch | Estado | Próximo passo |
|---|---|---|---|---|---|
| F36 | [Escada: meio termo entre o antes e o agora](frentes/F36-escada-meio-termo/BRIEF.md) | prumo | `prumo/f36-*` | Despachada 13:08 (D031) | Proposta no DIARIO com a causa do enquadramento |
| F37 | [A escada começa pelo sistema](frentes/F37-sistema-primeiro/BRIEF.md) | design | `design/f37-sistema-primeiro` | Despachada 13:22 (D032) | Proposta de ordem, nome no lugar do Encontro e frase de abertura; a PR só entra com o OK do Lucas |
| F31 | [Layout e UX, começando pelos cadernos](frentes/F31-ux-cadernos/BRIEF.md) | prumo | `prumo/f31-*` | #67 a #69, #71, #72, #75 a #79 integradas; nenhum defeito alto ou médio, teclado e foco conferidos em 9 páginas | Em espera. Sobra de baixa no DIARIO |
| F25 | [Assinatura e âncora do livro no ar](frentes/F25-assinatura-ancora/BRIEF.md) | fino | `fino/f25-ancora` | **pausada** (D023) | Retoma depois da F27; âncora 43 aguardando `ots upgrade` |

Issues abertas: #55 (beacon do Cloudflare barrado pela CSP), #56 (livro em 320 px, parte do A+ some com a F27), #57 (rollback ainda fala de Pages).

## Fila

| ID | Frente | Depende de |
|---|---|---|
| F10b | `LICENSE` | decisão 7 do Lucas |
| F05 | Captação e seleção: candidato certo, roteiro, voluntários, panfleto | depois da plataforma (D009) |
| F06 | [Do selecionado ao primeiro salário](frentes/F06-pesquisa-oportunidades/BRIEF.md) | em espera (D009) |
| F09 | Piloto da entrevista por voz | F05, depois da plataforma (D009) |

## Pra o Lucas decidir

0. ~~Custódia da chave e primeira ancoragem~~ **Resolvido:** chave com o Regente fora do repo, checkpoint 43 assinado e carimbado (F25)

Detalhe em [PRD §10](PRD.md#10-perguntas-pro-lucas).

1. ~~Domínio~~ **Resolvido:** `pontape.org` comprado no Cloudflare e site publicado (D019)
2. Trecho perdido do áudio sobre dinheiro e "igreja"
3. Trecho perdido antes da parte do design
4. Doação antes de existir CNPJ. F03 recomenda **só captar depois de associação, CNPJ e conta própria**; Asaas como primeiro teste ([ESTRUTURA-JURIDICA.md](pesquisa/ESTRUTURA-JURIDICA.md), [DOACOES-E-TRANSPARENCIA.md](pesquisa/DOACOES-E-TRANSPARENCIA.md))
5. Cidade do piloto
6. Quem decide a seleção do candidato
7. ~~Licença~~ **Resolvido:** Apache-2.0 (D020); aviso privado de vulnerabilidade ligado no GitHub
8. ~~Abrir o repositório~~ **Resolvido:** público desde 23/09/2026 (D020)
9. Responsável legal pelos dados dos candidatos (LGPD)
10. Apelido por pessoa ("pessoa #014") no livro público, só com consentimento?
11. Trecho perdido do áudio das 13:15 sobre a ordem: o que vem depois do sistema e os "pontos" onde a gente acha a pessoa ([feedback](fontes/2026-09-23-feedback-sistema-primeiro.md))

## Feito

| ID | Frente | Resultado |
|---|---|---|
| F35 | Renomear `--red` pra `--accent` | [PR #85](https://github.com/LucasOl1337/pontape/pull/85) integrada. Só o nome; prints idênticos pixel a pixel |
| F34 | Celular, trilho da IA e números | **Reprovada pelo Lucas às 13:05 (D031); a F36 refaz a escada.** PRs [#81](https://github.com/LucasOl1337/pontape/pull/81) a [#84](https://github.com/LucasOl1337/pontape/pull/84) integradas até 12:48: números a 8 px do chão e ícone sem invadir; corrimão da IA colado nos degraus; tela baixa sem rolagem; todo alvo solto com 44 px no celular. O texto por trás da escada no print era outra janela vista pela opacidade do Omarchy, não o site |
| F33 | A Anil vira a paleta do site | [PR #80](https://github.com/LucasOl1337/pontape/pull/80) integrada 12:20 (D030). Seletor fora; favicon, ícone e imagens de compartilhar na Anil. Proposta pra depois da F34: renomear `--red` pra `--accent` |
| F32 | Transparência que um leigo entende | [PR #73](https://github.com/LucasOl1337/pontape/pull/73) integrada 10:58 (D029). `/transparencia` em palavra de gente, com a corrente desenhada; tudo técnico em `/transparencia/tecnico`. Decisões com frase simples na sexta coluna do DECISOES. Primeira camada de 40,5 pra 28 KB |
| F30 | Paletas, rodada 2 (Anil, Fable) | [PR #70](https://github.com/LucasOl1337/pontape/pull/70) integrada 10:35. Anil, Pauta, Envelope, Pêssego e Carvão no lugar das reprovadas, cada uma a partir de um material; pesquisa em [PALETAS.md](pesquisa/PALETAS.md). Aguardando o Lucas escolher |
| F29 | Home que um leigo entende | [PR #66](https://github.com/LucasOl1337/pontape/pull/66) integrada 09:49. Um título, menu com quatro itens, degrau enxuto, caderno "Construir junto" no lugar da faixa "Nesta edição" |
| F28 | Paletas com seletor | [PR #64](https://github.com/LucasOl1337/pontape/pull/64) integrada 09:31 (D025). Jornal, Mata, Mar, Ipê, Sol e Noite em `src/styles/palettes.css`, teste de contraste AA, `?cor=<nome>`. Ajuste da `theme-color` na [PR #65](https://github.com/LucasOl1337/pontape/pull/65) |
| F27 | Tirar o Ouvir e o A+ | [PR #63](https://github.com/LucasOl1337/pontape/pull/63) integrada 09:29 (D024). HTML da home de 92 KB pra 77 KB |
| F26 | Vigília noturna de polimento | [#58](https://github.com/LucasOl1337/pontape/pull/58), [#59](https://github.com/LucasOl1337/pontape/pull/59) integradas de madrugada; [#60](https://github.com/LucasOl1337/pontape/pull/60), [#61](https://github.com/LucasOl1337/pontape/pull/61) e [#62](https://github.com/LucasOl1337/pontape/pull/62) revisadas e integradas pelo Regente em 23/09 de manhã. Pausou às 00:51 por mensagem ambígua; executores dispensados |
| F24 | Ensaio pós-lançamento | [PR #58](https://github.com/LucasOl1337/pontape/pull/58); falhas viraram as issues #54 a #57 |
| F14b | CSP gerada no build | [PR #29](https://github.com/LucasOl1337/VidaNova/pull/29) integrada. Build calcula o hash de todo script embutido e falha se faltar algum ou se aparecer `unsafe-inline` |
| F22 | Variantes rodada 2 | **Escolhida a Crônica** ([PR #52](https://github.com/LucasOl1337/VidaNova/pull/52), D018), integrada na main. Prisma, Ábaco, Maracatu e Pluma fechadas; agentes das variantes dispensados |
| F21 | Comparativo da rodada 1 | [PR #51](https://github.com/LucasOl1337/VidaNova/pull/51) integrada. [COMPARATIVO-VARIANTES](operacao/COMPARATIVO-VARIANTES.md) |
| F19 | Variantes rodada 1 | PRs #38 (Pluma), #39 (Maracatu) e as outras em rascunho. Lucas: nenhuma escolhida; scroll longo demais; a escada da Crônica acertou o jeito de explicar ([feedback](fontes/2026-09-22-feedback-f19-r1.md)) |
| F18 | Ensaio do lançamento | [PR #44](https://github.com/LucasOl1337/VidaNova/pull/44) integrada. CSP e console limpos, livro confere, 3G em ~3,7 s. Issues #40 a #43 abertas (ficam pra variante escolhida) |
| F20 | Verificador mais leve | [PR #37](https://github.com/LucasOl1337/VidaNova/pull/37) integrada. zod/mini: menos 16 KB depois do Conferir |
| F17 | Livro ao vivo | [PR #35](https://github.com/LucasOl1337/VidaNova/pull/35) integrada. Na primeira execução o bot registrou D015 e a #35 sozinho (33 fatos). Projeto entra automático; dinheiro, vida real e candidato seguem com o Regente |
| F16 | Polimento pro lançamento | [PR #33](https://github.com/LucasOl1337/VidaNova/pull/33) integrada. Favicon, prévia de compartilhamento gerada no build, 404 com layout |
| F07 livro real | Site ligado no livro oficial | [PR #34](https://github.com/LucasOl1337/VidaNova/pull/34) integrada. `/transparencia` mostra as ações reais e confere com o verificador da F08, carregado só no clique |
| F15 | Conferidor independente em Python | [PR #31](https://github.com/LucasOl1337/VidaNova/pull/31) integrada. Sala limpa: escrito só pelo contrato, confere as 29 ações reais e pega adulteração |
| F08 núcleo | Livro público real e verificador | [PR #30](https://github.com/LucasOl1337/VidaNova/pull/30) integrada. 26 fatos reais conferidos pelo Regente contra git e GitHub; Regente acrescentou #32 e #30 com `ledger:append` (28 fatos). Assinatura e OpenTimestamps prontos, aguardando custódia |
| F07 etapa 1 | Site v1 em código | [PR #32](https://github.com/LucasOl1337/VidaNova/pull/32) integrada. Home e `/transparencia` em Astro, 16 blocos, fontes locais, orçamento medido (home 29 KB, livro 21 KB de 60) |
| F07 etapa 0 | Protótipo do livro público | [PR #28](https://github.com/LucasOl1337/VidaNova/pull/28) integrada. `/transparencia` com as quatro famílias, Conferir por SHA-256 no navegador, contribuições reais, D011 e D012 aplicados |
| F14 | Prontidão pra lançar | [PR #27](https://github.com/LucasOl1337/VidaNova/pull/27) integrada. `_headers`, 404, robots, [LANCAMENTO](operacao/LANCAMENTO.md) e [CHECKLIST](operacao/CHECKLIST-LANCAMENTO.md) |
| F08 contrato | Formato do livro público | [PR #26](https://github.com/LucasOl1337/VidaNova/pull/26) integrada. Quatro famílias com campos fechados; candidato só como contagem agregada; [CONTRATO.md](transparencia/CONTRATO.md) |
| F10 | Governança | [PR #25](https://github.com/LucasOl1337/VidaNova/pull/25) integrada. GOVERNANCA, conduta, segurança, modelo de PR; Regente ajustou o texto pra dizer a verdade sobre a integração na fase de fundação |
| F02 etapa 2 | Base do código | [PR #23](https://github.com/LucasOl1337/VidaNova/pull/23) integrada. Astro + TS + React, ESLint, Vitest, CI verde; conferida pelo Regente num worktree limpo |
| F13 | Contribuições abertas | [PR #24](https://github.com/LucasOl1337/VidaNova/pull/24) integrada. 17 issues (#6 a #22), 17 labels, 3 modelos, `docs/contribuicoes/contribuicoes.json` |
| F01 | Direção visual e protótipo | [PR #5](https://github.com/LucasOl1337/VidaNova/pull/5) integrada. [DIRECAO](design/DIRECAO.md), [MAPA-DO-SITE](design/MAPA-DO-SITE.md), protótipo em `design/prototipo/`; propostas em D011 |
| F02 etapa 1 | Arquitetura | [PR #4](https://github.com/LucasOl1337/VidaNova/pull/4) integrada. [ARQUITETURA.md](arquitetura/ARQUITETURA.md); stack em D006 e D007 |
| F04 | Pesquisa: voz e dispositivo | [PR #3](https://github.com/LucasOl1337/VidaNova/pull/3) integrada (substituiu a #1 após falha do provedor do Devin). Direção em D008 |
| F03 | Pesquisa: dinheiro, jurídico e nome | [PR #2](https://github.com/LucasOl1337/VidaNova/pull/2) integrada. Três relatórios em `docs/pesquisa/` |
