# F32 · Diário

## 23/09/2026 · Proposta (passo 1)

Branch `design/f32-transparencia`, rebaseada na `main` em `314080c` (já com a #69 do Prumo: `--page` 100rem, livro na grade do logo, x=193 em 1920). Li o BRIEF, o feedback e o print, o meu DIARIO da F29 e o código do livro (`LivroTopo`, `LivroMais`, `ComoConferir`, `Dinheiro`, `Regras`, `ChainEntry`, `ledger.ts`, `verify.ts`, `phrases.ts`).

A ideia em uma linha: **`/transparencia` vira uma página curta, em palavras de gente, com o Conferir. Tudo o que existe hoje muda inteiro pra `/transparencia/tecnico`, atrás do botão "Parte técnica".**

### Por que página própria pra parte técnica

- É o mesmo caminho dos cadernos na F31: endereço pra mandar pra quem é técnico, o botão Voltar funciona, e o texto técnico não vaza pra primeira camada nem escondido.
- A primeira camada fica leve: sai o livro de exemplo, a lista das 64 ações e as abas. Fica só o livro de verdade que o Conferir precisa.
- Risco baixo: a parte técnica é a página de hoje quase igual, então lista, filtros, exemplo adulterado e Conferir continuam funcionando como estão.
- Endereço antigo não quebra: `/transparencia#acoes`, `#como-conferir`, `#dinheiro`, `#o-que-entra`, `?exemplo` e `?tipo=` levam pra `/transparencia/tecnico` com o mesmo pedaço. `#livro` e `#conferir` ficam na primeira camada.

### Primeira camada `/transparencia`

Sem a faixa preta "Em construção": a própria página diz o que ainda não abriu, como a home na F29. Ordem na página (é a ordem de leitura no celular):

1. **Topo:** "Transparência" em cima e, na mesma linha, o botão **Parte técnica**.
2. **Título (fica o de hoje):** "Tudo que o projeto faz, *à vista.*"
3. **Apoio (respostas 1, 2 e 3 em duas frases):** "Um livro aberto com tudo que o PontaPé faz: o dinheiro, as atividades e as decisões. Ninguém consegue apagar nem mudar escondido, e qualquer pessoa confere."
4. **Números numa linha (resposta 4):** "Até hoje: **64** ações anotadas · **R$ 0,00** entrou · **R$ 0,00** saiu". Embaixo, pequeno: "A última entrou em 23/09, às 10:36. Zero real porque a doação ainda não abriu."
5. **Confira você mesmo (resposta 5),** a caixa escura de hoje: botão Conferir e "Seu aparelho refaz a conta de cada ação e mostra se alguém mexeu em alguma. Nada é enviado pra gente." O resultado também em palavra de gente: "Tudo certo. Nenhuma ação foi apagada nem mudada desde o começo. 64 de 64 conferidas no seu aparelho." (a "marca mais recente" do resultado fica só na parte técnica).
6. **O que entra no livro** (resposta 2 por extenso), três itens com ícone e o estado de cada um:
   - **O dinheiro.** Cada real que entra e cada real que sai, até o custo de manter o projeto de pé. *Começa quando a doação abrir.*
   - **As atividades.** Cada entrega de comida, roupa e higiene, e cada conversa com quem quer mudar de vida. *Começa quando o atendimento abrir.*
   - **As decisões.** Cada decisão tomada e cada mudança feita no projeto. *Ao vivo: entram sozinhas, poucos minutos depois.*
   - E a regra de hoje, embaixo: "Toda ação aparece. Quem é a pessoa, não. Nunca entra nome, rosto, CPF nem lugar."
7. **Por que dá pra confiar** (resposta 3 por extenso), com um desenho de duas linhas: quatro ações presas uma na outra ("Assim está") e a mesma corrente com a segunda rasurada e os elos dali pra frente quebrados em vermelho ("Se alguém mexer numa").
   - "Cada ação ganha um lacre, feito com criptografia aberta: uma conta pública que qualquer computador sabe fazer. Mudou uma vírgula, o lacre muda inteiro."
   - "O lacre de cada ação leva junto o da anterior, como os elos de uma corrente. Se alguém mexer numa ação antiga, a corrente quebra dali pra frente, e qualquer um vê."
   - "Errou? A correção entra como ação nova, e a errada continua à vista."
   - "Vai ter também: a assinatura do projeto em cada lacre e a data guardada num lugar público, fora do nosso alcance." (F25, falado como "vai ter")
8. **O que já aconteceu** (resposta 4 por extenso): as cinco últimas, em frase de gente, sem número de PR nem link:
   - 23/09 · 2 mudanças aprovadas no projeto
   - 23/09 · Decisão: a transparência ganha uma versão simples, com a parte técnica num botão
   - 23/09 · Decisão: a IA ajuda a pessoa antes do trabalho e acompanha ela sempre, de graça
   - 23/09 · 2 mudanças aprovadas no projeto
   - 23/09 · Decisão: um designer novo assume a arrumação das páginas
   - Link "Ver todas, na parte técnica".
9. **Fim:** "Quer ver por dentro? A lista completa, os arquivos e como conferir no computador." e o botão **Parte técnica** de novo.

**Primeira tela em 1920×1080** (conteúdo de x=193, na grade do logo): tudo, de 1 a 8.

```
Transparência                                          [Parte técnica]
Tudo que o projeto faz, à vista.        | Até hoje: 64 · R$ 0 · R$ 0
Apoio em duas frases                    | ┌ Confira você mesmo. ────┐
                                        | │ [Conferir]  uma frase   │
O dinheiro   | As atividades | As decisões (três colunas, com o estado)
Por que dá pra confiar + desenho        | O que já aconteceu (5 linhas)
```

**Primeira tela em 360×780** (tira o cabeçalho e o botão Cores, sobram uns 650 px): topo com o botão, título, apoio, números e o Conferir inteiro. As cinco respostas estão ali na forma curta: 1, 2 e 3 no apoio, 4 nos números, 5 no botão. O detalhe de cada uma vem logo depois de rolar, na mesma ordem.

Some da primeira camada: marca com número, "Livro estático", as quatro etiquetas de tipo (Dinheiro, Vida real, Candidato, Projeto), filtros, lista inteira, "Livro de verdade / Ver um exemplo", as três abas e a nota do `DECISOES.md`. Tudo isso vai pra parte técnica.

### Parte técnica `/transparencia/tecnico`

A página de hoje, mudada de lugar, com o topo de caderno da F31:

- "Transparência › Parte técnica", título "Por dentro *do livro.*", uma frase: "Pra quem quer conferir por conta própria: as marcas, a lista completa, os arquivos e o código."
- Os quatro números com a marca mais recente, a nota do livro estático e o Conferir com o detalhe técnico.
- Todas as ações: livro de verdade ou exemplo, filtros, páginas, "Mudar uma linha escondido", "Ver a fonte" com o número da PR, e a nota do `DECISOES.md`.
- As três abas: Como conferir (os três passos, o texto da ação, a marca, a corrente, o que o livro não prova, os downloads, assinatura, carimbo e cópia), Dinheiro, O que entra.
- **Novo, um bloco "No GitHub"** com link de verdade: repositório, contrato, como conferir, conferidor em Python (`tools/conferir.py`) e operação. Hoje o `npm run ledger:verify` e o `COMO-CONFERIR.md` aparecem como texto, sem link, e o Python nem aparece.
- A faixa preta continua aqui, como nas páginas de Construir junto.

Nada técnico sai do site: só muda de lugar.

### Dado que o livro não tem (preciso de você)

A frase de gente da decisão não existe hoje. O título do `DECISOES.md` é de quem constrói ("Stack: Astro + TypeScript…", "Repositório `LucasOl1337/VidaNova` nasce privado"). **Proposta:** uma sexta coluna no `DECISOES.md`, **"Em palavras simples"**, lida no build do mesmo jeito que o título (D013), fora da marca. Quem registra a decisão escreve a frase junto. Sem a frase, a linha diz "Decisão nova sobre o projeto", e o build não para (o livro ao vivo não pode travar por causa de texto).

Rascunho das 29 frases, pra você colar ou corrigir:

| ID | Em palavras simples |
|---|---|
| D001 | O projeto ganha um nome provisório pra começar a trabalhar |
| D002 | O código começa fechado, até ter nome e licença |
| D003 | Tudo que é pro público sai em português |
| D004 | Cada um da equipe trabalha no seu canto, e tudo passa por revisão antes de entrar |
| D005 | Todo trabalho fica anotado, pra ninguém perder o fio |
| D006 | O site é feito pra abrir rápido em celular barato e custar zero no começo |
| D007 | O site mostra zero enquanto não entrar dinheiro, e nunca diz "ao vivo" sem estar |
| D008 | A conversa por voz vai rodar no celular de um voluntário, que fica junto o tempo todo |
| D009 | Primeiro o site e a transparência; a conversa com as pessoas vem depois |
| D010 | Tudo que o projeto faz vai pra um livro aberto, sem mostrar quem é a pessoa |
| D011 | O site mostra com honestidade o que funciona e o que ainda precisa de ajuda |
| D012 | Nenhum dado pessoal é guardado antes de ter um responsável legal por ele |
| D013 | O livro pode mostrar o nome de cada decisão, pra ficar fácil de ler |
| D014 | Existe um livro só, pra nunca ter duas versões |
| D015 | A equipe desenha cinco caras diferentes pro site, pra escolher uma |
| D016 | O projeto passa a se chamar PontaPé |
| D017 | A página inicial vira uma escada curta, que cabe numa tela |
| D018 | O Lucas escolhe a cara do site |
| D019 | O site entra no ar em pontape.org |
| D020 | O código fica aberto pra qualquer pessoa ver e usar |
| D021 | O site se atualiza sozinho a cada mudança aprovada |
| D022 | O endereço do código passa a usar o nome PontaPé |
| D023 | Uma equipe passa a noite arrumando detalhes do site |
| D024 | O site fica mais limpo: saem o botão de ouvir e o de letra maior |
| D025 | O site ganha um botão pra testar cores, por enquanto |
| D026 | As cores novas são reprovadas, e começa uma rodada nova |
| D027 | Um designer novo assume a arrumação das páginas |
| D028 | A IA ajuda a pessoa antes do trabalho e acompanha ela sempre, de graça |
| D029 | A transparência ganha uma versão simples, com a parte técnica num botão |

Pra mudança aprovada, o livro só tem o número. Proposta: na primeira camada, as seguidas do mesmo dia viram uma linha só, "3 mudanças aprovadas no projeto". O número e o link ficam na parte técnica. Não peço dado novo pra isso.

### Arquivos

- Novos: `src/pages/transparencia/tecnico.astro`, `src/components/cronica/LivroLeigo.astro` (primeira camada), `src/lib/ledger-view/plain.ts` (frases de gente e agrupamento, com teste que barra a lista técnica), `src/scripts/transparencia.ts` (Conferir e endereço antigo).
- Mudam: `transparencia.astro` (vira `transparencia/index.astro`), `LivroTopo.astro` (topo de parte técnica), `ComoConferir.astro` (links), `verify.ts` (resultado em palavra de gente), `decisions.ts` (lê a coluna nova, se existir), `share.ts`, `SiteHeader.astro` (Transparência marcado também na parte técnica), `check-budget.mjs` (página nova no orçamento), `site.css` (só regras do livro).
- Não toco: `src/lib/ledger/**`, `src/data/ledger/**`, `scripts/ledger/**`, `.github/**`, `palettes.css`, `DECISOES.md`.

### Onde parei

Proposta escrita e mandada pro Regente. Próximo passo: prints de antes na bancada, depois a primeira camada.
