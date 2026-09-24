# Voltar atrás no pontape.org

Roteiro pra quando uma versão publicada quebra o site. Vale pra publicação de hoje: **Cloudflare Workers com assets estáticos** (Worker `pontape`, D019), publicado por [`scripts/deploy/publicar.sh`](../../scripts/deploy/publicar.sh) e pelo timer `pontape-publicar.timer` (D021), que roda [`scripts/deploy/vigia.sh`](../../scripts/deploy/vigia.sh) a cada 3 minutos e publica sempre que a `main` muda. A parte de Pages do [`LANCAMENTO.md`](LANCAMENTO.md) é histórico e não serve aqui.

Quem executa: o Regente, com OK do Lucas (publicar é reservado, AGENTS.md). Precisa do login do wrangler desta máquina, o mesmo que o timer usa. Não rode este roteiro só pra testar: cada passo mexe no site no ar.

## A ideia em três linhas

1. **Parar o timer**, senão ele publica a `main` de novo por cima.
2. **Voltar o Worker** pra última versão boa com `wrangler rollback`. É na hora e não depende de build.
3. **Consertar a `main`** (revert do commit ruim), e só então **religar o timer**. Ele publica a `main` consertada, e o site volta ao caminho normal.

## Passo a passo

### 1. Parar o timer

```sh
systemctl --user stop pontape-publicar.timer
systemctl --user status pontape-publicar.timer --no-pager   # deve dizer "inactive (dead)"
```

Se uma publicação estiver no meio, espere acabar: o `vigia.sh` segura uma trava (`~/.local/state/pontape/vigia.lock`), e o `pontape-publicar.service` sai sozinho. `systemctl --user status pontape-publicar.service --no-pager` mostra se ainda roda.

### 2. Achar a última versão boa

Cada publicação vira uma versão do Worker. Desde a F38, o `publicar.sh` põe o commit na versão (`--tag` com os 7 primeiros caracteres e `--message "commit <sha>"`). Rode numa pasta vazia (o wrangler, na raiz do repositório, tenta reescrever o projeto Astro):

```sh
cd "$(mktemp -d)"
npx -y wrangler@4 versions list --name pontape      # id, data, tag e mensagem de cada versão
npx -y wrangler@4 deployments list --name pontape   # qual versão estava no ar e quando
```

O histórico do timer liga hora e commit, e ajuda a achar versões antigas, de antes da tag:

```sh
tail -n 20 ~/.local/state/pontape/historico.log     # "<data> publicado <commit>"
```

Escolha a versão do último commit que funcionava. Dá pra voltar só até as 100 versões mais recentes. [Cloudflare, rollbacks, acesso em 24/09/2026](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks/).

### 3. Voltar o Worker

```sh
npx -y wrangler@4 rollback <id-da-versão> --name pontape -m "volta pro commit <sha>: <o que quebrou>"
```

O comando pede confirmação (`-y` pula). O rollback muda só o código e os arquivos da versão. O pontape.org não tem KV, D1, R2 nem Durable Object, então o aviso da Cloudflare sobre recursos ligados não pesa aqui. [Cloudflare, rollbacks, acesso em 24/09/2026](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks/).

### 4. Conferir que voltou mesmo

O nome do CSS tem hash, então ele diz qual build está no ar. Compare o do site com o de um build do commit bom:

```sh
curl -s https://pontape.org/ | grep -o '/_astro/BaseLayout[^"]*\.css'
git worktree add -q --detach /tmp/pontape-bom <sha-bom>
cd /tmp/pontape-bom && npm ci --no-audit --no-fund >/dev/null && SITE_URL=https://pontape.org npm run build >/dev/null
grep -o '/_astro/BaseLayout[^"]*\.css' dist/index.html     # tem que ser o mesmo nome
cd - && git worktree remove /tmp/pontape-bom
```

A Cloudflare publica o código e os arquivos numa operação só, mas a documentação não diz com todas as letras que o rollback traz os arquivos daquela versão. Por isso esta conferência não é opcional. Se o nome não bater, siga direto pro passo 5 e deixe o timer publicar a `main` consertada.

Depois, a conferência funcional, a mesma do lançamento:

```sh
curl -sI https://pontape.org/ | grep -iE '^(HTTP|content-security-policy|x-content-type-options)'
curl -sI https://pontape.org/nao-existe | head -n 1        # 404
curl -s  https://pontape.org/robots.txt                     # com a linha Sitemap
curl -sI https://pontape.org/sitemap.xml | head -n 1        # 200
```

E no navegador: home (subir e descer a escada, "Mais detalhes"), `/transparencia` (Conferir), a parte técnica e um endereço inexistente, sem erro de CSP no console, no computador e no celular.

### 5. Consertar a `main`

O timer lembra o último commit publicado (`~/.local/state/pontape/publicado`) e só publica quando a `main` muda. Religar sem consertar a `main` não traz a versão ruim de volta na hora, mas **o próximo merge publica tudo, inclusive o commit ruim**. Então o conserto vem antes:

```sh
git revert <sha-ruim>          # num worktree próprio, nunca no checkout do Regente
```

O revert vai pra `main` por PR, como qualquer mudança. `npm run check` tem que passar.

### 6. Religar o timer

```sh
systemctl --user start pontape-publicar.timer
systemctl --user list-timers pontape-publicar.timer --no-pager
tail -n 3 ~/.local/state/pontape/historico.log   # em até 3 minutos: "publicado <sha-do-revert>"
```

Repita a conferência do passo 4 com o commit do revert.

## Se o wrangler rollback não der

Por exemplo: versão antiga demais, ou o login do wrangler fora do ar. Aí o caminho é só o da `main`: com o timer parado, faça o revert (passo 5) e publique na mão, a partir de um checkout limpo em `origin/main`:

```sh
scripts/deploy/publicar.sh          # dry-run: build, checagens e o que seria enviado
scripts/deploy/publicar.sh --apply  # publica
```

O `publicar.sh` só publica a `main` enviada (`HEAD` igual a `origin/main`) e roda `npm run check` antes. Por isso não dá pra publicar um commit velho direto por ele, e é de propósito. Depois, religue o timer (passo 6).

## Se o problema for o endereço, não o site

O domínio está no próprio Worker (`routes` com `custom_domain` em [`wrangler.template.jsonc`](../../scripts/deploy/wrangler.template.jsonc)), e o redirecionamento de http e www está no [`worker.js`](../../scripts/deploy/worker.js). Um rollback do Worker volta esses dois junto. DNS e certificado ficam na conta Cloudflare do Lucas: aí é com ele.
