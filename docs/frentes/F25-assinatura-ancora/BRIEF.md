# F25 · Assinatura e âncora do livro no ar

Dono: `fino` (EngenheiroFino) · Worktree: `.worktrees/fino` · Branch: `fino/f25-ancora` a partir da `main` atualizada

## Por que agora

O site está no ar (D019), o repositório é público (D020) e a publicação é automática (D021). Falta a parte da "criptografia aberta" que impede até a gente de reescrever o passado sem ser pego: assinatura dos checkpoints e ancoragem pública. O Lucas delegou a custódia ao Regente.

## O que já existe (feito pelo Regente em 23/09/2026)

- **Chave Ed25519** fora do repositório, em `~/.config/pontape/ledger-signing.pem` (600). Chave pública: `ab8b5cfb6bf0f218e2514fe47fa9a014827376ec9f0c556bcb1df3a3c3d81dc6` (também em `~/.config/pontape/ledger-signing.pub.hex`).
- **Primeiro checkpoint assinado** (sequência 43) e **carimbo OpenTimestamps** pendente de confirmação no Bitcoin, em `~/.config/pontape/ancoras/checkpoint-43-assinado.json` e `.json.ots`. Cliente `ots` 0.7.2 foi usado de um venv temporário.
- `trust.json` ainda diz `not_configured` / `not_anchored`, porque o schema aceita só esses literais.

## Entregáveis

1. **Contrato de confiança**: `trust.json` passa a declarar a chave pública e o estado real (assinatura configurada; âncora pendente ou confirmada), com schema estrito e versão. Documente no CONTRATO.
2. **Âncoras publicadas**: arquivos imutáveis por checkpoint em `public/livro/ancoras/` (assinado + `.ots`), com um índice versionado. Traga os dois arquivos da sequência 43 que estão em `~/.config/pontape/ancoras/` (só leitura; é dado público).
3. **Script `ledger:anchor`** que assina o checkpoint atual com a chave de fora do repo e carimba com `ots`, gravando no índice. Dry-run por padrão, `--apply` explícito. E **`ledger:anchor-upgrade`**, que completa provas pendentes quando o Bitcoin confirmar. Diga no DIARIO como o `ots` é instalado de forma reproduzível.
4. **Site**: a página do livro mostra quem assina (chave pública), a última âncora e o estado dela, e o Conferir também confere a assinatura do checkpoint com a chave pública publicada. Continua carregando o verificador só no clique.
5. `COMO-CONFERIR.md` e `OPERACAO.md` atualizados, incluindo como conferir o `.ots` sozinho, sem confiar no nosso site.
6. Proposta no DIARIO (sem aplicar): onde publicar a chave pública num canal independente do site e do repositório.

## Limites

- A chave privada nunca entra no repositório, no CI, no navegador nem em log. Scripts leem por caminho externo, como o `ledger:sign` já faz.
- Não publique nada: a publicação é automática pela `main` (D021). Não mexa em `scripts/deploy/`.

## Pronto quando

`npm run check` passa, a âncora 43 aparece no site local com estado "pendente", a assinatura confere no navegador, e a PR foi reportada ao Regente.
