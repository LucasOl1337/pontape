# F03 · Pesquisa: dinheiro, jurídico e nome

Dono: `bruto` (ExecutorBruto) · Worktree: `.worktrees/bruto` · Branch: `bruto/f03-pesquisa` · Base: `main`

## Por que agora

Três decisões do Lucas travam o lançamento: nome e domínio, como receber doação, e em nome de quem (PRD §10, perguntas 1, 4 e 7). Ele decide melhor com as opções na mesa.

## Entregáveis

Três arquivos em `docs/pesquisa/`, cada um abrindo com **recomendação em 5 linhas** e depois o detalhe.

1. **`DOACOES-E-TRANSPARENCIA.md`**
   - Formas de receber doação no Brasil: PIX, cartão, recorrência, doação do exterior.
   - Bancos e provedores com API ou webhook que permitem mostrar a entrada no site em tempo real, e extrato das saídas. Taxas e exigências (CNPJ ou CPF).
   - Como publicar gastos com comprovante sem expor dado pessoal.
   - Exemplos reais de organizações com transparência radical ou painel ao vivo, com link.
2. **`ESTRUTURA-JURIDICA.md`**
   - Caminhos pra formalizar: associação, OSC, OSCIP. Custo, tempo, passos.
   - O que dá pra fazer antes do CNPJ, e o risco de receber doação em CPF.
   - Obrigações de prestação de contas.
   - LGPD aplicada a dado de pessoa em vulnerabilidade.
   - Licença open source: MIT, Apache 2.0, AGPL, com prós e contras pra este projeto.
   - Aviso no topo: pesquisa, não parecer jurídico.
3. **`NOMES.md`**
   - 12 a 15 nomes não genéricos. Curtos, fáceis de falar e de entender ouvindo (quem não lê vai ouvir o nome), fáceis de soletrar em voz alta.
   - Pra cada um: significado, domínio `.org.br`, `.com.br` e `.org` livre ou ocupado (consulta RDAP/whois com data), colisão com ONG ou marca existente.
   - Top 3 no começo, com motivo.

Diário em `docs/frentes/F03-pesquisa-dinheiro-juridico-nome/DIARIO.md`.

## Limites

Só leitura e consulta. Nada de registrar domínio, abrir conta, pedir orçamento ou falar com empresa.

## Pronto quando

- Os três arquivos existem, com recomendação no topo.
- Toda afirmação factual tem link e data de acesso.
- PR aberta pra `main` e report ao Regente com as três recomendações.
