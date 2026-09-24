# F43 · DIARIO das métricas e do painel

## 24/09/2026 · implementação

- `git fetch` e branch `tecla/f43-metricas` a partir de `origin/main` no worktree tecla. Li o BRIEF inteiro e mandei ao Regente pelo Maestri o plano em dez linhas antes de codar. Lucas aprovou o pé da escada e exigiu medida em 1602×769 e 390 px; se não couber, o contador vai ao topo do rodapé.
- `npm install` alinhou as dependências e o `npm run check` de base passou: 177 testes, CSP e orçamento.
- A coleta usa D1 local no ensaio. Views são contadas pelo Worker ao servir HTML para navegadores comuns. Eventos do cliente têm tipo, página e destino em listas fechadas. Hash diário de IP e navegador usa `SESSION_SECRET`; nenhum IP ou navegador bruto entra no banco.
- A conversa usa UUID por aba. Mensagens barradas não vão ao gateway nem ao D1. A resposta permitida é arquivada depois do fim do streaming, fora do caminho de resposta. Cron diário apaga o histórico com mais de 180 dias.
- O painel `/admin` pede usuário e senha conforme a última decisão do Lucas. `ADMIN_USER` substitui o `ADMIN_EMAIL` do BRIEF antigo; o Regente já trocou o Secret em produção. Cookie assinado dura 12 horas; limite de 5 tentativas por 15 minutos.
- O HTML do contador tenta embutir a última contagem pública conhecida no build. Antes da primeira publicação da API, mostra “contagem ainda não publicada”, sem inventar zero. O cliente atualiza pela API pública.

## Como testar no D1 local

1. Preencha `.env` local conforme `.env.example`, com `NINEROUTER_TOKEN`, `ADMIN_USER`, `ADMIN_PASSWORD`, `SESSION_SECRET`. Não use secrets reais nos comandos, documentos ou prints.
2. Rode `scripts/deploy/dev-chat.sh`. O script cria a pasta temporária do Worker, aplica `scripts/deploy/migrations/*.sql` no D1 **local** persistido em `.wrangler/f43` e abre `http://localhost:8794`.
3. Abra `/` duas vezes. `GET /api/stats/public` deve ter `visits` acima de zero e só seis números. A linha na home e em `/transparencia` deve refletir o valor após até 60 segundos. Com JS desligado, deve aparecer o valor conhecido no build ou, antes da primeira publicação, aviso explícito de contagem indisponível.
4. Abra `/admin`, entre com o usuário e a senha locais e confira visitas por dia, eventos, páginas e a lista de conversas. Saia; `/api/admin/stats` deve responder 401. Tente cookie adulterado e senha errada. A sexta tentativa na mesma janela retorna 429.
5. Na Yumi, mande uma dúvida sem dados pessoais. Ao terminar, ela aparece no painel com pergunta e resposta. Mande uma pergunta com CPF ou e-mail; ela não pode aparecer no banco nem ir ao 9Router.
6. Rode `npm run check`. Para ensaiar o cron local, use `curl -X GET http://localhost:8794/cdn-cgi/local/scheduled` e confira o D1 local. **Não** aplique migração remota nem publique pelo worktree tecla.

## Custo estimado

Mil conversas de três trocas geram aproximadamente 16 mil gravações D1 incluindo índices e o contador agregado: custo variável zero dentro da franquia, ou cerca de **US$ 0,016** além dela. A AI segue na estimativa de **US$ 18–20 por mil conversas** da F41. Visitas, eventos e leitura do painel somam uso menor, dependente do tráfego. [Preços oficiais do D1](https://developers.cloudflare.com/d1/platform/pricing/), acesso em 24/09/2026. Detalhes e procedimento de retenção em [METRICAS.md](../../operacao/METRICAS.md).

## Ensaios concluídos

- `wrangler dev` aplicou `0001_metrics.sql` no D1 local. Servir `/` e `/transparencia/` contou duas visitas e uma pessoa no mesmo dia; `/api/stats/public` devolveu só os seis números previstos. Revalidação de HTML com 304 também conta visita. Evento desconhecido deu 400; `step` válido deu 204. Login errado deu 401, cookie forjado deu 401, e seis tentativas erradas no mesmo IP deram `401,401,401,401,401,429`.
- Login real no Chromium da bancada isolada `pontape-f43-ui` abriu o painel com tabela, gráfico e lista de conversas. O cookie veio com `HttpOnly; Secure; SameSite=Strict; Max-Age=43200`. Pergunta real à Yumi terminou em SSE e apareceu no painel com as duas falas. Pergunta com CPF ficou fora: `x-yumi-private: 1` e total de conversas inalterado.
- O 9Router real encerra o SSE com `finish_reason: stop`, sem `[DONE]`; ajustei a gravação depois de ver que a primeira tentativa local não apareceu no histórico. O teste automatizado cobre esse formato.
- Medida via CDP da bancada, sem tocar na sessão do Lucas: em **1602×769**, cabeçalho terminou em y=65, escada e linha azul em y=729, contador de y=740,75 a 757, e a próxima seção começa em y=769. O contador ocupa o `--air` já reservado e não reduz a altura de 664 px da escada. Ajustei o 1 px da borda do cabeçalho na conta da frente. Em **390×844**, a escada termina em y=665,86; contador de y=667,45 a 699,95; a próxima seção começa em y=715,95. Nos dois, o contador fica na primeira tela sem cortar a escada. Em uma simulação adicional de 1349×647, a altura mínima de 664 px da escada F36 já excede a área disponível mesmo sem o contador; ela não foi reduzida pra mascarar esse limite anterior.
- `sqlite3` no banco local confirmou hashes com 32 caracteres e zero mensagens contendo o CPF usado no ensaio.
- `npm run check` final passou: lint, tipos, **186 testes**, livro íntegro, CSP e build. Home 29,1 KB incluindo o chat sob demanda; transparência 51,7 KB, ambos abaixo de 60 KB. `/admin` está fora do sitemap e do orçamento público. O Worker local e a bancada serão encerrados após a PR.

## Entrega

- Migração de produção e Secrets ficam a cargo do Regente. O worktree tecla não aplicou migração remota nem publicou o Worker.
- PR para `main`: a preencher após abrir.
