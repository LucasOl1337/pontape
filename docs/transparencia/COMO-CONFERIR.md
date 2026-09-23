# Como conferir o livro

O livro mostra as ações registradas pelo projeto. Você pode baixar uma cópia e conferir no seu computador. Não precisa de conta no site nem de uma chave secreta. Enquanto o repositório estiver privado, o acesso ao código e às fontes do GitHub depende de convite. O site ainda não foi publicado por esta frente.

## O que a conferência diz

Cada registro tem uma impressão digital chamada hash. Ela depende do conteúdo e do registro anterior. Se alguém mudar um campo, tirar um registro do meio ou trocar a ordem, a conferência falha.

Guarde também o **checkpoint**, um arquivo pequeno com o tamanho e o hash da ponta do livro. Sua cópia ajuda a perceber se alguém retirou o fim do livro ou refez tudo depois. Se você baixar o livro e o checkpoint da mesma fonte, eles podem ter sido trocados juntos. Nesse caso, conferir os dois só mostra que combinam entre si.

Isso não prova que uma entrega aconteceu ou que toda ação foi registrada. Os links ajudam a conferir as fontes. Auditoria e revisão humana continuam necessárias.

**Estado desta versão:** assinatura ainda não configurada; carimbo de tempo ainda não feito; espelho independente ainda não ativo. Não mostrar “prova externa confirmada”.

## Conferir no computador

Com o código e Node da versão em `.node-version`:

```sh
npm ci
npm run ledger:verify
```

O comando confere o arquivo `src/data/ledger/ledger.json`. Para uma cópia baixada de `/livro/ledger.json`, use `npm run ledger:verify -- --file /caminho/ledger.json`. Saída `valid: true` significa que a estrutura, os hashes, a ordem e as correções conferem. Saída de erro termina com código diferente de zero. O livro inicial tem 21 fatos reais do projeto e nenhum movimento financeiro. Fontes e datas estão em [FONTES.md](FONTES.md).

Guarde o checkpoint fora desta pasta. Depois, ao receber uma versão nova, confira também sua cópia antiga:

```sh
npm run ledger:verify -- --checkpoint /caminho/da/sua/copia/checkpoint.json
```

Uma versão maior pode passar: os registros que você já conhecia devem continuar iguais. Não apague sua cópia antiga quando aparecer uma divergência. Compare com outra pessoa e peça explicação à equipe.

## Conferir pelo site

A F07 pode ligar o botão “Conferir” à mesma função usada pelo comando acima. Os arquivos prontos no build são `/livro/ledger.json` (livro completo), `/livro/events.json`, `/livro/checkpoint.json` e `/livro/trust.json`. A hora da última atualização é `lastUpdatedAt` do resultado; não significa conexão em tempo real.

A interface do botão pertence à F07. Esta frente entrega os arquivos e a função, sem afirmar que a interface já foi publicada. Para conferir uma cópia guardada, a interface deve aceitar o checkpoint local do leitor. Nunca tratar o checkpoint recém-baixado como uma fonte independente.

## Se aparecer um erro

Guarde os arquivos recebidos e o resultado. Não tente “arrumar” os hashes. Uma mudança legítima deve aparecer como um evento novo. Se houver dado pessoal publicado por engano, avise pelo canal de segurança definido pelo projeto; não repita o dado numa issue pública.

## Para quem quer examinar o código

O contrato está em [CONTRATO.md](CONTRATO.md), e os comandos de operação estão em [OPERACAO.md](OPERACAO.md). A cadeia usa JSON canônico JCS e SHA-256. [Especificação JCS, consultada em 22/09/2026](https://www.rfc-editor.org/rfc/rfc8785).
