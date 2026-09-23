# F32 · Transparência que um leigo entende

Dono: `design` (Design/UI · Claude Opus 5.5, esforço xhigh) · Branch: `design/f32-transparencia` a partir da `main` · Worktree: `.worktrees/design` · Começo: 23/09/2026

## O que o Lucas disse

[Feedback de 23/09](../../fontes/2026-09-23-feedback-transparencia.md), com [print](../../fontes/prints/transparencia-2026-09-23.png): a home melhorou bastante, mas `/transparencia` "sofre ainda da mesma densidade". "As mudanças de GitHub, a população média não vai entender nada." O que a página precisa é "explicar bem que a gente vai ter um sistema de criptografia aberta, ao vivo, em tempo real, pra 100% das ações": as de dinheiro, as das atividades e as decisões. E "um botão 'parte técnica'": aí sim aparece o GitHub e a explicação técnica, pra quem é técnico. Decisão D029.

É o mesmo trabalho que você fez na home na F29, agora no livro.

## O que é verdade hoje (não prometa além disso)

- Cada ação vira um registro lacrado junto com o anterior (SHA-256 encadeado). Mexer num registro antigo quebra todos os seguintes, e qualquer um percebe.
- Hoje entram sozinhas as ações do projeto: cada decisão (`D###`) e cada mudança aprovada no site. Entram em poucos minutos, sem ninguém digitar: o robô do livro anota e a publicação automática sobe o site.
- Dinheiro, entregas (comida, roupa, higiene) e passos com candidatos já têm lugar no livro, mas estão em zero porque a doação e o atendimento ainda não abriram. Candidato aparece só como contagem, nunca quem.
- O botão Conferir refaz a conta de todos os registros no aparelho da pessoa.
- A assinatura digital e o carimbo de tempo público (F25) estão preparados, mas ainda não aparecem no site. Fale deles como "vai ter".

"Ao vivo" pode ser dito pro que já entra sozinho em minutos. Pro resto, "quando abrir, entra do mesmo jeito".

## As duas camadas

**Primeira camada, pra quem é leigo.** Sem GitHub, PR, commit, hash, JSON, SHA-256, JCS, Ed25519 nem "marca" com número. Tem que responder, em poucos segundos:

1. O que é isso? Um registro aberto de tudo que o PontaPé faz.
2. O que entra? Três tipos, com palavra de gente: o dinheiro (cada real que entra e sai), as atividades (entregas e conversas, só a quantidade, nunca quem), e as decisões e mudanças no projeto.
3. Por que dá pra confiar? Ninguém consegue apagar nem mudar escondido, e qualquer um confere. Explique a criptografia aberta como se fosse pra alguém da família, e se um desenho simples explicar melhor, use.
4. O que já aconteceu? As últimas ações em frase de gente ("23/09 · Decisão: a home ficou mais simples"), sem número de PR nem link de GitHub. Os números honestos (ações, entrou, saiu) numa linha só.
5. Confira você mesmo: o botão Conferir continua, explicado em uma frase.

**Parte técnica, num botão.** Tudo que é de técnico mora aqui: as marcas, os links pro GitHub, o arquivo do livro pra baixar, o conferidor em Python, o contrato, a lista completa com filtros e o exemplo de linha adulterada. Você escolhe se é página própria (tipo `/transparencia/tecnico`, como os cadernos viraram páginas na F31) ou outra forma, e explica a escolha no DIARIO.

## Como fazer

1. **Proposta curta primeiro:** no DIARIO, o mapa das duas camadas (o que fica na primeira tela em 1920 e em 360, o que vai pra parte técnica, o que sai) e as frases principais. Mande o resumo: `maestri ask "Regente" "F32 proposta: <resumo>"`. Pode seguir enquanto eu leio.
2. Pras mudanças de site, o livro só guarda o número da PR, sem título. Se a frase de gente precisar de um dado que o livro não tem, proponha no DIARIO de onde ele viria e me avise. **Não mexa** em `src/lib/ledger/**`, `src/data/ledger/**`, `scripts/ledger/**` nem `.github/**`. O conteúdo exibido pode vir de fora do evento, como o título da decisão já vem (D013).
3. O Prumo (F31) cuida do layout do resto do site ao mesmo tempo e o Anil (F30) das cores. Cor só por token, `palettes.css` é do Anil. No `site.css`, mexa só nas regras do livro. Rebase na `main` antes da PR.

## Pronto quando

1. Primeira tela de `/transparencia` em 1920×1080 e 360×780 sem nenhuma palavra da lista técnica acima, e com as cinco respostas.
2. A parte técnica guarda tudo que existe hoje (nada técnico some; só muda de lugar), e o Conferir e o exemplo adulterado continuam funcionando.
3. AA, teclado, 360 sem rolagem lateral, `npm run check` passando, orçamento de 60 KB.
4. PR `F32 · Transparência que um leigo entende` com prints de antes e depois em 1920 e 360 (primeira camada e parte técnica), tirados na tua bancada agent-bench. Report: `maestri ask "Regente" "F32 pronta: <PR>"`.

O checkout `~/Projects/VidaNova` é do Regente: não commite, troque branch, faça stash ou reset nele. DIARIO em `docs/frentes/F32-transparencia-pra-leigo/DIARIO.md`.
