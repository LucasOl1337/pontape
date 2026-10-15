# Pitch da Rede Alimenta (5 a 7 minutos)

Projeto integrador FIAP Rede Alimenta IA. Roteiro falado, com tempo e quem fala. Troque `[pessoa A]` etc. pelos nomes do grupo.

Rubrica da FIAP: impacto social 30%, qualidade da AI 30%, DevSecOps 20%, engenharia e defesa 20%. Cada bloco abaixo diz qual critério ele cobre.

A Rede Alimenta é um sistema real. O banco de produção só conta doação de verdade e está em zero até a primeira, e o painel diz isso. O cenário com números grandes é **simulado e marcado**. A demonstração usa o **modo exemplo** do site, que não envia nada.

## Antes de começar (15 minutos antes)

- [ ] Acordar a API: abrir https://rede-alimenta-api-u5q4.onrender.com/health. O Render free dorme após 15 minutos parado e leva cerca de 1 minuto para acordar.
- [ ] Deixar abertas cinco abas:
  1. https://pontape.org (ou a prévia https://pontape-proposta.lucasplays2000.workers.dev se a banca for ver a versão nova)
  2. `/alimenta/doar/?exemplo=1` no mesmo site
  3. `/alimenta/painel/` no mesmo site
  4. Swagger: https://rede-alimenta-api-u5q4.onrender.com/docs
  5. Última execução verde do workflow "Rede Alimenta": https://github.com/LucasOl1337/pontape/actions/workflows/alimenta.yml
- [ ] Recarregar o painel e conferir que o bloco "Impacto real" saiu de "…" para números (zero é o esperado).
- [ ] Ter a gravação de reserva fora da internet e o `docker compose up` local como segunda reserva.

## Roteiro

| Bloco | Tempo | Quem fala | O que mostrar | Critério |
|---|---|---|---|---|
| 1. O problema | 0:00 a 0:45 | [pessoa A] | Página inicial, porta "Tenho comida sobrando" | Impacto social |
| 2. O sistema rodando | 0:45 a 3:00 | [pessoa B] | Doar comida em modo exemplo | Impacto, engenharia |
| 3. A AI e como medimos | 3:00 a 4:15 | [pessoa C] | Painel: Qualidade da AI e Cenário simulado | Qualidade da AI |
| 4. DevSecOps | 4:15 a 5:30 | [pessoa D] | Painel: Segurança; GitHub Actions; Swagger | DevSecOps |
| 5. Transparência e fecho | 5:30 a 6:30 | [pessoa A] | Painel: Impacto real (zero honesto); livro | Impacto, defesa |

### 1. O problema (45 s)

> Comida boa vai para o lixo enquanto tem gente passando fome. No nosso cenário simulado de São Paulo, 42% dos lotes acabam descartados. Refeição pronta é a pior: 77%.
>
> O problema não é falta de comida, é tempo e informação. Quem tem comida sobrando não sabe quem aceita aquele tipo de comida, onde e em que horário. A Rede Alimenta resolve isso.
>
> Ela faz parte do PontaPé, um projeto open source sem fins lucrativos, que mostra em público tudo o que faz.

### 2. O sistema rodando (2 min 15 s)

Na aba `/alimenta/doar/?exemplo=1`. A faixa amarela "Exemplo" fica visível o tempo todo.

1. **Dizer o que tem.** Escolher pães, empresa, 12,5 kg, validade amanhã, cidade Osasco. "Ver quem recebe".
   > Sou uma padaria em Osasco com 12 kilos de pão que vencem amanhã. Não preciso de conta pra isso.
2. **Ver quem recebe.** A lista mostra só quem aceita pão em Osasco, com endereço, horário e a fonte pública de cada informação.
   > O sistema filtra por regra quem aceita esse tipo de comida na minha cidade. Cada distribuidor tem a fonte pública: nada é inventado.
3. **Escolher e ver o passo a passo.** Escolher o primeiro. Mostrar "Pronto": mapa, contato, "precisa agendar?".
4. **Registrar.** Mostrar que no registro real a AI lê as páginas públicas de cada candidato e ordena, citando a fonte.
   > Quando a doação é registrada, a AI lê as páginas oficiais de cada distribuidor e explica por que ele é uma boa escolha, sempre com o link. Se a AI responde algo fora das fontes, a resposta inteira é descartada e vale a regra.
5. **Lista completa.** Abrir "Onde doar": 30 distribuidores com fonte pública, filtro por cidade.

Se sobrar tempo, no Swagger: `POST /donations` com validade de ontem volta 422. "Comida vencida nem entra."

### 3. A AI e como medimos (1 min 15 s)

Aba do painel, bloco "Qualidade da AI".

> São duas AIs. A primeira é um modelo nosso, local, do scikit-learn: ele estima a chance de um lote ser descartado, pra quem tem mais risco sair primeiro. A segunda lê as páginas públicas dos distribuidores e recomenda, sempre citando a fonte.
>
> O modelo foi treinado com 4.800 lotes simulados e testado em outros 1.200 que ele nunca viu. Acerta 78,9%. Chutar sempre "não descarta" dá 58,1%, e uma regra só de prazo dá 72,2%. Então o modelo ganha da regra.
>
> Acurácia sozinha engana, então mostramos a matriz: ele pega 350 de 503 descartes reais e ainda deixa passar 153. A gente diz isso.
>
> Descer para "Cenário de São Paulo": o mapa de calor mostra a zona Oeste com o maior descarte, 54%. E os alertas de validade: lotes que vencem em menos de 48 horas, ordenados pelo risco do modelo.

### 4. DevSecOps (1 min 15 s)

Painel, bloco "Segurança e entrega contínua". Depois a aba do GitHub Actions.

> Todo push roda o pipeline: testes, retreino do modelo conferido, Bandit no código Python e Trivy nas dependências, no Dockerfile e na imagem. Achado alto ou crítico com correção disponível reprova o pipeline e não tem deploy.
>
> Desde o primeiro scan, corrigimos 11 vulnerabilidades, por identificador. Seis eram CVEs do pip na imagem. Hoje temos zero achados novos.
>
> Em março de 2026, a própria Action do Trivy foi atacada. Por isso instalamos o Trivy por binário com checksum e fixamos as Actions por SHA.
>
> E fizemos a análise de ameaças STRIDE: vazamento de dado de quem doa, comida vencida, doação falsa no livro, abuso da AI. A cidade de quem doa nunca aparece em dado público.

Mostrar a execução verde e o Swagger da API FastAPI no Render, com o banco no Supabase.

### 5. Transparência e fecho (1 min)

Voltar ao topo do painel.

> Separamos três tipos de número, com selo: real, modelo e simulado. O impacto real está em zero, porque nenhuma doação de verdade foi registrada ainda. Preferimos mostrar zero a inflar número.
>
> Cada doação real vira uma linha num livro público com hash, que qualquer pessoa baixa e confere.
>
> A lista de onde doar já funciona hoje, sem conta. O registro abre para todo mundo quando o envio de e-mail próprio estiver ligado. O que falta está escrito em LIMITES.md.

## Plano B: o sistema não respondeu

Decida em 20 segundos. Não tente consertar ao vivo.

| O que falhou | O que fazer |
|---|---|
| Painel mostra "O servidor não respondeu" | A API está acordando. Seguir com os blocos de AI e segurança, que não dependem dela, e recarregar no fim |
| Site não abre | Abrir a prévia (ou o oficial, o que estiver de pé) |
| Swagger não abre | Mostrar `alimenta/api/main.py` e os testes no GitHub |
| Sem internet | `docker compose up` local, ou a gravação de reserva narrada ao vivo |
| Sem projetor | Mostrar no notebook e ler os números em voz alta |

Frase para a banca:

> A versão no ar não respondeu agora. Vamos mostrar a mesma coisa rodando localmente [ou: na gravação feita hoje com o mesmo commit].

## Perguntas prováveis da banca

**1. Os dados são reais?**
O sistema é real. O impacto real começa em zero e só conta doação de verdade; contas de teste ficam fora. Dado simulado existe em três lugares, sempre marcado: o treino do modelo, o cenário do painel e os testes.

**2. Se o modelo foi treinado com dado simulado, o que a acurácia prova?**
Prova que o método está certo: teste separado antes do treino, comparação com duas regras simples e matriz de confusão. Não prova desempenho com doação real. Cada doação real grava o desfecho, e o modelo é retreinado quando houver volume. O gerador tem ruído de propósito: quem conhecesse a fórmula escondida acertaria no máximo 79,9%. 99% seria sinal de erro.

**3. O que é AI e o que é regra?**
AI: o modelo de risco de descarte e a recomendação que lê as páginas públicas. Regra: cidade, tipo de comida, quem recebe de quem, o bloqueio de vencido e a validação que descarta qualquer resposta da AI fora das fontes.

**4. E se o doador mandar comida estragada?**
Validade no passado volta 422. O doador aceita o termo de doação. A Lei 14.016/2020 diz que o doador só responde se agir com dolo. O distribuidor confere na entrega.

**5. Por que não tem ONG cadastrada na plataforma?**
Escolhemos começar só com distribuidores públicos que já existem, como bancos de alimentos e cozinhas solidárias, cada um com fonte. Assim não guardamos dado de ONG antes de ter um responsável legal, e a lista funciona desde o primeiro dia.

**6. Como calcularam o tempo de match?**
Minutos entre registrar a doação e escolher o destino, média das doações reais. Está em `GET /kpis` e no painel.

**7. Como calcularam as refeições?**
kg entregues ÷ 0,544 kg por refeição, fator da Feeding America. Por isso a tela diz "estimadas".

**8. Onde ficam os dados?**
Banco no Supabase em São Paulo. A API roda no Render, na Virginia, porque o Render não tem região na América do Sul. Está em LIMITES.md.

**9. Qual vulnerabilidade vocês corrigiram?**
11 achados do primeiro scan sumiram do atual, por identificador. Um é o `DS-0013` do Trivy no Dockerfile. Seis são CVEs do `pip` na imagem. Os números estão em `alimenta/seguranca/resumo.json` e no painel.

**10. Por que não Streamlit?**
A interface é o próprio site, mais leve no celular e acessível. O painel tem os mesmos indicadores que um dashboard Streamlit teria: impacto, acurácia, mapa de calor, alertas e saúde do pipeline.
