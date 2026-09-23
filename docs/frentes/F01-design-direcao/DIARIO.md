# F01 · Diário

Dono: `design` · Branch: `design/f01-direcao`

Se o contexto compactar: releia o `BRIEF.md`, depois este diário de cima pra baixo. O último marco diz onde parei.

## Marco 1 · 22/09/2026 · leitura e plano

Li `AGENTS.md`, `BRIEF.md`, `PRD.md`, `QUADRO.md`, `DECISOES.md` e a spec 01 do Lucas.

O que achei:

- O site tem dois públicos que leem muito diferente. Doador, voluntário, empregador e contribuidor leem normal. O candidato pode ler pouco ou nada, e mesmo assim o panfleto manda ele pro site (spec item 18: "venha até aqui ou entre nesse site"). Então o site precisa de uma porta pro candidato que funcione ouvindo.
- Hoje nada funciona. O risco "promessa sem entrega" (PRD §11) pede que o site diga isso sem rodeio, com data.
- O selo de estado do BRIEF tem três valores (funcionando, em construção, gargalo aberto). Pra M5, M6 e M7 nenhum dos três é verdade: ninguém começou. Chamar de "em construção" seria mentir um pouco.

Plano:

1. `docs/design/DIRECAO.md`: conceito, tokens, tipo, grid, movimento, acessibilidade, imagem.
2. `docs/design/MAPA-DO-SITE.md`: blocos em ordem, com objetivo, conteúdo, interação e chamada.
3. `design/prototipo/index.html`: um arquivo, sem build, mobile-first.
4. Ver na bancada `vidanova-design`, tirar print 360px e desktop.
5. Commit, push, PR, report ao Regente.

## Decisões propostas

Ficam aqui até o Regente aprovar e levar pro `DECISOES.md`.

| # | Proposta | Por quê |
|---|---|---|
| P1 | Quarto estado de módulo: **planejado** (cinza, contorno) | M5, M6 e M7 ainda não começaram. "Em construção" seria meia verdade |
| P2 | Bloco novo logo depois do hero: **"Quer mudar de vida?"**, falado, pro candidato | O panfleto manda o candidato pro site. Ele precisa de uma porta que funcione sem ler |
| P3 | Botão **Ouvir** em cada bloco (voz do navegador, pt-BR) | Princípio "voz primeiro" aplicado ao próprio site, custo zero |
| P4 | Estado de cada módulo vem com **data** ("estado em 22/09/2026") | Transparência: o leitor sabe quão velho é o selo |
| P5 | Testar o rótulo público **"Precisa de ajuda"** no lugar de "Gargalo aberto" | "Gargalo" é palavra de gestão. Pra quem lê pouco, "precisa de ajuda" diz o que é e já convida. Mantive "Gargalo aberto" no protótipo porque é o que o BRIEF pede |
| P6 | **Faixa de estado** no topo do site: "Em construção. O projeto ainda não recebe doação nem atende ninguém." Sai quando doação e atendimento estiverem funcionando | Risco "promessa sem entrega" (PRD §11) |
| P7 | Painel de transparência com dois modos: **Agora** (padrão, zero honesto) e **Ver um exemplo** (fictício, com faixa de exemplo e demonstração ao vivo com pausa) | Cumpre o zero honesto e ainda deixa doador e Lucas verem como o painel vai ficar |
| P8 | Âncoras das seções em português (`#transparencia`, `#gargalos`) | Aparecem no endereço que as pessoas compartilham. Classes, tokens e JS ficam em inglês (D003) |

## Marco 2 · 22/09/2026 · direção, mapa e protótipo prontos

Feito:

- `docs/design/DIRECAO.md`: conceito "degrau por degrau, tudo à vista", dois registros (cartaz e caderno), tokens de cor com contraste medido, tipo (Archivo, Atkinson Hyperlegible Next e Mono), grid, forma, movimento, Ouvir, acessibilidade, imagem e dignidade, texto de interface, marca provisória, orçamento de desempenho.
- `docs/design/MAPA-DO-SITE.md`: 8 blocos numerados + faixa, topo, hero e rodapé, cada um com objetivo, conteúdo, interação e chamada. Selo de estado com os 4 valores e o estado de hoje de M1 a M9. Estado vazio do painel.
- `design/prototipo/index.html`: um arquivo, 1 fonte externa, ~28 KB comprimido. Mobile-first. Tudo que o mapa descreve funciona. Nome num ponto só (`PROJECT_NAME`).
- `design/prototipo/prints/`: capturas em 360px e 1440px, detalhe de módulo, painel em modo exemplo e comprovante.

Como verifiquei: bancada `vidanova-design` (workspace 7), Chromium próprio da bancada, captura por CDP em 360×780 (DPR 2, modo celular) e 1440×900. Corrigi o que apareceu: caixas `hidden` aparecendo, botões estourando no painel dos passos em 360px, degrau "Comida" cortado na mini escada, sombra do comprovante, conflito de classe entre cartão de ajuda e linha do diálogo. JS passa `node --check`; um script conferiu que toda classe, ícone e variável usada existe.

Achados:

- `agent-bench-views.service` estava parado desde 19:45 e travava a bancada ("Acompanhamento indisponível"). Religuei só esse serviço, que é o passo 3 do diagnóstico do `USAGE.md`. Ficou rodando.
- A voz do navegador depende do aparelho. O Chromium da bancada tem zero vozes instaladas; testei e o botão volta ao normal e avisa "Não deu pra ler em voz alta neste aparelho." em vez de ficar mudo. Não consegui ouvir a leitura de verdade aqui: falta testar num celular Android ou iPhone.
- Reescrevi classes, tokens e JS em inglês depois de reler a regra D003. Texto de tela continua todo em PT-BR.

Dúvidas pro Regente (dependem do Lucas ou de serviço externo):

1. "Quero ser avisado" (voluntário e vaga) precisa de lista de aviso: e-mail, WhatsApp ou formulário. Qual serviço, e pode criar?
2. "Dar uma ideia" nos gargalos: proposta é discussão no GitHub quando o repositório abrir. Até lá, pra onde aponta?
3. P1 (estado "planejado") e P5 (rótulo "precisa de ajuda") mexem no vocabulário do PRD.

## Marco 3 · 22/09/2026 · entregue

- PR: https://github.com/LucasOl1337/VidaNova/pull/5 (branch `design/f01-direcao`, 3 commits: direção e mapa, protótipo com prints, diário).
- Report enviado ao Regente pelo Maestri, com as 3 dúvidas acima.
- Bancada `vidanova-design` encerrada; servidor local do protótipo parado.

Onde parei: esperando revisão do Regente e resposta das dúvidas. Próximo passo, se voltar: aplicar o que o Regente decidir sobre P1 a P8 e as dúvidas, e testar o Ouvir num celular de verdade.
