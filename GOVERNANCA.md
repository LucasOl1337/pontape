# Governança do VidaNova

O projeto aceita ajuda de fora, mas o repositório ainda é privado e **não tem licença definida**. Lucas decidirá quando abrir e licenciar ([PRD, §10](docs/PRD.md#10-perguntas-pro-lucas)).

## Quem faz o quê

- **Lucas** define a direção, escolhe admins, licença e abertura do repositório.
- **Admins** são pessoas designadas por Lucas para aprovar contribuições, moderar e cuidar de incidentes dentro do escopo recebido.
- **Regente** organiza frentes, registra decisões e integra mudanças aprovadas. Não substitui a aprovação humana.
- **Agentes de IA** escrevem, pesquisam e revisam parte do trabalho. A PR deve informar essa participação; toda mudança passa por revisão humana antes de entrar na `main`.
- **Contribuidores** podem propor código, texto, design, pesquisa ou soluções para os [gargalos abertos](docs/contribuicoes/README.md). A proposta pode ser recusada.

## Como uma mudança entra

1. Abra uma issue ou PR com objetivo, motivo e forma de conferir o resultado. Use dados fictícios; nunca publique dados pessoais reais ou segredos.
2. CI e agentes podem apontar problemas. Lucas ou um admin humano confere conteúdo, segurança e adequação à missão e aprova a PR.
3. O Regente integra a mudança aprovada. Reprovação ou ajuste deve ter motivo claro, sem expor dados protegidos.

Contribuir não dá acesso de admin automaticamente. Lucas decide concessão, escopo e revogação; o Regente registra cada decisão em [`docs/DECISOES.md`](docs/DECISOES.md) antes de mudar o acesso. A permissão deve ser a menor necessária.

## Decisões e livro público

Quando uma escolha mudar o rumo do projeto, o Regente anota em [`docs/DECISOES.md`](docs/DECISOES.md) ID, data, decisão, motivo e quem decidiu. Propostas ainda abertas ficam no diário da frente.

A [D010](docs/DECISOES.md) prevê um livro público de **todas as ações**; ele ainda está em construção. Quando ativo, cada ação do projeto, inclusive decisão, acesso e integração, terá evento público mínimo com data, tipo e ID ou link verificável. Incidentes entram após contenção, sem dados pessoais nem detalhes que facilitem abuso. O livro registra **o que foi feito**, nunca a identidade ou a história de quem recebe apoio.
