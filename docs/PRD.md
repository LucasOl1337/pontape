# PRD · VidaNova (nome provisório)

Rascunho v0.1 · 22/09/2026 · dono: Regente · fonte: [spec 01 do Lucas](fontes/2026-09-22-spec-01.md)

Este é o documento-guia do produto. Mudança de escopo passa pelo Lucas; o Regente atualiza o texto. Agente que achar furo ou contradição anota no próprio `DIARIO.md` e avisa o Regente.

## Coração da ideia

Validado pelo Lucas em 22/09/2026, em ordem de prioridade. Se algo no resto do documento brigar com esta lista, vale a lista.

1. **Objetivo:** tirar do desamparo quem quer mudar de vida de verdade e não tem condição nem pro primeiro passo.
2. **A raiz:** dinheiro sozinho não resolve. Acertar a pessoa certa e dar a ela uma trilha completa até o emprego.
3. **A IA é o filtro:** entrevista rápida por voz, sem precisar ler. Entende quem está pronto e ajuda a pessoa a pensar no que pode realizar.
4. **Transparência total:** cada real que entra e sai aparece ao vivo, com comprovante, custo de operação incluído. É o que gera confiança pra doar.
5. **O básico vem da doação:** comida por alguns dias, roupa nova e limpa, higiene.
6. **Trabalho:** rede de emprego e pessoas ou empresas que se oferecem pra contratar o candidato certo.
7. **IA contínua:** o selecionado segue com acesso a uma IA simples.
8. **Gargalo, achar o candidato:** voluntários com dispositivo, panfleto, pontos públicos, site.
9. **Gargalo, o dispositivo:** levar a conversa por voz, com apoio visual, até quem não tem celular nem intimidade com tecnologia.
10. **O site:** hero com o projeto e a intenção; depois blocos modulares com funcionamento, módulos, pontos fortes, gargalos, dinheiro e ajuda que falta.
11. **Open source:** aceita qualquer ajuda; entra só o que o Lucas ou um admin aprovar.
12. **Destino:** organização sem fins lucrativos de verdade, com nome próprio e domínio.

Em uma frase: a IA acha e prepara quem quer mudar de vida, a doação dá o empurrão inicial, a rede dá o emprego, e tudo fica à vista, sempre.

## 1. Em uma frase

Uma organização sem fins lucrativos e open source que encontra pessoas em situação de vulnerabilidade que querem mudar de vida, dá o básico pra elas se reerguerem (comida, roupa, higiene), conecta com trabalho e com IA, e mostra ao vivo cada real que entra e sai.

## 2. O problema

- Quem está na rua ou em vulnerabilidade e quer sair não tem o mínimo pro primeiro passo: comer por alguns dias, roupa limpa, higiene, um trabalho.
- Dinheiro sozinho não resolve. A raiz é acertar a pessoa: quem quer mudar de vida de fato. E dar a ela uma trilha completa até o emprego, não uma ajuda solta.
- Doador desconfia porque não vê onde o dinheiro vai parar.
- Quem mais precisa muitas vezes lê pouco ou não lê, e não tem intimidade com tecnologia. Formulário e app comum não servem.

## 3. Pra quem

| Persona | O que quer | Como fala com o projeto |
|---|---|---|
| **Candidato** | Sair da situação, ter trabalho e rumo | Por voz, sem precisar ler. Pode não ter celular nem documento |
| **Doador** | Ajudar e ver o dinheiro sendo usado | Site: doar e acompanhar o painel ao vivo |
| **Voluntário de campo** | Encontrar e acompanhar candidatos | Leva o dispositivo de entrevista até a pessoa |
| **Empregador** | Contratar alguém preparado | Oferece vaga na rede de oportunidades |
| **Contribuidor** | Ajudar com código, design, pesquisa | GitHub, com aprovação do Lucas ou de um admin |
| **Admin** | Operar com segurança | Aprova contribuições, gastos e etapas sensíveis |

## 4. A jornada do candidato

1. **Descoberta**: voluntário na rua, panfleto ("mude sua vida de graça"), ponto público ou site.
2. **Entrevista**: conversa curta por voz com a IA, no celular do voluntário, num ponto público ou no site.
3. **Seleção**: a IA filtra e recomenda quem está pronto pra mudar de vida. Quem decide no fim está em aberto (§10).
4. **Ponte inicial**: comida por alguns dias, roupas novas e limpas, higiene básica. Pago com doação e publicado no painel.
5. **Trabalho**: o perfil vai pra rede de oportunidades; empregadores oferecem vaga.
6. **IA contínua**: o candidato segue com acesso a uma IA simples, por voz, pra pensar o que pode realizar e se preparar.
7. **Prova**: o resultado aparece no site, sem expor a pessoa.

## 5. Módulos

Cada módulo vira um bloco no site e uma ou mais frentes de trabalho em [QUADRO.md](QUADRO.md).

| ID | Módulo | O que precisa existir | Tipo |
|---|---|---|---|
| M1 | **Site público** | Home modular por blocos: hero, como funciona, módulos, transparência, gargalos, como ajudar, open source | Produto |
| M2 | **Doação e transparência ao vivo** | Receber doação; livro-caixa público com toda entrada e saída, comprovante, categoria e data, atualizado ao vivo | Produto + gargalo |
| M3 | **Captação de candidatos** | Voluntários, panfletos, pontos públicos, site. Critério de quem é "o candidato certo" | Gargalo |
| M4 | **Entrevista por voz** | IA que conversa por voz (e talvez visual) com quem não lê; dispositivo que leva isso até a pessoa | Gargalo |
| M5 | **Ponte inicial** | Comida, roupa, higiene: compra, entrega, parceiros, registro no livro-caixa | Operação |
| M6 | **Rede de oportunidades** | Distribuir candidatos pra redes de emprego; empregadores oferecem vaga | Produto + operação |
| M7 | **IA contínua** | Acesso simples e duradouro a IA pro candidato depois da seleção | Produto |
| M8 | **Open source e governança** | Repositório aberto, guia de contribuição, aprovação por admin, caminho pra ONG formal | Organização |
| M9 | **Marca, nome e domínio** | Nome não genérico, domínio comprado, identidade visual | Organização |

## 6. Princípios

1. **Transparência primeiro.** Todo real que entra e sai é público, com comprovante, categoria e data. Custo de operação também. Painel vazio mostra zero honesto, nunca número inventado.
2. **Dignidade.** Texto público nunca rebaixa ninguém. Nada de foto, nome ou história de candidato sem consentimento explícito. O resultado se prova com número e relato autorizado.
3. **Voz primeiro.** O candidato consegue passar pela jornada inteira sem ler.
4. **Privacidade desde o início.** Dado de pessoa vulnerável é sensível (LGPD). Coleta o mínimo, pseudonimiza, e dado real nunca entra no repositório.
5. **IA filtra, humano responde.** Proposta: a IA entrevista e recomenda; decisões que mudam a vida de alguém passam por uma pessoa. Confirmar com o Lucas (§10).
6. **Open source com curadoria.** Aberto a qualquer ajuda; entra no código só o que o Lucas ou um admin aprovar.
7. **Sem fins lucrativos.**

## 7. Site v1

**Pedido do Lucas:** interativo, bonito, por blocos, modular, cada parte bem separada, simples e fácil de entender.

Ordem proposta dos blocos (o Design/UI refina em `docs/design/`):

1. **Hero**: o que é o projeto e a intenção, em uma frase e uma chamada.
2. **O problema e a raiz**: por que só dinheiro não basta.
3. **Como funciona**: a jornada do §4 em passos visuais.
4. **Módulos**: um bloco por módulo do §5, com estado atual (funcionando, em construção, gargalo aberto).
5. **Transparência**: painel ao vivo com arrecadado, gasto por categoria, últimas movimentações e comprovantes.
6. **Gargalos em aberto**: o que ainda não sabemos resolver, e como ajudar em cada um.
7. **Como ajudar**: doar, ser voluntário, oferecer vaga, contribuir no GitHub.
8. **Open source**: repositório, como contribuir, quem aprova.
9. **Rodapé**: contato, dados da organização quando existirem, privacidade.

Requisitos: mobile-first, rápido em celular barato, acessível (WCAG AA), PT-BR.

## 8. Fases

| Fase | Entrega | Depende de |
|---|---|---|
| F0 · Fundação | PRD, repositório, arquitetura, direção visual, pesquisas de base | nada |
| F1 · Site no ar | Site v1 publicado no domínio escolhido, painel de transparência já visível | nome e domínio (Lucas), F0 |
| F2 · Doação ao vivo | Receber doação e mostrar toda movimentação no painel em tempo real | estrutura jurídica e conta (Lucas), F1 |
| F3 · Piloto de entrevista | Entrevista por voz funcionando num dispositivo, testada com voluntários | F0 (pesquisa de voz) |
| F4 · Primeiros candidatos | Piloto numa cidade: captação, seleção, ponte inicial | F2, F3, cidade do piloto (Lucas) |
| F5 · Trabalho e IA contínua | Rede de oportunidades e IA contínua pros selecionados | F4 |

## 9. Como medir

- Candidatos entrevistados, selecionados e empregados em 30 e 90 dias.
- % dos gastos com comprovante publicado. Meta: 100%.
- Custo por pessoa, da entrevista ao primeiro salário.
- Tempo entre uma movimentação real e ela aparecer no painel.
- Contribuidores externos com PR aprovada.

## 10. Perguntas pro Lucas

1. **Nome e domínio.** Qual nome? VidaNova é só o provisório (vem da pasta).
2. **Trecho perdido 1.** A transcrição perdeu uma parte sobre o dinheiro: "o dinheiro que vai trazer...", "igreja", "vai marcar". O que era? Parceria com igreja?
3. **Trecho perdido 2.** Antes de "que seja interativo, bonito e por blocos" a transcrição travou. Faltou algo sobre o site?
4. **Doação antes da ONG.** Enquanto não existe CNPJ, recebe em nome de quem? Ou espera formalizar?
5. **Cidade do piloto.** Onde começa?
6. **Quem decide a seleção.** Só a IA, voluntário, admin, ou IA recomenda e humano confirma?
7. **Licença open source.** MIT, Apache 2.0, AGPL? A pesquisa traz recomendação.
8. **Repositório público.** O repo nasceu privado. Abre quando nome e licença estiverem decididos?
9. **Responsável legal pelos dados.** Quem é o controlador dos dados dos candidatos (LGPD) e com qual base legal, antes de entrevistar gente de verdade?

## 11. Riscos

- **Exposição** de pessoa vulnerável: vazamento, estigma, uso indevido de imagem.
- **Fraude**: candidato, doação, desvio. A transparência ao vivo ajuda, mas não basta sozinha.
- **Viés da IA** na seleção: excluir justamente quem mais precisa.
- **Dinheiro sem estrutura jurídica**: receber e gastar doação sem CNPJ e prestação de contas.
- **Segurança** dos voluntários e dos candidatos no campo.
- **Promessa sem entrega**: site no ar gerando expectativa antes da operação existir. O site deixa claro o que já funciona e o que está em construção.
