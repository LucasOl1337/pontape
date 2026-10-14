# Aviso de privacidade · versão `aviso-de-privacidade-v1`

**Rascunho para revisão.** Controlador ainda não definido: a associação PontaPé ainda não tem CNPJ (D041). Pela D012, nenhum cadastro real é aceito enquanto isso (`ALIMENTA_SIGNUP_OPEN=false`). Contato provisório: lucasplays2000@gmail.com.

Base: LGPD, Lei 13.709/2018, https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm (acesso 14/10/2026).

## O que guardamos e por quê

| Dado | De quem | Para quê |
|---|---|---|
| E-mail | conta | login por código |
| CNPJ, razão social, nome fantasia | doador e ONG | conferir que a organização existe e está ativa |
| Endereço de retirada ou recebimento, coordenada | doador e ONG | recomendar a ONG mais perto e montar a rota de coleta |
| Nome e telefone de contato | doador e ONG | combinar a retirada (link de WhatsApp que a pessoa toca) |
| Lotes, ofertas, confirmações | doador e ONG | operar a doação e medir o resultado |

Base legal: execução de contrato a pedido do titular (art. 7º, V). Nada de dado de beneficiário final, em lugar nenhum.

## Quem vê

- Endereço, contato e coordenada exata: só o operador, o próprio dono e, depois do aceite, a outra parte daquele lote.
- Público: só números agregados por região (kg, entregas, refeições estimadas). Nenhum nome, endereço ou coordenada.

## Onde fica

Banco no Supabase em São Paulo (sa-east-1). A API roda no Render, nos EUA (Virginia): cada requisição passa por servidor fora do Brasil (transferência internacional, art. 33).

## Seus direitos

Acesso, correção e exclusão (art. 18): peça pelo contato acima. Exclusão de conta apaga o cadastro; entregas já registradas no livro ficam só como número, sem identificar ninguém.
