# F20 · Diário do EngenheiroFino

## 22/09/2026 · Escopo e referência

- Pedido direto do Regente: avaliar `zod/mini` no caminho de navegador de `src/lib/ledger/index.ts`, manter a API e entregar somente se houver ganho real. Branch `fino/f20-zod-mini` criada da main `05186df`. Não havia BRIEF F20 no checkout ao iniciar; escopo vem da mensagem do Regente.
- Referência com Node 24.21.0 e build da mesma base: home 33,9 KB ao abrir / 58,4 KB após Conferir; transparência 31,3 / 55,8 KB; chunk do livro sob demanda 24,5 KB. Medição gzip nível 9, KB de 1024 bytes, pelo `npm run budget`; limite por página 60 KB.
- A documentação do Zod Mini descreve a API funcional para permitir remoção de código não usado, preservando parse/safeParse e inferência. Não carrega mensagens de erro localizadas por padrão; o verificador público já responde por códigos próprios. [Fonte oficial, acesso em 22/09/2026](https://zod.dev/packages/mini).
- Plano: converter somente schemas do núcleo compartilhado e assinatura, manter nomes exportados, tipos de domínio, validação estrita e a mesma lógica browser/CLI. Nenhuma dependência nova: subpath de zod 4.6.5 já instalado. Depois conferir testes, dados reais e tamanho com o mesmo livro.

## 22/09/2026 · Ganho medido e validação

- Convertidos apenas `schema.ts` e `signature.ts` para `zod/mini`: regex via `check`, nullable funcional, refinamento financeiro e limite de 100 mil eventos preservados. O barrel `index.ts`, os tipos de domínio e as funções públicas continuam com os mesmos nomes e resultados; parse/safeParse usados por todos os consumidores permanecem. Nenhum consumidor precisou mudar. Os métodos de construção internos agora são os do Mini; mensagens internas genéricas do Zod não são a API de erros do verificador.
- Nenhum pacote, versão ou lockfile alterado. O browser e a CLI continuam usando um único schema e verificador. O módulo build-only `published.ts` permanece fora do barrel de navegador.

| Medição gzip (KB = 1024 bytes) | Antes | Depois |
|---|---:|---:|
| Home ao abrir | 33,9 | 33,9 |
| Home após Conferir | 58,4 | 42,6 |
| Transparência ao abrir | 31,3 | 31,3 |
| Transparência após Conferir | 55,8 | 40,0 |
| Chunk do livro sob demanda | 24,5 | 8,7 |

- Chunk anterior `ledger.CRuz2dG3.js`: 86.408 bytes brutos / 25.043 gzip. Novo `ledger.DOTnmC7I.js`: 26.830 bytes brutos / 8.866 gzip. Economia de 16.177 bytes gzip (64,6% do chunk), medida com o mesmo livro de 33 fatos, mesma base e mesmo comando de build. A margem da home após Conferir passa de 1,6 para 17,4 KB no limite de 60 KB.
- `npm run check` passou com Node 24.21.0: lint, typecheck sem erros/avisos, 127 testes existentes, `ledger:verify` nos 33 fatos, build/CSP e budget. Cobertura existente inclui rejeição de campos extras, finanças, datas, adulteração, vetor normativo, cruzamento com protótipo independente e assinatura Ed25519.
- Livro, checkpoint e consumidores não foram alterados. Não houve deploy. Próximo passo: PR e report ao Regente com os tamanhos antes/depois.
