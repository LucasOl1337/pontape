# Lançamento do site estático

Este roteiro é **para o dia autorizado por Lucas**. Hoje não há conta, deploy ou DNS a alterar. Preencha `DOMINIO_ESCOLHIDO` e `PROJETO_PAGES` só depois da decisão de nome. O repositório pode continuar privado: Cloudflare Pages aceita repositórios privados via integração GitHub. A primeira publicação em Pages já cria um endereço acessível; não pressione **Save and Deploy** antes da autorização. [Cloudflare, integração Git, acesso em 22/09/2026](https://developers.cloudflare.com/pages/get-started/git-integration/).

## Antes de conectar

1. Lucas confirma nome, domínio, publicação e quem terá acesso às contas. Regente confere [checklist](CHECKLIST-LANCAMENTO.md) e o commit aprovado na `main`. O nome provisório ainda está no site da F07: conferir a troca na versão final, sem espalhar outro nome por estes arquivos.
2. No commit escolhido, rode `npm ci && npm run check`. Confira `dist/404.html`, `dist/_headers` e `dist/robots.txt`. O projeto fixa Node `24.21.0` em `.node-version`; a imagem v3 do Pages usa Node 22 por padrão, mas lê `.node-version`. Confirme Node 24.21.0 no log do build. [Cloudflare, build image, acesso em 22/09/2026](https://developers.cloudflare.com/pages/configuration/build-image/).
3. O `npm run build` roda Astro, calcula SHA-256 de **todos os scripts embutidos em `dist/**/*.html`**, acrescenta os hashes à CSP de `dist/_headers` e verifica a cobertura. O build falha se faltar hash ou se `script-src` tiver `unsafe-inline`. `public/_headers` é só o modelo, sem hash manual: confira **`dist/_headers`**, que é o arquivo publicado. O protótipo não entra em `dist` antes de a F07 portá-lo; depois da portagem, o build cobre os scripts gerados. CSS embutido e Google Fonts seguem permitidos. Teste também no navegador, pois a verificação automática não detecta toda falha de carregamento ou interação. `microphone=()` fica assim até uma frente de entrevista autorizada. [Cloudflare, formato de `_headers`, acesso em 22/09/2026](https://developers.cloudflare.com/pages/configuration/headers/).

## Criar o Pages (Lucas ou operador autorizado)

1. Na conta Cloudflare do Lucas, abra **Workers & Pages → Create application → Pages → Import an existing Git repository**. Autorize somente `LucasOl1337/VidaNova` na integração GitHub. Escolha a branch de produção `main`, diretório raiz do repositório, comando `npm run build` e saída `dist`. O preset Astro pode preencher esses dois últimos campos; confira os valores. [Cloudflare, Astro no Pages, acesso em 22/09/2026](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/).
2. Antes de publicar, confira o nome do projeto Pages, pois ele define `PROJETO_PAGES.pages.dev`. Previews de branches podem ter URL pública por padrão; se houver trabalho ainda não liberado, restrinja previews com Cloudflare Access ou desative builds de preview. Isso não protege automaticamente a URL de produção `pages.dev`. [Cloudflare, previews, acesso em 22/09/2026](https://developers.cloudflare.com/pages/configuration/preview-deployments/).
3. Com a publicação autorizada, execute **Save and Deploy**. Guarde URL, commit e resultado do build. O Pages reconstrói a produção em pushes futuros na `main`; combine a cadência de merges com o Regente. [Cloudflare, integração Git, acesso em 22/09/2026](https://developers.cloudflare.com/pages/get-started/git-integration/).

## Apontar o domínio da Hostinger

**Escolha uma rota antes de mexer no DNS.** Nos dois casos, primeiro associe o domínio em **Pages → projeto → Custom domains → Set up a domain**. Um CNAME criado sem essa associação pode falhar. O domínio raiz exige zona Cloudflare e troca dos nameservers; um subdomínio como `www` pode ficar na zona DNS da Hostinger. [Cloudflare, custom domains, acesso em 22/09/2026](https://developers.cloudflare.com/pages/configuration/custom-domains/).

| Rota | Valores a usar | Vantagem | Atenção |
|---|---|---|---|
| Raiz `DOMINIO_ESCOLHIDO` | Adicione o domínio como zona Cloudflare. Em **Hostinger → Domains → Manage → DNS / Nameservers**, troque os NS pelos **valores exatos exibidos pela Cloudflare**; o Pages cria o CNAME da raiz após ativação. | A raiz funciona no Pages. | A gestão de toda a zona DNS muda para a Cloudflare. Copie antes os registros existentes, sobretudo MX/TXT/CAA e serviços em uso, e confira-os após a troca. Não invente NS nem A/AAAA. |
| Só `www.DOMINIO_ESCOLHIDO` | Mantenha os NS na Hostinger. Após associar `www` no Pages, crie na Hostinger `CNAME` com **host `www`** e **destino `PROJETO_PAGES.pages.dev`**, sem `https://` ou caminho. | Mudança restrita ao subdomínio; a zona e outros serviços continuam na Hostinger. | A raiz não passa a funcionar automaticamente. Decida depois redirecionamento/cobertura da raiz, se desejados. |

A rota de NS e o local de edição dos registros são descritos pela [Hostinger, DNS externo e DNS da zona, acesso em 22/09/2026](https://support.hostinger.com/en/articles/4737652-how-to-point-a-domain-to-external-services) e pela [Cloudflare, custom domains, acesso em 22/09/2026](https://developers.cloudflare.com/pages/configuration/custom-domains/). Se houver e-mail no domínio, preserve os registros correspondentes antes da mudança de NS; [Hostinger, MX, acesso em 22/09/2026](https://support.hostinger.com/en/articles/4443666-how-to-manage-mx-records).

## Aceite e volta atrás

Espere o domínio ficar **Active** no Pages e abra `https://DOMINIO_ESCOLHIDO` (ou `https://www.DOMINIO_ESCOLHIDO`). Confira certificado válido, ausência de conteúdo misto, `http://` redirecionando para HTTPS e as rotas do checklist. Na zona Cloudflare, **Always Use HTTPS** é uma opção para forçar esse redirecionamento; ative e teste se a rota escolhida precisar disso. [Cloudflare, HTTPS, acesso em 22/09/2026](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/). O Pages serve `404.html` para endereço inexistente; confira também o código HTTP 404. [Cloudflare, serving Pages, acesso em 22/09/2026](https://developers.cloudflare.com/pages/configuration/serving-pages/).

Exemplos de conferência depois de substituir a variável pelo endereço real:

```sh
SITE_URL=https://DOMINIO_ESCOLHIDO
curl -I "$SITE_URL/"
curl -I "$SITE_URL/rota-inexistente"
curl -I "$SITE_URL/robots.txt"
```

A resposta da home deve trazer CSP, `nosniff`, política de referência e permissões. Um arquivo de `/_astro/` com hash deve trazer `Cache-Control: public, max-age=31536000, immutable`; HTML não recebe esse cache longo. No navegador, teste home, 404, Ouvir, diálogos e ilhas React em 360 px, sem erro de CSP no console. A Cloudflare aplica `_headers` a arquivos estáticos, mas **não** a respostas de Pages Functions; se o projeto migrar para SSR, reavalie os cabeçalhos. [Cloudflare, headers, acesso em 22/09/2026](https://developers.cloudflare.com/pages/configuration/headers/).

Se a versão publicada falhar, pause novos merges e use **Pages → Deployments → All deployments → ⋯ → Rollback to this deployment** para voltar a um build de produção anterior que tenha funcionado. Preview não serve de alvo; no primeiro deploy não há versão anterior. Depois corrija na `main` e faça novo build. [Cloudflare, rollbacks, acesso em 22/09/2026](https://developers.cloudflare.com/pages/configuration/rollbacks/). Se o problema for DNS, compare com o inventário salvo e corrija a zona; trocar o domínio para fora e de volta pode deixá-lo inativo temporariamente. [Cloudflare, custom domains, acesso em 22/09/2026](https://developers.cloudflare.com/pages/configuration/custom-domains/).
