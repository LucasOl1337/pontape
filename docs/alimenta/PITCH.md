# Pitch da Rede Alimenta (5 a 7 minutos)

Projeto integrador FIAP Rede Alimenta IA. Roteiro falado, com tempo e quem fala. Troque `[pessoa A]` etc. pelos nomes do grupo.

Rubrica da FIAP: impacto social 30%, qualidade da AI 30%, DevSecOps 20%, engenharia e defesa 20%.

A Rede Alimenta é um sistema real, com o banco de produção vazio até a primeira doação de verdade. A banca vê o fluxo inteiro rodado por **contas de teste do time**, marcadas `is_test=true`. Esses registros não entram nos KPIs públicos nem no livro, e o script de ensaio apaga tudo no fim.

## Antes de começar (10 minutos antes)

- [ ] Abrir o painel https://rede-alimenta-painel.onrender.com e o Swagger https://rede-alimenta-api-u5q4.onrender.com/docs. O Render free dorme após 15 minutos parado e leva cerca de 1 minuto para acordar ([Render](https://render.com/docs/free), acesso em 14/10/2026).
- [ ] Conferir que o painel público mostra zero ou só entregas reais. Nada de seed.
- [ ] Rodar `alimenta/scripts/ensaio.sh` na parte de preparo: cria a conta de doador de teste e a conta de ONG de teste, aprovada pelo operador, todas `is_test=true`. [a confirmar: nome e opções do script]
- [ ] Ter os e-mails das contas de teste abertos. O código de login chega pelo SMTP padrão do Supabase, que só envia a membros do time e tem limite de cerca de 2 por hora. Entrar nas contas **antes** da banca e manter as sessões abertas.
- [ ] Deixar abertas quatro abas: painel como doador, painel como ONG, Swagger e a última execução verde do workflow "Rede Alimenta".
- [ ] Ter a gravação de reserva fora da internet e o `docker compose up` local como segunda reserva.
- [ ] Anotar o commit no ar e conferir que é o mesmo da execução verde.

## Roteiro

| Bloco | Tempo | Quem fala | O que mostrar |
|---|---|---|---|
| 1. PontaPé | 0:00 a 0:40 | [pessoa A] | Site pontape.org, passo 4 "Comida e roupa" |
| 2. O problema da comida | 0:40 a 1:20 | [pessoa A] | Um slide ou nada |
| 3. O sistema rodando | 1:20 a 4:00 | [pessoa B] | Painel do doador, painel da ONG, Swagger |
| 4. O que é AI e o que é regra | 4:00 a 5:00 | [pessoa C] | Aba do modelo no painel |
| 5. DevSecOps e dados | 5:00 a 6:00 | [pessoa D] | GitHub Actions, relatórios, STRIDE |
| 6. Transparência e fecho | 6:00 a 6:45 | [pessoa A] | "Conferir livro" e painel público |

### 1. PontaPé (40 s)

> O PontaPé é um projeto open source sem fins lucrativos. Ele quer achar quem está em situação difícil, dar o básico e ajudar a pessoa a chegar a um trabalho. E mostra em público cada ação, num livro que qualquer um confere.
>
> O passo 4 da escada é "Comida e roupa". A Rede Alimenta é a parte da comida. É um sistema de verdade: recebe doação de mercado, padaria e restaurante, e distribui para ONGs aprovadas.

### 2. O problema da comida (40 s)

> Comida boa vai para o lixo porque ninguém decide a tempo para onde ela vai. Do outro lado, tem ONG que precisa dessa comida e não fica sabendo.
>
> O problema é o tempo. Um lote de pão dura um dia. Quem doa precisa saber, rápido, qual ONG aceita pão, tem espaço hoje e está perto. E a ONG precisa receber o aviso a tempo de buscar.

### 3. O sistema rodando (2 min 40 s)

Fale enquanto clica. As duas contas são de teste do time e o painel mostra a marca "teste" nelas.

1. **Publicar o lote.** Na aba do doador de teste, publicar 12 kg de pão, vencendo hoje à noite, com janela de retirada até as 20h. Marcar a caixa de validade e conservação.
   > Sou uma padaria. Publiquei 12 kg de pão que vencem hoje. Confirmei que está na validade e bem guardado, como a Lei 14.016 pede.
2. **Ver o risco.** O lote aparece com a probabilidade de descarte e a faixa.
   > O modelo diz que este lote tem risco alto de ir para o lixo. Por isso ele sobe na fila.
3. **A oferta chega.** Trocar para a aba da ONG de teste. A oferta está na caixa, com prazo.
   > Do lado da ONG, a oferta chegou. Ela só chegou porque a ONG foi aprovada pelo operador, aceita padaria, tem espaço hoje e o lote está no raio dela. E tem prazo: se ela não responder, a oferta passa para a próxima ONG.
4. **Aceitar.** A ONG aceita.
   > Aceitei. Esse tempo, da publicação até o aceite, é o nosso tempo de match.
5. **Mostrar a trava.** No Swagger, tentar aceitar o mesmo lote com outra conta. Volta 409 ou 403.
   > Ninguém mais pega este lote. A trava está no banco, não só na tela.
6. **Rota de coleta.** Abrir a rota da ONG.
   > A rota sai da ONG, passa pelo doador mais perto primeiro e volta. É uma heurística simples, e a gente diz isso.
7. **Dupla confirmação.** Doador confirma a retirada. ONG confirma o recebimento.
   > A entrega só conta quando os dois lados confirmam. Um lado sozinho não basta.
8. **O lote fecha.** Mostrar o lote como `delivered` na aba do doador.
   > Fechou. O desfecho fica gravado para treinar o modelo com dado real.

Se sobrar tempo: no Swagger, publicar um lote com validade de ontem. Volta 422. "Comida vencida nem entra."

[a confirmar: telas por papel no painel. Se a tela do operador não ficar pronta, a aprovação da ONG é mostrada pelo Swagger]

### 4. O que é AI e o que é regra (1 min)

> A AI aqui faz uma coisa: estima a chance de um lote ser descartado. É um modelo do scikit-learn.
>
> Ainda não existe histórico real de doações. Por isso o modelo nasceu treinado com dado sintético. É uma partida a frio, e a tela diz isso. Cada lote real grava o desfecho, entregue, vencido ou sem ONG, e quando houver volume o modelo é retreinado com dado de verdade.
>
> No dado sintético, separamos o teste antes de treinar e comparamos com duas baselines: chutar sempre a classe mais comum, e uma regra só de prazo. O modelo acerta 78,9% em 1.200 lotes de teste. A classe mais comum dá 58,1%, e a regra de prazo dá 72,2%. A matriz de confusão mostra que o modelo ainda deixa passar 153 de 503 lotes que seriam descartados.
>
> O resto é regra, e dizemos isso: ONG aprovada, tipo de comida, refrigeração, raio, capacidade, prazo da oferta e o bloqueio de vencido. Quem aprova uma ONG é uma pessoa, não o modelo.

### 5. DevSecOps e dados (1 min)

> Todo PR e todo push na main rodam o workflow "Rede Alimenta": testes, Bandit no código Python, Trivy nas dependências e na imagem Docker. Achado alto ou crítico com correção disponível reprova o pipeline e não tem deploy.
>
> Em março de 2026, a própria cadeia do Trivy foi atacada. Tags da Action oficial foram trocadas por código que roubava credenciais. Por isso instalamos o Trivy por binário de versão fixa, com checksum, e fixamos as outras Actions por SHA.
>
> O sistema guarda dado de organizações, então fizemos a STRIDE das ameaças reais: conta falsa de ONG, doador que publica comida ruim, vazamento de endereço, ONG que segura oferta, sessão roubada e entrega falsa no livro. O endereço nunca sai em rota pública. O login é por código no e-mail, sem senha.

Mostrar: a execução verde no GitHub, com o mesmo commit no ar, os relatórios como artefato e a tabela de ameaças principais da [STRIDE.md](STRIDE.md).

### 6. Transparência e fecho (45 s)

> Cada entrega com dupla confirmação vira uma linha num livro com hash, que qualquer pessoa baixa e confere. O nosso ensaio de hoje usou contas de teste, então ele não entra no livro nem nos números públicos. O painel público continua mostrando só o que é real.
>
> O sistema está pronto e fechado. Pela regra do PontaPé, nenhum cadastro de fora entra antes de existir um responsável legal pelos dados. Quando isso existir, a gente abre para a primeira padaria e a primeira ONG.
>
> O que falta está escrito em LIMITES.md.

Mostrar no bloco 6: em produção, o livro só tem entregas reais e pode estar vazio. Para mostrar a conferência, use o livro do `docker compose` local, que nasce do seed de exemplo, rotulado "Exemplo". Baixe, rode `python3 tools/conferir.py livro.json`, troque um `quantity` e rode de novo para ver a linha apontada.

## Plano B: o sistema não respondeu

Decida em 20 segundos. Não tente consertar ao vivo.

| O que falhou | O que fazer |
|---|---|
| URL pública não abre ou demora mais de 1 minuto | Trocar para o `docker compose up` local, já aberto em outra aba |
| O código de login não chegou | Usar as sessões abertas antes. Sem sessão, ir para o compose local com as contas de exemplo |
| Local também falhou, ou não há internet | Tocar a gravação de reserva e narrar por cima com o mesmo roteiro |
| Só o painel caiu, a API responde | Fazer pelo Swagger com o JWT das contas de teste: publicar lote, aceitar oferta, confirmar os dois lados, `GET /kpis`, `GET /ledger/verify` |
| Só o banco caiu (Supabase pausado) | Ir para o compose local, que tem Postgres próprio |
| Sem projetor | Mostrar no notebook e ler os números em voz alta |

Frase para a banca:

> A versão no ar não respondeu agora. Vamos mostrar a mesma coisa rodando localmente [ou: na gravação feita hoje com o mesmo commit].

Gravação de reserva:

- Arquivo: [preencher: caminho ou link da gravação].
- Gravada em [preencher: data e hora], commit [preencher].
- Mostra os 8 passos do bloco 3, da publicação até `delivered`, com contas de teste.
- Duração entre 2 e 3 minutos, sem som. A narração é ao vivo.

Depois da banca: rodar a parte de limpeza do `alimenta/scripts/ensaio.sh` e conferir que os KPIs públicos voltaram ao valor de antes. [a confirmar: limpeza do script e teste que KPI ignora `is_test`]

## Perguntas prováveis da banca

**1. Os dados são reais?**
O sistema é real e o banco de produção começa vazio. O que vocês viram hoje foi feito com contas de teste do time, marcadas `is_test`, fora dos números públicos. Dado sintético só existe em três lugares: o treino inicial do modelo, os testes automáticos e o compose local.

**2. Se o modelo foi treinado com dado sintético, o que a acurácia prova?**
Prova que o pipeline está certo: split antes do treino, baselines e métricas num teste separado. Não prova desempenho com doação real. Para isso o sistema grava o desfecho de cada lote real e retreina quando houver volume. Quem conhecesse a fórmula escondida do gerador acertaria no máximo 79,9%, por causa do ruído. 99% seria sinal de erro.

**3. Como vocês sabem que a ONG existe?**
O CNPJ é conferido na BrasilAPI: precisa estar ativo e ter natureza jurídica de entidade sem fins lucrativos. Mesmo assim, quem aprova é uma pessoa, o operador. Até a aprovação, a ONG não vê nenhuma oferta.

**4. E se o doador mandar comida estragada?**
Lote vencido nem entra: a API volta 422. Em todo lote, o doador confirma que a comida está na validade e conservada. A Lei 14.016/2020 diz que o doador só responde se agir com dolo, e que a responsabilidade dele acaba na primeira entrega à ONG (art. 3º). A ONG pode recusar e confere na retirada.

**5. Por que ainda não tem doador de verdade?**
Pela regra do PontaPé (D012), nenhum dado pessoal é guardado antes de existir um responsável legal por ele. O sistema está pronto e fechado. Abrir é mudar uma variável depois que o termo e o aviso de privacidade forem aprovados.

**6. Como evitam que o mesmo lote vá para duas ONGs?**
Uma oferta por vez, com índice único no banco. Mesmo com duas requisições ao mesmo tempo, a segunda é recusada.

**7. Onde ficam os dados?**
O banco fica em São Paulo, no Supabase sa-east-1. A API roda no Render, na região Virginia, porque o Render não tem região na América do Sul. Então o dado passa pelos Estados Unidos. Está escrito em LIMITES.md, com a lei.

**8. Por que não usaram Hugging Face?**
Para dado em tabela, scikit-learn é a escolha direta. A análise semântica de texto livre ficou fora deste corte: a categoria do lote vem de uma lista.

**9. Como calcularam as refeições?**
kg entregues divididos por 0,544 kg por refeição, fator da Feeding America, dos Estados Unidos. Por isso a tela diz "estimadas".

**10. Qual vulnerabilidade vocês corrigiram?**
11 achados do primeiro scan sumiram do atual, por identificador. Um deles é o `DS-0013` do Trivy no Dockerfile. Seis são CVEs do `pip` na imagem. Os números estão em `alimenta/seguranca/resumo.json`, com os commits.
