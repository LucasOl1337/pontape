# F15 · Conferidor independente do livro público

Dono: `bruto` (ExecutorBruto) · Worktree: `.worktrees/bruto` · Branch: `bruto/f15-conferidor` a partir da `main` atualizada · Resolve a issue #12

## Por que agora

"Criptografia aberta" só vale se quem desconfia da gente consegue conferir sem usar o nosso código. Hoje existem duas implementações que batem entre si: o núcleo da F08 (EngenheiroFino) e o gerador do protótipo (Design/UI). A terceira vem de fora do ecossistema JavaScript e é escrita **só a partir do contrato**, pra provar que o contrato basta.

## Regra de sala limpa

Leia **só** `docs/transparencia/CONTRATO.md`, a ARQUITETURA §4 e os arquivos de livro como dados. **Não leia** `src/lib/ledger/*.ts` nem `design/prototipo/*.js`. Se o contrato não disser algo que você precisa, isso é um furo do contrato: anote no DIARIO e me avise, em vez de olhar o código.

## Entregáveis

1. **`tools/conferir.py`**: Python 3 só com biblioteca padrão, um arquivo. Recebe o caminho de um livro JSON e confere schema básico, sequência, encadeamento, hash de cada evento (JCS + SHA-256) e a soma dos centavos. Saída em PT-BR simples: "Tudo certo: N ações, nada apagado nem mudado" ou a primeira linha com problema e o motivo. Código de saída 0 ou 1.
2. **Testes** com os vetores que já estão na `main`: `design/prototipo/ledger/real.json` e `sample.json` passam; cópias adulteradas (campo mudado, evento apagado, ordem trocada, hash trocado) falham. Quando o livro real da F08 entrar na `main`, ele também tem que passar.
3. Seção **"Conferir com Python"** no `docs/transparencia/COMO-CONFERIR.md` quando ele existir (senão, crie a seção num arquivo novo `docs/transparencia/CONFERIR-COM-PYTHON.md`): três comandos, sem instalar nada além do Python.

Diário em `docs/frentes/F15-conferidor-independente/DIARIO.md`.

## Limites

Não mexa em `src/`, `scripts/` nem `.github/workflows/`. Se quiser o conferidor no CI, proponha no DIARIO que eu passo pro EngenheiroFino.

## Pronto quando

- `python3 tools/conferir.py design/prototipo/ledger/real.json` diz "Tudo certo" e cada adulteração dos testes falha com a linha certa.
- Nenhum arquivo proibido pela sala limpa foi lido (declare isso no DIARIO).
- PR aberta pra `main` e report ao Regente.
