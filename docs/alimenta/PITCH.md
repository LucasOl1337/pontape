# Pitch da Rede Alimenta (5 a 7 minutos)

Projeto integrador FIAP Rede Alimenta IA. Roteiro falado, com tempo e quem fala. Troque `[pessoa A]` etc. pelos nomes do grupo.

Rubrica da FIAP, para lembrar onde está o peso: impacto social 30%, qualidade da AI 30%, DevSecOps 20%, engenharia e defesa 20%.

## Antes de começar (10 minutos antes)

- [ ] Abrir a URL do painel e a do Swagger. O Render free dorme após 15 minutos parado e leva cerca de 1 minuto para acordar ([Render](https://render.com/docs/free), acesso em 14/10/2026).
- [ ] Rodar `POST /demo/reset` com o token, para o painel começar no seed.
- [ ] Deixar abertas três abas: painel, Swagger e a última execução verde do workflow "Rede Alimenta" no GitHub.
- [ ] Ter a gravação de reserva no computador, fora da internet.
- [ ] Ter `docker compose up` rodando localmente como segunda reserva.
- [ ] Anotar o commit que está no ar e conferir que é o mesmo da execução verde.

## Roteiro

| Bloco | Tempo | Quem fala | O que mostrar |
|---|---|---|---|
| 1. PontaPé | 0:00 a 0:40 | [pessoa A] | Site pontape.org, passo 4 "Comida e roupa" |
| 2. O problema da comida | 0:40 a 1:20 | [pessoa A] | Um slide ou nada |
| 3. Demo ao vivo | 1:20 a 4:00 | [pessoa B] | Painel e Swagger |
| 4. O que é AI e o que é regra | 4:00 a 5:00 | [pessoa C] | Aba do modelo no painel |
| 5. DevSecOps | 5:00 a 6:00 | [pessoa D] | GitHub Actions, relatórios Bandit e Trivy |
| 6. Transparência e fecho | 6:00 a 6:45 | [pessoa A] | Aba "Conferir livro da demo" |

### 1. PontaPé (40 s)

> O PontaPé é um projeto open source sem fins lucrativos. Ele quer achar quem está em situação difícil, dar o básico e ajudar a pessoa a chegar a um trabalho. E mostra em público cada ação, num livro que qualquer um confere.
>
> O passo 4 da escada é "Comida e roupa". A Rede Alimenta é a peça que cuida da comida nesse passo. Hoje ela roda como demonstração, com dados simulados.

### 2. O problema da comida (40 s)

> Comida boa vai para o lixo porque ninguém decide a tempo para onde ela vai. Do outro lado, tem ONG que precisa dessa comida e não fica sabendo.
>
> O problema não é só ter a comida. É o tempo. Um lote de pão dura um dia. Quem doa precisa saber, rápido, qual ONG aceita pão, tem espaço hoje e está perto.

### 3. Demo ao vivo (2 min 40 s)

Passo a passo. Fale enquanto clica.

1. **Criar o lote.** No painel, cadastrar um lote de padaria, 12 kg, vencendo em poucas horas, região Leste.
   > Acabei de cadastrar 12 kg de pão que vencem hoje à noite.
2. **Ver o risco.** O lote aparece com a probabilidade de descarte e a faixa de risco.
   > O modelo diz que este lote tem risco alto de ir para o lixo. Por isso ele sobe na fila e aparece nos alertas.
3. **Escolher a ONG.** Abrir as recomendações. Mostrar os pontos de cada regra.
   > Aqui estão as ONGs que aceitam padaria e têm espaço hoje, da mais perto para a mais longe. Escolho a primeira.
4. **Confirmar.** A ONG confirma.
   > A ONG aceitou. Esse tempo, da publicação até o aceite, é o nosso tempo de match.
5. **Mostrar a trava.** No Swagger, tentar atribuir o mesmo lote a outra ONG. Volta 409.
   > Se alguém tenta mandar o mesmo lote para outra ONG, o sistema recusa. A trava está no banco, não só na tela.
6. **Entregar.** Marcar coleta e entrega.
7. **Painel muda.** Voltar ao painel e recarregar.
   > kg salvos subiu 12. As refeições estimadas da região da ONG subiram. O mapa de calor mudou. E continua tudo aí depois de recarregar, porque está no banco.
8. **Conferir o livro.** Abrir a aba "Conferir livro da demo".
   > A entrega virou uma linha num livro com hash. Clico em conferir. Tudo certo, nada apagado nem mudado.

Se sobrar tempo: no Swagger, criar um lote com validade de ontem. Volta 422. "Comida vencida nem entra."

### 4. O que é AI e o que é regra (1 min)

> A AI aqui faz uma coisa só: estima a chance de um lote ser descartado. É um modelo do scikit-learn treinado com histórico simulado.
>
> O rótulo de descarte não vem de uma regra de prazo. Se viesse, o modelo só copiaria a regra. O gerador mistura prazo, armazenamento, tipo de comida, peso, hora e demanda da região, com ruído.
>
> Separamos o teste antes de treinar. Comparamos com duas baselines: chutar sempre a classe mais comum, e uma regra só de prazo. O modelo bate as duas. A acurácia é [metrics.json], em [n_test] lotes de teste. Mostramos também a matriz de confusão, porque acurácia sozinha engana.
>
> O resto é regra, e dizemos isso: tipo de comida aceito, capacidade, distância e o bloqueio de vencido. Nenhum modelo decide se comida vencida pode ser doada.

### 5. DevSecOps (1 min)

> Todo PR e todo push na main rodam o workflow "Rede Alimenta": testes, Bandit no código Python, Trivy nas dependências, na configuração e na imagem Docker. Se aparece achado alto ou crítico com correção disponível, o pipeline reprova e não tem deploy.
>
> Um detalhe que a gente levou a sério: em março de 2026, a própria cadeia do Trivy foi atacada. Tags da Action oficial foram trocadas por código que roubava credenciais. Por isso instalamos o Trivy por binário de versão fixa, conferindo o checksum.
>
> O painel mostra a saúde do pipeline e as vulnerabilidades mitigadas. Mitigada quer dizer: estava no primeiro scan e sumiu no atual. Não plantamos falha para mostrar redução.

Mostrar: a execução verde no GitHub, com o mesmo commit que está no ar, e os relatórios como artefato.

### 6. Transparência e fecho (45 s)

> Tudo que vocês viram é demonstração. Doadores, ONGs e lotes são inventados, e o painel diz isso em toda tela. Refeições são estimativa, com fator público da Feeding America.
>
> O livro da demo usa o mesmo método do livro real do PontaPé, mas é outro livro. Nenhuma doação fictícia entra no livro real.
>
> O próximo passo é rodar com uma ONG de verdade. Para isso falta o que está em LIMITES.md, e a gente escreveu tudo lá.

## Plano B: a demo caiu

Decida em 20 segundos. Não tente consertar ao vivo.

| O que falhou | O que fazer |
|---|---|
| URL pública não abre ou demora mais de 1 minuto | Trocar para o `docker compose up` local, já aberto em outra aba |
| Local também falhou, ou não há internet | Tocar a gravação de reserva e narrar por cima com o mesmo roteiro |
| Só o painel caiu, a API responde | Fazer a demo pelo Swagger: criar lote, recomendações, match, deliver, `GET /kpis`, `GET /ledger/verify` |
| Só o banco caiu (Supabase pausado) | Ir para o compose local, que tem Postgres próprio |
| Sem projetor | Mostrar no notebook e ler os números em voz alta |

Frase para a banca:

> A versão no ar não respondeu agora. Vamos mostrar a mesma coisa rodando localmente [ou: na gravação feita hoje com o mesmo commit].

Gravação de reserva:

- Arquivo: [preencher: caminho ou link da gravação].
- Gravada em [preencher: data e hora], commit [preencher].
- Mostra os 8 passos da demo, do lote novo até "Tudo certo" na conferência do livro.
- Duração entre 2 e 3 minutos, sem som. A narração é ao vivo.

## Perguntas prováveis da banca

**1. Os dados são reais?**
Não. Doadores, ONGs, lotes e histórico são simulados e rotulados assim em toda tela. O enunciado aceita dataset simulado. Não tratamos nenhum dado pessoal.

**2. Se o dado é simulado, o que a acurácia prova?**
Prova que o pipeline funciona: split antes do treino, baselines e métricas num teste separado. Não prova desempenho no mundo real. Para isso precisa de histórico de doações de verdade.

**3. O modelo não está só copiando uma regra de prazo?**
Não. O rótulo vem de uma probabilidade que mistura seis fatores, com ruído. E a regra só de prazo é uma das baselines. O modelo precisa vencê-la no teste reservado.

**4. Por que não usaram Hugging Face?**
O enunciado pede scikit-learn ou Hugging Face. Para dados em tabela, scikit-learn é a escolha direta. A análise semântica da descrição do lote com Hugging Face ficou fora deste corte, e está escrito em LIMITES.md.

**5. Como vocês evitam que o mesmo lote vá para duas ONGs?**
Um índice único no banco. Mesmo com duas requisições ao mesmo tempo, a segunda volta 409.

**6. O que acontece com comida vencida?**
É bloqueada por regra fixa: a API volta 422 e o lote nem entra. Nenhum modelo decide isso.

**7. Como calcularam as refeições?**
kg entregues divididos por 0,544 kg por refeição. É o fator da Feeding America, dos Estados Unidos. Por isso a tela diz "estimadas".

**8. Qual vulnerabilidade vocês corrigiram?**
[preencher com o que o scan real mostrou]. Se o primeiro scan veio limpo, a resposta honesta é: o gate está ativo, nenhum achado alto passou, e o painel mostra zero com data e commit. Não inventamos falha para mostrar correção.

Perguntas extras, se houver tempo:

- **Por que o banco está nos Estados Unidos?** O alvo é sa-east-1 (São Paulo). O pooler de lá não respondeu na criação, então o projeto ficou em us-east-1. Com dado simulado isso não pesa. Com dado real, mudaria.
- **E a rota de coleta?** [preencher: pronta em `GET /ngos/{id}/route`, ou fora deste corte].
