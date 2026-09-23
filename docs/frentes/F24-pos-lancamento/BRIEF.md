# F24 · Ensaio pós-lançamento

Dono: `bruto` (ExecutorBruto) · Worktree: `.worktrees/bruto` · Branch: `bruto/f24-pos-lancamento` a partir da `main` atualizada

## Por que agora

O site está no ar em **https://pontape.org** desde 23/09/2026 (D018 escolheu a Crônica, D019 publicou). A F18 ensaiou o v1 no build local e deixou pendente o que só dá pra ver no ar: HTTPS de verdade, cabeçalhos servidos, domínio com e sem www, carga real. E o visual agora é outro, então os itens de visual precisam ser refeitos.

## Como

No site publicado, pela tua bancada agent-bench (nunca o navegador do Lucas):

1. Refaça o [CHECKLIST-LANCAMENTO](../../operacao/CHECKLIST-LANCAMENTO.md) inteiro contra **https://pontape.org**: HTTPS e certificado, `http://` (anote se redireciona ou não), `www`, cabeçalhos reais, cache de `/_astro/`, 404, `robots.txt`, prévia de compartilhamento (`og:image` absoluto abrindo), downloads `/livro/`.
2. Visual da Crônica: 320px e 360px sem rolagem lateral, A+, zoom 200%, teclado com a escada (setas), `forced-colors`, `prefers-reduced-motion`, contraste AA.
3. Conferir no livro real e no exemplo; baixe `/livro/ledger.json` e rode `python3 tools/conferir.py` nele.
4. Carga com 3G lento no site real (agora com compressão e cache do Cloudflare).
5. Reveja as issues #40 a #43 do v1: feche com comentário as que não se aplicam mais ao visual novo e reproduza as que ainda valem.

## Entregável

`docs/operacao/ENSAIO-POS-LANCAMENTO.md` com data, item, resultado e print quando falhar; issues novas pras falhas; diário em `docs/frentes/F24-pos-lancamento/DIARIO.md`.

## Limites

Só leitura no site. Sem publicar, sem mexer no Cloudflare, sem mexer em `src/`.

## Pronto quando

Todo item com resultado, falhas viraram issue, #40 a #43 revistas, PR aberta e report ao Regente.
