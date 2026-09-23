# Quadro · PontaPé

Estado das frentes. Só o Regente edita, a cada evento. Espelhado na nota "VidaNova Quadro" do canvas Maestri.

Atualizado: 22/09/2026 · Ordem de execução do Lucas (D009): **plataforma e transparência total primeiro**, entrevista e conexões depois.

## Em andamento

| ID | Frente | Dono | Branch | Estado | Próximo passo |
|---|---|---|---|---|---|
| F18 | [Ensaio do lançamento](frentes/F18-ensaio-lancamento/BRIEF.md) | bruto | `bruto/f18-ensaio` | despachada | Checklist inteiro no build local, falhas viram issue |
| F19 | [Cinco variantes visuais](frentes/F19-variantes-visuais/BRIEF.md) | Prisma, Crônica, Ábaco (Opus 5.5), Maracatu (GPT-6-Astra), Pluma (GPT-6-Sol) | `variante/v1..v5` | despachada | Lucas escolhe a direção entre as cinco (portas 4341 a 4345) |

## Fila

| ID | Frente | Depende de |
|---|---|---|
| F10b | `LICENSE` | decisão 7 do Lucas |
| F05 | Captação e seleção: candidato certo, roteiro, voluntários, panfleto | depois da plataforma (D009) |
| F06 | [Do selecionado ao primeiro salário](frentes/F06-pesquisa-oportunidades/BRIEF.md) | em espera (D009) |
| F09 | Piloto da entrevista por voz | F05, depois da plataforma (D009) |

## Pra o Lucas decidir

0. **Custódia da chave de assinatura do livro e primeira ancoragem pública (OpenTimestamps).** Prontos pra rodar ([OPERACAO](transparencia/OPERACAO.md))

Detalhe em [PRD §10](PRD.md#10-perguntas-pro-lucas).

1. **Domínio.** Nome decidido: **PontaPé** (D016). `pontape.com` ocupado; `pontape.org` livre; `pontape.com.br` vencido, em liberação; `.org.br` depois do CNPJ. Falta escolher qual comprar Domínio grátis da Hostinger cobre `.com`. No dia: raiz via troca de nameserver ou só `www` via CNAME ([LANCAMENTO](operacao/LANCAMENTO.md))
2. Trecho perdido do áudio sobre dinheiro e "igreja"
3. Trecho perdido antes da parte do design
4. Doação antes de existir CNPJ. F03 recomenda **só captar depois de associação, CNPJ e conta própria**; Asaas como primeiro teste ([ESTRUTURA-JURIDICA.md](pesquisa/ESTRUTURA-JURIDICA.md), [DOACOES-E-TRANSPARENCIA.md](pesquisa/DOACOES-E-TRANSPARENCIA.md))
5. Cidade do piloto
6. Quem decide a seleção do candidato
7. Licença open source (e canal privado de denúncia e segurança, hoje "a definir"). F03 e F02 recomendam **Apache-2.0**; AGPL-3.0 se a prioridade for obrigar quem copia a abrir o código
8. Quando abrir o repositório
9. Responsável legal pelos dados dos candidatos (LGPD)
10. Apelido por pessoa ("pessoa #014") no livro público, só com consentimento?

## Feito

| ID | Frente | Resultado |
|---|---|---|
| F14b | CSP gerada no build | [PR #29](https://github.com/LucasOl1337/VidaNova/pull/29) integrada. Build calcula o hash de todo script embutido e falha se faltar algum ou se aparecer `unsafe-inline` |
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
