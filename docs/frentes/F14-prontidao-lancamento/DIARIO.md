# Diário · F14 · Prontidão pra lançar

## 22/09/2026 · Início

- Criei `bruto/f14-lancamento` a partir de `origin/main` atualizado, no worktree `bruto`; árvore limpa.
- Li `AGENTS.md`, PRD/QUADRO, briefing F14, código Astro atual, `BaseLayout`, protótipo F01 e `.node-version` (`24.21.0`). Não alterarei as áreas do Design/UI nem do EngenheiroFino.
- Consultei documentação oficial de Cloudflare Pages (cabeçalhos, Astro, domínio, 404, rollback, build image, previews) e Hostinger (DNS/NS) em 22/09/2026. Links ficarão no roteiro operacional.
- Nenhuma conta, deploy ou alteração de DNS nesta frente. Nome do site ainda provisório; o novo 404 não terá nome embutido.

## Achados e decisões propostas

- A página Astro atual tem uma tag `<style>` embutida e nenhum `<script>` embutido. O protótipo tem um `<style>`, estilos em atributos, uma tag `<script>` embutida e fontes do Google. Uma CSP com `style-src 'unsafe-inline'` e `script-src 'self'` mais hash SHA-256 exato do script do protótipo permite os dois estados sem `unsafe-inline` para scripts. Hash atual: `sha256-ooA2xiINZnk/ZkhpAxk8T+HeiOp7QXO+t067QKLAemY=`. Se o Design portar ou alterar o script, será necessário externalizá-lo ou atualizar o hash e testar no navegador antes do lançamento.
- O diretório `/_astro/` é gerado com nomes contendo hash; pode receber cache longo e `immutable`. HTML e `robots.txt` não receberão cache longo.
- Para domínio raiz no Pages, Cloudflare exige zona e NS da Cloudflare; para `www`, CNAME na Hostinger para o endereço Pages é alternativa sem mover a zona inteira. Os valores reais de NS e do projeto Pages só existirão no dia do lançamento.
- O Pages build image v3 usa Node 22 por padrão, enquanto `.node-version` do repo fixa `24.21.0`; o roteiro mandará conferir que o build escolheu essa versão.

## Próximo passo

Validar build, CSP e diretórios gerados; abrir PR e reportar ao Regente.

## 22/09/2026 · Preparação escrita

- Criei `public/_headers` com CSP sem `unsafe-inline` em scripts, políticas de segurança, microfone negado e cache longo apenas para `/_astro/*`. O hash do script do protótipo foi calculado do conteúdo atual exato; CSS embutido e fontes externas usadas por ele estão permitidos.
- Criei `public/robots.txt` e `src/pages/404.astro` simples. A página 404 usa `BaseLayout` e não repete o nome provisório.
- Criei o roteiro operacional para Cloudflare Pages e DNS Hostinger, com duas rotas (apex por troca de NS; `www` por CNAME), verificação de HTTPS, rollback e fontes oficiais datadas; checklist curto com 360 px, carga, privacidade, links e zero honesto.
- Ponto de atenção para F07: a página atual não tem faixa visual “Em construção” no corpo, apenas título e aviso textual. O checklist exige a faixa na versão final; não alterei `src/pages/index.astro` por ser área do Design/UI.

## 22/09/2026 · Validação local

- `npm run check` passou: lint, tipagem Astro, 34 testes e build estático.
- O build gerou `dist/404.html`, `dist/_headers` e `dist/robots.txt`; os dois últimos são cópias exatas de `public/`. Confirmei que a 404 usa o texto e link esperados e que os arquivos em `dist/_astro/` têm hash no nome.
- Conferi estaticamente a CSP: o HTML atual tem CSS embutido e nenhum script embutido; a regra permite esse CSS. O único script do protótipo produz exatamente o hash permitido. A regra não contém `unsafe-inline` em `script-src` e nega microfone. O teste de navegador precisa ser repetido com a versão final portada pela F07, pois seu JS pode mudar.
- Links locais do roteiro, checklist e diário resolvem; `git diff --cached --check` passou. O diff contém só os seis arquivos autorizados, sem alterações nas áreas do Design/UI ou EngenheiroFino.
- Próximo passo: commitar, enviar a branch, abrir PR e reportar ao Regente. Pendências do dia do lançamento: nome/domínio, escolha apex ou `www`, autorização de publicação e validação final da F07.
