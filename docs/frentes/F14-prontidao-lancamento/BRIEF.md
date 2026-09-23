# F14 · Prontidão pra lançar

Dono: `bruto` (ExecutorBruto) · Worktree: `.worktrees/bruto` · Branch: `bruto/f14-lancamento` a partir da `main` atualizada

## Por que agora

O site vai pro ar assim que o Lucas escolher o nome e o domínio ([PRD §8, F1](../../PRD.md#8-fases)). Tudo que não depende do nome pode ficar pronto antes, pra que o lançamento seja só apontar o domínio e publicar. Hospedagem decidida: Cloudflare Pages, estático (D006). Domínio: grátis pela Hostinger (`.com`), com DNS apontando pro Cloudflare.

## Entregáveis

1. **`public/_headers`** no formato do Cloudflare Pages: cabeçalhos de segurança pra site estático (CSP restrita que funcione com Astro e ilhas React sem `unsafe-inline` em script se der, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` liberando só o microfone quando a entrevista existir, hoje nada), e cache longo pros arquivos com hash. Explique cada linha em comentário curto.
2. **`public/robots.txt`** e **`src/pages/404.astro`** simples, usando o `BaseLayout`, em PT-BR, com link de volta pra home.
3. **`docs/operacao/LANCAMENTO.md`**: passo a passo que o Regente e o Lucas seguem no dia. Criar o projeto no Cloudflare Pages ligado ao repositório (quem cria a conta é o Lucas), configuração de build, domínio da Hostinger apontando pro Cloudflare (registros exatos ou troca de nameserver, com prós e contras), HTTPS, como conferir que subiu, como voltar atrás. Com link e data de acesso nas fontes.
4. **`docs/operacao/CHECKLIST-LANCAMENTO.md`**: lista curta de conferência antes de abrir ao público (faixa "Em construção" visível, painel no zero honesto, nenhum dado pessoal, links quebrados, prints 360px, tempo de carga).

Diário em `docs/frentes/F14-prontidao-lancamento/DIARIO.md`.

## Limites

- Sem criar conta, sem deploy, sem mexer em DNS. Tudo é preparação.
- Não mexa em `src/components/`, `src/styles/` nem em `src/pages/index.astro`: são do Design/UI (F07). Não mexa em `src/lib/ledger/` nem `.github/workflows/`: são do EngenheiroFino.
- Nome do site: use o provisório num ponto só, fácil de trocar.

## Pronto quando

- `npm run check` passa com os arquivos novos, e o build gera `404.html`, `_headers` e `robots.txt` em `dist/`.
- A CSP não quebra a página atual nem o protótipo que a F07 vai portar (explique o que você conferiu).
- PR aberta pra `main` e report ao Regente.
