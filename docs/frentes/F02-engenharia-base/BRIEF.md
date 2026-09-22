# F02 · Arquitetura e base do código

Dono: `fino` (EngenheiroFino) · Worktree: `.worktrees/fino` · Branch: `fino/f02-base` · Base: `main`

## Por que agora

Todos os módulos do [PRD](../../PRD.md) vão morar num sistema só. As partes delicadas (dinheiro público ao vivo, dado de pessoa vulnerável, IA de voz) precisam de desenho antes de código, e o repositório precisa de uma base que qualquer contribuidor consiga rodar.

## Etapa 1 · Arquitetura (pare e reporte)

Escreva `docs/arquitetura/ARQUITETURA.md`:

1. **Mapa do sistema**: M1 a M9 como componentes, o que é software e o que é operação humana.
2. **Stack proposta** com o motivo de cada escolha. Critérios: custo perto de zero no começo, deploy simples, fácil pra contribuidor open source, mobile-first e rápido em celular barato, bom suporte a tempo real.
3. **Modelo de dados inicial**: candidato pseudonimizado, entrevista, doação, gasto, comprovante, vaga, voluntário, admin.
4. **Livro-caixa público**: como uma movimentação real vira linha pública e verificável, como chega ao painel "ao vivo", como garantir que ninguém apaga ou edita escondido (append-only, hash encadeado, espelho público).
5. **Entrevista por voz**: desenho de alto nível. Consolide o relatório da F04 quando chegar.
6. **Privacidade e segurança**: LGPD pra dado sensível, o que nunca sai do servidor, papéis e permissões, auditoria.

Liste as decisões propostas (stack, hospedagem, banco, licença sugerida) no seu `DIARIO.md` e reporte ao Regente. **Espere o OK antes da etapa 2.**

## Etapa 2 · Base do código (depois do OK)

Esqueleto na stack aprovada: lint, typecheck, teste e build rodando; CI no GitHub Actions; `.env.example`; `CODEOWNERS` com `@LucasOl1337`; `CONTRIBUTING.md` em rascunho dizendo que toda PR passa por aprovação de admin. Página inicial é placeholder: a interface vem da F01 e F07.

## Delegação

A F04 (pesquisa de voz e dispositivo) é sua pra briefar ao SubAgente, revisar e integrar. O brief dela está em [`../F04-pesquisa-voz-dispositivo/BRIEF.md`](../F04-pesquisa-voz-dispositivo/BRIEF.md). O worktree dele já existe em `.worktrees/devin`, branch `devin/f04-voz`.

## Limites

Nada de criar conta em serviço, deploy ou configurar pagamento. Onde precisar, descreva o passo no documento.

## Pronto quando

- Etapa 1: ARQUITETURA.md cobre os 6 itens, decisões propostas no DIARIO, report ao Regente.
- Etapa 2: `main` do worktree roda lint, typecheck, teste e build do zero seguindo só o README; CI verde na PR; report ao Regente.
