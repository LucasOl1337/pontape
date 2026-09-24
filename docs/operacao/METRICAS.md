# Métricas e histórico da Yumi

## O que fica guardado

- `hits`: total por dia, tipo de ação, página e destino fechado. O tipo interno `conversation` soma conversas iniciadas sem guardar o texto para sempre. Não há identificador da pessoa nessa tabela.
- `uniques`: um hash por pessoa e dia. O Worker calcula SHA-256 de IP, navegador, dia e `SESSION_SECRET`, guarda só os primeiros 32 caracteres hexadecimais e descarta IP e navegador brutos. Isso estima pessoas por dia; a mesma pessoa em dois aparelhos conta duas vezes e a mesma pessoa em dias diferentes conta de novo.
- `chats` e `messages`: ID aleatório criado só na aba, modelo, horário, papel e texto das falas. A mensagem barrada pelo filtro de dados pessoais não vai ao modelo nem ao banco. A resposta só é gravada depois que o streaming termina. Não há nome, telefone, CPF nem e-mail em colunas próprias.
- `login_attempts`: hash do IP com segredo, total de tentativas e início da janela de 15 minutos. Nenhum IP bruto fica no D1.

As conversas ficam por **até 180 dias**. O cron diário apaga mensagens e conversas anteriores ao limite, hashes diários antigos e tentativas de login expiradas. `hits` agregados permanecem para a série histórica. O filtro de texto é preventivo, mas não substitui uma revisão humana de privacidade. Se uma pessoa escrever um dado pessoal num formato que o filtro não reconhecer, apague a conversa pelo ID no D1.

## Aplicar e testar

O Regente aplica a migração de produção antes de publicar o Worker:

```sh
scripts/deploy/migrar.sh --remote
```

O script monta a configuração e a pasta de migrações temporariamente; a publicação não aplica migrações. Para rodar a migração sem tocar em produção, use `scripts/deploy/dev-chat.sh`: ele aplica `migrations/` no D1 **local**, com persistência em `.wrangler/f43`, e sobe o Worker em `localhost:8794`. O `.env` local precisa de `NINEROUTER_TOKEN`, `ADMIN_USER`, `ADMIN_PASSWORD` e `SESSION_SECRET`; veja `.env.example`.

O painel fica em `/admin`. O login usa usuário e senha, e a sessão dura 12 horas num cookie `HttpOnly`, `Secure`, `SameSite=Strict`, assinado. Cinco tentativas em 15 minutos por IP; a sexta recebe 429. Todas as consultas privadas exigem a sessão.

## Apagar uma conversa

No painel, abra a conversa e copie seu ID pela API autenticada `/api/admin/chats/:id` se precisar localizar o registro. O ID também aparece na resposta JSON da lista. No D1, o Regente executa:

```sql
DELETE FROM messages WHERE chat_id = 'ID_DA_CONVERSA';
DELETE FROM chats WHERE id = 'ID_DA_CONVERSA';
```

Para apagar **todas** as conversas:

```sql
DELETE FROM messages;
DELETE FROM chats;
```

Para zerar as métricas agregadas e hashes diários, execute `DELETE FROM hits; DELETE FROM uniques;`. Isso não altera o livro público de transparência financeira.

## Trocar credenciais

O Regente troca `ADMIN_USER` ou `ADMIN_PASSWORD` com `wrangler secret put` no Worker e publica a versão nova. Trocar `SESSION_SECRET` também encerra todos os cookies já emitidos e muda os hashes diários dali em diante. Não copie os valores para Git, DIARIO ou chamados. O login não mostra se o usuário existe.

## Custo estimado

Por mil conversas com três trocas cada, são aproximadamente 8 linhas base gravadas por conversa: uma em `chats`, seis em `messages` e uma contagem agregada em `hits`. Os índices também contam como gravações, então a ordem de grandeza é **16 mil linhas escritas** por mil conversas, mais visitas e eventos. Dentro das cotas incluídas, o D1 não acrescenta cobrança variável. Acima da franquia paga de 50 milhões de linhas escritas por mês, 16 mil gravações custariam aproximadamente **US$ 0,016**. A franquia gratuita é 100 mil linhas escritas por dia e 5 milhões de linhas lidas por dia; se excedida, consultas falham até o dia seguinte. [Preços do D1](https://developers.cloudflare.com/d1/platform/pricing/), acesso em 24/09/2026.

O custo de modelo estimado para essas mil conversas continua em US$ 18 a US$ 20, conforme [DIARIO da F41](../frentes/F41-chat-ai/DIARIO.md). O valor real depende de tamanho e modelo usado. A gravação de mensagens no D1 só acontece depois da resposta e não adiciona chamadas ao 9Router.
