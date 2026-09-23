# Ensaio do lançamento · F18

**Data:** 22/09/2026 (America/Sao_Paulo)  
**Commit ensaiado:** `a34f659` (`main` atualizada durante o ensaio)  
**Superfície:** build estático de produção, servido localmente na bancada exclusiva `vidanova-f18-ensaio` (workspace 7). Sem deploy, conta ou DNS.  
**Estado:** ensaio local concluído; publicação depende das decisões de Lucas, do teste em Pages e da variante visual F19 escolhida.

## Resultado do checklist

| Item | Resultado | Evidência e limite |
| --- | --- | --- |
| 1. Nome, domínio, publicação, DNS e abertura do repositório | **Não deu para testar** | PontaPé entrou na `main` (D016); domínio, autorização de publicar, rota DNS e abertura do repositório ainda exigem decisão. Nenhuma conta ou DNS foi tocado. |
| 2. `npm run check` e arquivos do build | **Passou** | Node 24.21.0; lint, typecheck, 127 testes, verificação do livro, build e orçamento passaram. `dist/404.html`, `dist/_headers` e `dist/robots.txt` existem. CSP gerada e verificada com 2 hashes de scripts embutidos. |
| 3. “Em construção” e promessas | **Passou** | Home, transparência e 404 exibem aviso de que ainda não há doações nem atendimento. Cards de participação continuam marcados “Ainda não abriu” ou “Em construção”; links de contribuições apontam para issues, com “Repositório ainda fechado”. |
| 4. Painel, zero e exemplo | **Não deu para testar integralmente** | O livro real já tem 35 ações; o painel mostra 35 e valores financeiros R$ 0,00. O modo exemplo exibe “EXEMPLO · dados fictícios” e “Nada disso aconteceu”. Não há estado real vazio neste commit para provar o ramo de zero ações no navegador. |
| 5. Dados pessoais e segredos no build | **Passou na inspeção local** | Inspecionei HTML/JSON/scripts/CSS/SVG/texto (20 arquivos) por e-mail, CPF, chaves privadas e prefixos de tokens; nenhum achado. Livro contém ações do projeto e contagens, sem identidades de candidatos. A inspeção textual não substitui revisão humana de todos os assets no dia da publicação. |
| 6. Links, 404, home e URL final | **Falhou em cinco links** | 404 responde HTTP 404 e “Voltar ao início” abre a home. Links internos da home/transparência têm destino e âncora. Na 404, quatro itens do menu resolvem para âncoras inexistentes na própria 404; no exemplo fictício, “Ver a fonte” aponta para commit de 40 zeros. Issues registradas abaixo. URLs externas do GitHub ainda levam ao repositório privado e são acompanhadas do aviso “Repositório ainda fechado”. Domínio final segue pendente. |
| 7. 360 px, desktop, teclado, Ouvir, A+ e diálogos | **Falhou em A+ a 320 px; revisão final pendente** | Em 360 e 320 px, home, transparência e 404 sem A+ não rolam lateralmente. Tab expõe foco e “Pular pro conteúdo”; Enter ativa, Esc fecha diálogo, setas trocam abas. A+ responde, mas em 320 px amplia o documento para 328 px. Com zoom 200% numa janela de 320 px físicos, o viewport CSS cai a 160 px e há transbordamento; esse caso extremo precisa ser refeito na F19. `prefers-reduced-motion` retirou transições longas; `forced-colors` manteve texto legível na passada inicial. A bancada não possui voz de síntese (`speechSynthesis.getVoices() = []`): o botão Ouvir apresentou a mensagem de indisponibilidade, mas a saída de áudio real não pôde ser avaliada. Prints abaixo. |
| 8. Rede de entrada, aceite e console | **Passou localmente; aceite pendente** | 3G lento simulado: 400 ms de latência, 400 kb/s de download, cache desligado, viewport 360 px. Home: DOMContentLoaded 2.973 ms, `load` 3.752 ms, 127.248 bytes transferidos. Transparência: 2.943 ms, 3.722 ms, 125.774 bytes. Sem requisições falhas. O navegador não retornou FCP válido nesta repetição. Com `_headers` aplicado localmente, zero violações de CSP, exceções JS ou conteúdo misto na home e transparência; na 404 houve apenas a mensagem de rede esperada pelo HTTP 404. Aceite do Regente ainda necessário. |
| 9. HTTPS, redirect, cabeçalhos e cache na resposta real | **Não deu para testar em produção** | O servidor `astro preview` não aplica `_headers`; usei servidor local temporário que aplica exatamente `dist/_headers`. Home, transparência, 404, assets e JSON receberam CSP, `nosniff`, política de referência, permissões e `X-Frame-Options`. `/_astro/*` respondeu com cache imutável de 1 ano; `/fonts/*` com 1 semana; HTML e `/livro/` sem cache longo. HTTPS, redirect HTTP→HTTPS e cabeçalhos efetivos do Pages exigem deploy autorizado. O checklist foi alinhado à regra real de cache das fontes. |
| 10. Plano de volta atrás | **Passou no documento; não deu para executar** | `LANCAMENTO.md` descreve pausa de merges, rollback para deploy anterior e correção rápida no primeiro deploy. Não existe implantação anterior a restaurar neste ensaio. |

## Provas adicionais priorizadas

- **Livro real:** `/livro/ledger.json`, `events.json`, `checkpoint.json` e `trust.json` responderam 200 com `application/json`, JSON válido e sem quebra final. `events` e `checkpoint` correspondem ao envelope. O conferidor independente em Python retornou “Tudo certo: 35 ações, nada apagado nem mudado”, saldo R$ 0,00. No navegador, “Conferir” mostrou “Tudo certo.”
- **Exemplo:** após “Ver um exemplo” e “Mudar uma linha escondido”, “Conferir” mostrou “A corrente quebrou na ação nº 2.” ([captura do resultado](ensaio/conferir-exemplo-acao-2.png)). A mensagem abaixo tem concordância incorreta quando há uma ação anterior ([issue #43](https://github.com/LucasOl1337/VidaNova/issues/43)).
- **Robôs:** `robots.txt` tem `User-agent: *` e `Allow: /`.
- **Prévia de links:** sem `SITE_URL`, OG e Twitter têm imagens relativas, portanto não servem para o lançamento. Com `SITE_URL=https://pontape.example` apenas no build local de prova, home, transparência e 404 geraram `og:url`, imagens OG/Twitter e canonical absolutos. Configurar a URL real no Pages antes de publicar, conforme `LANCAMENTO.md`.
- **Console/CSP:** build atual gerou 2 hashes; a CSP aplicada localmente permitiu scripts e interações na home, transparência e 404 sem `securitypolicyviolation`. O teste de cabeçalho real continua no checklist do dia de publicação.

## Capturas e falhas

- [Home 360 px](ensaio/home-360-atual.png), [home 320 px](ensaio/home-320-atual.png), [transparência 360 px](ensaio/transparencia-360-atual.png), [transparência 320 px](ensaio/transparencia-320-atual.png), [404 em 320 px](ensaio/404-320-atual.png).
- [A+ em 320 px](ensaio/home-320-texto-maior-atual.png) e [zoom 200% na janela de 320 px](ensaio/home-320-zoom-200.png).
- [404 com quatro âncoras erradas: issue #40](https://github.com/LucasOl1337/VidaNova/issues/40) (`codigo`, `M1`).
- [“Ver a fonte” do exemplo com commit de zeros: issue #41](https://github.com/LucasOl1337/VidaNova/issues/41) (`codigo`, `M1`); [captura com o link](ensaio/conferir-exemplo-adulterado.png).
- [A+ com 8 px de rolagem horizontal em 320 px: issue #42](https://github.com/LucasOl1337/VidaNova/issues/42) (`design`, `M1`); relacionada à revisão de teclado e texto ampliado #8.
- [Concordância “As 1 ações” no resultado do exemplo: issue #43](https://github.com/LucasOl1337/VidaNova/issues/43) (`codigo`).

O visual atual pode ser substituído integralmente pela F19 (D015). Repetir na variante escolhida teclado, 360/320 px, zoom, A+, Ouvir, `prefers-reduced-motion` e `forced-colors`. Repetir também CSP, links e rede no build final, pois scripts e assets podem mudar.
