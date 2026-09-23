# Conferir com Python

O conferidor independente usa somente Python 3 e a biblioteca padrão. Na raiz do repositório:

```sh
python3 tools/conferir.py design/prototipo/ledger/real.json
python3 tools/conferir.py design/prototipo/ledger/sample.json
python3 tools/conferir.py src/data/ledger/ledger.json
```

O primeiro livro registra ações do projeto; o segundo é **fictício**, para testar as outras famílias. O terceiro comando vale quando o livro publicado da F08 estiver disponível na `main`. A saída mostra o número de ações, o saldo dos movimentos em reais e a primeira **linha lógica** (posição da ação no livro) com problema, se houver. Código de saída `0` significa que os eventos presentes passaram; `1` indica erro.

O hash de cada ação usa [JCS (RFC 8785)](https://www.rfc-editor.org/rfc/rfc8785.html) e SHA-256, conforme o [contrato v1](CONTRATO.md). O programa também confere sequência, ligação com o hash anterior, referências de correção e soma dos deltas financeiros. No contrato atual, os nomes completos das chaves de payload, os valores permitidos de categoria e evidência, e o literal do identificador do checkpoint ainda aguardam definição. Por isso, a validação estrutural desses pontos é parcial; alterações em qualquer campo de um evento existente ainda invalidam seu hash.

Uma cadeia válida **não prova** que ninguém retirou ações do fim ou reescreveu tudo junto com o checkpoint. Para isso, guarde e compare uma cópia anterior do checkpoint fora do repositório. Assinatura e ancoragem públicas ainda não estão ativas.
