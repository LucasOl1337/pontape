# Decisões

Registro das decisões tomadas. Só o Regente edita; agente propõe no próprio DIARIO. Quem decidiu fica anotado: **Lucas** (produto e irreversível) ou **Regente** (execução, revisável).

| ID | Data | Decisão | Por quê | Quem |
|---|---|---|---|---|
| D001 | 22/09/2026 | Nome provisório **VidaNova** até o Lucas escolher o definitivo | Precisa de um nome pra trabalhar; o definitivo não pode ser genérico | Regente |
| D002 | 22/09/2026 | Repositório `LucasOl1337/VidaNova` nasce **privado** | O projeto é open source, mas abrir é decisão do Lucas depois de nome e licença | Regente |
| D003 | 22/09/2026 | Docs e interface em PT-BR; código em inglês | Público e equipe falam PT-BR; código em inglês facilita contribuidor de fora | Regente |
| D004 | 22/09/2026 | Um worktree por agente em `.worktrees/<crachá>`, entrega por PR, merge do Regente | Vários agentes em paralelo sem pisar um no outro | Regente |
| D005 | 22/09/2026 | Memória do trabalho em arquivo: BRIEF (Regente) e DIARIO (dono) por frente | Pedido do Lucas: execução sequencial que não se perde quando o contexto cresce | Lucas |
| D006 | 22/09/2026 | Stack: Astro + TypeScript com ilhas React, estático no Cloudflare Pages; Supabase/Postgres em São Paulo só a partir da F2 | Home estática e rápida em celular barato, custo zero no começo, fácil pra contribuidor; backend gerenciado quando houver dinheiro e entrevista ([ARQUITETURA §2](arquitetura/ARQUITETURA.md)) | Regente |
| D007 | 22/09/2026 | Site F1 não depende de backend: painel de transparência é snapshot estático com zero honesto até a doação existir | Dá pra lançar sem conta, CNPJ ou banco; nunca mostrar "ao vivo" sem estar | Regente |
| D008 | 22/09/2026 | Direção do piloto de voz: Android do voluntário, pipeline por turnos (STT, LLM, TTS), voluntário presente como fallback; totem fora do piloto | Custo previsível (~US$ 0,10 por entrevista), peças trocáveis, humano sempre junto ([VOZ-E-DISPOSITIVO](pesquisa/VOZ-E-DISPOSITIVO.md)). Motores escolhidos na F09 | Regente |
| D009 | 22/09/2026 | Ordem de execução: plataforma e parte visual primeiro, junto com a transparência total; entrevista, filtros e conexões depois. F06 (oportunidades) fica em espera | Direção do Lucas ([spec 02](fontes/2026-09-22-spec-02.md)) | Lucas |
| D010 | 22/09/2026 | Livro público de **todas as ações** (dinheiro, vida real, candidato, projeto), com criptografia aberta: hash encadeado, verificador aberto, assinatura e carimbo de tempo público propostos na F08. Estático primeiro, nascendo com as ações reais do próprio projeto. Regra: toda ação aparece; quem é a pessoa, não | Direção do Lucas; a regra concilia com dignidade e LGPD (PRD princípios 1, 2 e 4) | Lucas (direção), Regente (desenho) |
| D011 | 22/09/2026 | Propostas P1 a P8 da F01 aprovadas. Na P5, selo público "Precisa de ajuda" e seção chamada "Gargalos" | Honestidade de estado (P1, P4, P6), porta pro candidato que não lê (P2, P3); "Gargalos" é palavra do Lucas | Regente |
| D012 | 22/09/2026 | Nenhuma coleta de dado pessoal (lista de aviso, formulário, e-mail) até existir responsável legal pelos dados (PRD §10, pergunta 9) | Sem controlador definido, guardar contato de alguém é risco sem dono | Regente |
| D013 | 22/09/2026 | No site, a decisão do livro público pode mostrar o título tirado do `DECISOES.md` no build, como conteúdo do site e fora do evento com hash. O "Conferir" prova o evento, não o título | O contrato do livro não tem texto livre (F08); o título ajuda a ler sem abrir brecha no livro | Regente |
| D014 | 22/09/2026 | Uma fonte só pro livro real: o da F08 (EngenheiroFino). O livro do protótipo (`design/prototipo/ledger/`) é só do protótipo; o site em código lê o livro e usa o verificador da F08 | Evitar dois livros "reais" divergindo | Regente |
