# Diário · F18 · Ensaio do lançamento

## 22/09/2026 · Preparação

- Criei `bruto/f18-ensaio` a partir de `origin/main` no worktree `.worktrees/bruto`, commit inicial `48a9d90`; árvore limpa.
- Li `AGENTS.md`, PRD, QUADRO, BRIEF, CHECKLIST-LANCAMENTO e as regras da bancada. O ensaio será feito no build de produção local, exclusivamente na bancada `vidanova-f18-ensaio` (workspace 6–11), sem deploy, conta, DNS ou edição de `src/`.
- Próximo passo: instalar dependências, gerar build, iniciar preview, validar a bancada e percorrer todos os itens testáveis do checklist. Falhas observadas serão documentadas com evidência e issue.

## 22/09/2026 · Build e bancada prontos

- `.node-version` fixa Node 24.21.0. O `npm ci` inicial herdou Node 26 do shell e avisou incompatibilidade; repeti com `mise exec node@24.21.0 -- npm ci`. Com essa versão, `npm run check` passou: 113 testes, verificação do livro com 29 eventos, build estático, CSP com dois hashes e orçamento de home 29,1 KB/transparência 24,0 KB.
- Preview de produção iniciado em `http://127.0.0.1:4322/`.
- Criei a bancada exclusiva `vidanova-f18-ensaio` no workspace **7**. O perfil persistente foi preparado pelo seed oficial e o Chromium abriu nesse display. `agent-bench status` confirma controle `agente`; `browser-status` confirma `lives_in: vidanova-f18-ensaio` e `user_data_dir` exclusivo da mesma bancada. Nenhuma navegação ocorrerá fora dela.
- Próximo passo: conferir interface e rede no navegador da bancada, guardar prints e preencher todos os itens do checklist.

## 22/09/2026 · Primeira passada e atualização da main

- No build inicial (`48a9d90`), medi home e transparência em 3G lento, testei CSP em servidor local que aplica `dist/_headers`, naveguei por teclado, 320/360 px, alto contraste e movimento reduzido. O livro ainda aparecia como provisório apesar dos 29 eventos no JSON; registrei a observação, sem issue, pois a F07 estava em integração.
- A `main` recebeu F07, F16, F17, F20 e o nome PontaPé (D016). Atualizei `bruto/f18-ensaio` para `a34f659` e refiz build e pontos afetados. `npm run check` passou: 127 testes; o livro agora tem 35 ações e o botão Conferir exibe “Tudo certo”. No exemplo explicitamente fictício, “Mudar uma linha escondido” levou a “A corrente quebrou na ação nº 2”.
- Na versão atual, a home, transparência e 404 não geraram violação de CSP nem exceção de JS com `dist/_headers` aplicado localmente. A resposta 404 gera só a mensagem de rede esperada no console. O servidor Astro de preview não aplica `_headers`; o ensaio dos cabeçalhos foi feito por servidor temporário que lê o arquivo gerado, não equivale à resposta futura do Pages.

## 22/09/2026 · Rede, links e prontidão

- 3G lento simulado (400 ms de latência, 400 kb/s de download, cache desligado): home `load` 3.752 ms/127.248 B e transparência 3.722 ms/125.774 B. Nenhuma requisição falhou. O valor de First Contentful Paint não foi retornado nesta repetição; não o usei como métrica de aceite.
- Quatro downloads `/livro/` responderam 200, JSON válido e sem quebra final; `ledger.json` tem 35 ações, `events.json` e `checkpoint.json` batem com o envelope, e `python tools/conferir.py dist/livro/ledger.json` confirmou 35 ações. `trust.json` segue sem âncora externa, conforme o contrato.
- Sem `SITE_URL`, OG tem imagem relativa; com `SITE_URL=https://pontape.example` apenas para teste local, home, transparência e 404 geraram `og:url`, `og:image`, `twitter:image` e canonical absolutos. A publicação ainda depende de domínio real escolhido e variável configurada no Pages.
- Falhas persistentes: quatro âncoras do menu na 404 apontam para IDs que só existem na home; o exemplo fictício exibe “Ver a fonte” para commit de 40 zeros; A+ em 320 px amplia a largura do documento de 320 para 328 px. Prints da versão atual guardados em `docs/operacao/ensaio/`. Abrirei issues e indicarei no relatório que o visual precisa ser refeito na variante F19 escolhida.
- Corrigi no checklist apenas a descrição do cache: `_astro/` é imutável por um ano, fontes locais têm cache de uma semana. Próximo passo: relatório final, issues, PR e aviso ao Regente.
