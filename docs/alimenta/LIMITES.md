# Limites da Rede Alimenta

> **DEMONSTRAÇÃO · dados simulados.** Esta página diz o que a Rede Alimenta não faz, o que é estimado e o que ainda falta. Vale para o projeto integrador FIAP Rede Alimenta IA e para a página do módulo no PontaPé.

## O que é simulado

| Item | Como nasce |
|---|---|
| Doadores | Cerca de 15, com nome inventado ("Doador Exemplo 03") |
| ONGs | Cerca de 20, com nome inventado ("ONG Exemplo 07"), tipos aceitos, capacidade e janela de coleta sorteados |
| Coordenadas | Pontos sorteados dentro da caixa de 5 macrorregiões de São Paulo. Nunca endereço real |
| Lotes do seed | 5 categorias: hortifrúti, padaria, laticínios, refeição pronta e secos |
| Histórico de treino | Cerca de 6.000 lotes em `alimenta/data/lots_history.csv` |
| Rótulo `discarded` | Sorteado de uma probabilidade escondida, com ruído. O processo está em `alimenta/data/DICIONARIO.md` |
| 30 dias de histórico operacional | Lotes, matches e entregas do seed, para o painel não nascer vazio |
| Eventos do livro da demo | Cada entrega simulada vira um evento em `pontape-alimenta-demo` |

O gerador usa seed fixa `20261015`. Rodar de novo gera os mesmos dados.

Nenhum parâmetro do gerador foi calibrado com fonte pública (FAO, IBGE, Embrapa). Os valores são escolhas do time, escritas no dicionário. Calibrar fica para depois.

Consequência: a acurácia do modelo mostra que o pipeline de treino e avaliação está certo. Ela não mostra quanto o modelo acertaria com doações reais.

## O que é estimativa

**Refeições.** O painel divide os kg entregues por 0,544 kg. O número vem da Feeding America: "each meal is roughly 1.2 pounds" ([About our claims](https://www.feedingamerica.org/ways-to-give/faq/about-our-claims), acesso em 14/10/2026). 1,2 libra dá cerca de 0,544 kg.

Esse fator é dos Estados Unidos e mede comida de banco de alimentos, não refeição servida no Brasil. Por isso o painel sempre escreve "refeições estimadas". Trocar por uma fonte brasileira é mudar uma constante em `alimenta/core/kpis.py`.

**kg salvos.** São kg de lotes simulados com entrega simulada. Não é comida real que deixou de ir para o lixo. O impacto social real da Rede Alimenta hoje é zero, e o painel não diz o contrário.

## O que é regra e não modelo

O modelo de AI faz uma coisa: estima a probabilidade de descarte de um lote. Todo o resto é regra fixa ou cálculo.

| Parte | Tipo | Onde |
|---|---|---|
| Probabilidade de descarte | Modelo (scikit-learn) | `alimenta/model/` |
| Faixa baixo, médio, alto | Limiar fixo sobre a probabilidade | `alimenta/model/predict.py` |
| Lote vencido bloqueado | Regra fixa | `alimenta/core/matching.py` |
| Tipo de comida aceito pela ONG | Regra fixa | `alimenta/core/matching.py` |
| Capacidade da ONG no dia | Regra fixa | `alimenta/core/matching.py` |
| Distância | Cálculo (haversine, linha reta) | `alimenta/core/matching.py` |
| Ordem das ONGs recomendadas | Pontos somados das regras acima, com urgência | `alimenta/core/matching.py` |
| Alertas de validade crítica | Regra sobre horas até vencer e faixa de risco | Painel |

A previsão não é certificado sanitário. Ela não diz se a comida está boa para comer. Quem decide isso é a ONG e a regra sanitária.

A distância é em linha reta, não por rua. Não considera trânsito.

## O que não está pronto

| Item do enunciado | Estado |
|---|---|
| Otimização de rotas de coleta urbana | [preencher: pronta em `GET /ngos/{id}/route`, por vizinho mais próximo, ou fora deste corte]. Mesmo pronta, é uma heurística simples, não otimização completa |
| Análise semântica de validade e tipo com Hugging Face | Fora deste corte. A categoria do lote é escolhida numa lista, não lida de texto livre |
| Calibração do dataset com fonte pública | Fora deste corte |
| Assinatura e carimbo público do livro da demo | Fora deste corte. O livro tem hash encadeado; o livro real do PontaPé tem também assinatura e carimbo (D040) |
| Papel de banco próprio com permissão mínima | Na fila. Hoje a API usa o papel padrão do projeto Supabase |
| Migrações versionadas (Alembic) | Na fila. Hoje as tabelas nascem com `create_all` |
| Login por pessoa | Não existe. Um token único libera a escrita |
| Limite de requisições por IP | Não existe |
| Actions de terceiros fixadas por SHA | Na fila. O Trivy já é por binário fixo com checksum |

## Hospedagem gratuita

**Render free dorme.** Um web service free para depois de 15 minutos sem tráfego. A próxima requisição acorda o serviço em cerca de 1 minuto ([Render, plano free](https://render.com/docs/free), acesso em 14/10/2026). São dois serviços (API e painel), então os dois podem estar dormindo. Abra as duas URLs alguns minutos antes da banca.

**Supabase free pausa.** Projeto free é pausado depois de 1 semana sem atividade ([Supabase, Pricing](https://supabase.com/pricing), acesso em 14/10/2026). O plano free também não tem backup automático ([ARQUITETURA.md](../arquitetura/ARQUITETURA.md) §2). Se pausar, é preciso reativar pelo painel do Supabase. Quem faz isso é o regente.

**Região do banco.** O projeto Supabase `rede-alimenta` está em us-east-1. O alvo era sa-east-1 (São Paulo), mas o pooler de sa-east-1 não respondeu na criação. Com dado simulado isso não pesa. Com dado real, mudaria (ver [STRIDE.md](STRIDE.md), LGPD).

## O que a Rede Alimenta não é

- Não é a operação real do passo 4 do PontaPé. O passo 4 continua "Ainda não começou".
- Não recebe doação de dinheiro nem de comida de verdade.
- Não escreve no livro real de pontape.org. A regra "doação fictícia não entra no livro real" está na D040 ([DECISOES.md](../DECISOES.md)).
- Não aponta nenhuma ONG real.
