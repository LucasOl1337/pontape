# Dicionário de dados · Rede Alimenta

**DEMONSTRAÇÃO · dados simulados.** Nenhum campo vem de pessoa, doador ou ONG real.
Origem: 100% simulado pelo gerador `alimenta/data/generate.py`, seed fixa `20261015`.
Nenhuma fonte pública foi usada para calibrar os parâmetros nesta versão (decisão Q5 da rodada r1); o único número externo é o fator de refeição (abaixo).

Reproduzir, a partir da raiz do repositório:

```bash
uv run --project alimenta python -m alimenta.data.generate          # regrava
uv run --project alimenta python -m alimenta.data.generate --check  # confere os versionados
```

## 1. `lots_history.csv` · histórico rotulado para o modelo (6.000 linhas)

| Campo | Tipo | Unidade / valores | Descrição |
|---|---|---|---|
| `lot_id` | texto | `H00001`… | Identificador do lote histórico simulado |
| `category` | texto | `produce`, `bakery`, `dairy`, `prepared_meal`, `dry_goods` | Hortifrúti, Padaria, Laticínios, Refeição pronta, Secos |
| `storage` | texto | `ambient`, `refrigerated`, `frozen` | Armazenamento no momento da oferta |
| `kg` | decimal | kg | Peso do lote (log-uniforme por categoria) |
| `hours_to_expiry` | decimal | horas | Horas entre a publicação e a validade |
| `published_hour` | inteiro | 6 a 22 | Hora local da publicação |
| `weekday` | inteiro | 0 (seg) a 6 (dom) | Dia da semana da publicação |
| `region` | texto | `center`, `north`, `south`, `east`, `west` | Macrorregião fictícia de São Paulo |
| `region_demand` | decimal | 0 a 1 | Índice simulado de procura das ONGs da região |
| `discarded` | 0/1 | **alvo** | 1 = o lote foi descartado sem aproveitamento |
| `data_origin` | texto | `SIMULADO` | Marca fixa de origem |

### Como o rótulo `discarded` nasce

O rótulo **não** é uma regra de prazo. Para cada lote, o gerador calcula um logito escondido `z` e sorteia `discarded ~ Bernoulli(sigmoide(z + ruído))`, com ruído normal de desvio 0,5:

```
horas_efetivas = hours_to_expiry × prateleira[storage]      (ambiente 1, refrigerado 2, congelado 4)
urgência       = exp(-horas_efetivas / 36)
z = -3,6
  + 6,1 × perecibilidade[category] × urgência                (hortifrúti 1,0; padaria 0,85; laticínios 0,7; refeição 1,2; secos 0,1)
  + 1,6 × ln(1+kg) / ln(251)
  + 1,4 se published_hour ≥ 18
  + 0,9 se fim de semana
  − 2,9 × (region_demand − 0,65)                             (centro 0,7; norte 0,8; sul 0,6; leste 0,9; oeste 0,4)
  + 1,1 se laticínio ou refeição pronta em ambiente
```

Consequências que o modelo precisa aprender e que a regra só de prazo não vê: armazenamento, tamanho do lote, horário, dia e procura da região. O sorteio deixa erro irredutível; acurácia perto de 100% seria sinal de vazamento. Taxa de descarte gerada: 41,9%. Quem conhecesse o logito sem ruído acertaria cerca de 78% (teto prático); ver `alimenta/model/artifacts/metrics.json`.

## 2. `seed/*.json` · seed operacional da demonstração

Todos os arquivos têm `notice` (aviso de dados simulados), `seed` e a lista.

**`donors.json`** (15): `id` (`D01`…), `name` (`Doador Exemplo 01`…), `kind` (`supermarket`, `bakery`, `restaurant`, `street_market`, `distributor`), `region`, `lat`, `lon`.

**`ngos.json`** (20): `id` (`N01`…), `name` (`ONG Exemplo 01`…), `region`, `lat`, `lon`, `accepted_categories` (lista), `daily_capacity_kg` (kg por dia), `window` (janela de recebimento `HH:MM-HH:MM`, só informativa).

**`lots.json`** (150, cerca de 30 dias): `id` (`L0001`…), `donor_id`, `category`, `storage`, `kg`, `published_offset_h` e `expires_offset_h` (horas **relativas ao momento da carga**, para o histórico acompanhar a data da demo), `description`, `outcome` (`null` = em aberto, ou `{ngo_id, confirm_after_min, collect_after_min, deliver_after_min}`).

Coordenadas são sorteadas dentro de uma caixa aproximada de cada macrorregião (`alimenta/core/domain.py`). Nenhuma é endereço real.

## 3. Fator de refeições estimadas

1 refeição ≈ **0,544 kg** (1,2 lb). Fonte: Feeding America, <https://www.feedingamerica.org/ways-to-give/faq/about-our-claims>, acesso em 14/10/2026. É estimativa e aparece sempre como "refeições estimadas". Trocar por fonte brasileira = mudar `KG_PER_MEAL` em `alimenta/core/domain.py`.

## 4. Banco (tabelas)

`donors`, `ngos`, `lots` (com `discard_proba`, `risk_level`, `model_version`, `published_at`, `expires_at`, `status`), `matches` (`status`, `proposed_at`, `confirmed_at`, `collected_at`, `delivered_at`) e `demo_ledger_events` (livro da demo). Detalhe em `alimenta/db/models.py`.
