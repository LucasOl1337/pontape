# Diário · F02 Engenharia base

## 2026-09-22 · Marco 1: escopo e delegação

- Lidos AGENTS.md, BRIEF F02/F04, PRD, QUADRO e DECISOES no worktree `fino`, branch `fino/f02-base`, inicialmente limpo.
- Escopo autorizado: somente etapa 1, `docs/arquitetura/ARQUITETURA.md`. Etapa 2 aguarda OK explícito do Regente.
- F04 briefada pelo Maestri ao `SubAgente-Trabalho-Pesado-Facil-MaodeobraDevin`, worktree `devin`, branch `devin/f04-voz`. Pedido inclui fontes primárias, cálculo de custo, privacidade/retenção, limites jurídicos e fallback humano. Reporta a EngenheiroFino para revisão de PR antes da consolidação.
- Pesquisa oficial de stack e LGPD iniciada. Nenhuma conta, chave, API paga ou deploy.
- Próximo passo: desenhar monólito modular, livro-caixa verificável e separação de dados privados/públicos; revisar F04 quando chegar.

## Decisões propostas

Propostas não equivalem a aprovação e não alteram DECISOES.md.

| Tema | Proposta | Estado |
|---|---|---|
| Stack web | Astro estático + TypeScript + ilhas React | Direção confirmada pelo Regente; etapa 2 ainda aguarda OK |
| Hospedagem | Cloudflare Pages para assets; F1 sem Supabase | Direção confirmada; sem criação de conta/deploy |
| Banco/backend | PostgreSQL/Supabase em São Paulo, Auth/Storage, Edge Functions por turno | Proposto; verificar contratos, custo e recuperação antes de dados reais |
| Tempo real | Realtime só da projeção pública na F2, cursor/HTTP para recuperar lacunas | Proposto |
| Licença | Apache-2.0 para código | Convergente com F03 integrada; pendente Lucas, não aplicada |
| Livro-caixa | Eventos append-only, JCS/SHA-256, conciliação e snapshot assinado em repo irmão + cópia independente | Proposto; custódia e publicação dependem de decisão |
| Seleção | IA resume/recomenda, pessoa decide com justificativa e recurso | Pendente Lucas |
| Privacidade | Controlador e inventário de bases/finalidades/operadores/prazos antes de tratamento real | Pendente Lucas/jurídico via Regente |
| Doação | Titularidade e estrutura aprovadas antes de habilitar pagamentos | Pendente Lucas/F03 |
| Voz | Android assistido, gateway por turnos, mini-transcribe/mini/tts-1 como referência; US$ 0,096 nas premissas | Consolidado da F04 PR #3; contratação e piloto pendentes |

## 2026-09-22 · Marco 2: desenho inicial escrito

- ARQUITETURA.md cobre M1–M9, stack e orçamento por fase, entidades e exposição, fluxo financeiro, privacidade e desenho provisório de voz.
- Proposta de stack: Astro + React/TypeScript, Cloudflare Pages estático, Supabase/PostgreSQL em São Paulo, Edge Functions por turno e Realtime somente para tabela pública. SQL/migrations versionados, ambiente local sem contas reais.
- Proposta de licença: Apache-2.0, alinhável à F03 e sujeita ao Lucas. Não aplicada.
- Livro-caixa distingue fatos privados de payload público permitido; idempotência dupla, conciliação, retificações, cadeia JCS/SHA-256 serializada, espelho sob custódia independente. Hash sozinho não comprova veracidade ou ausência de omissão.
- Propostas de operação: decisão humana da seleção; consentimentos por finalidade; dados mínimos; zero áudio persistente por padrão; Free só para fundação, orçamento de continuidade antes de dinheiro/dados reais.
- Regente recebeu atualização pelo Maestri com stack e pendências. Nenhum arquivo reservado foi alterado.
- Próximo passo: validar fonte ANPD, revisar consistência e incorporar F04 após review da PR. Não iniciar etapa 2.

## 2026-09-22 · Marco 3: orientação do Regente incorporada

- Regente confirmou Astro/ilhas/Pages como direção, sujeita à revisão final; não autorizou etapa 2. F1 deve subir sem Supabase, com zero estático honesto enquanto não há doações; Realtime só entra na F2. Incorporado.
- Documentado custo de saída do Free e pausa por inatividade. Avaliado espelho em repo irmão público: útil para snapshots verificáveis, mas Git não impede reescrita por admin; manter custódia independente e assinatura. Abertura do repo depende do Lucas.
- Projeção pública tem whitelist no schema e nenhum dado pessoal. Esclarecido que apelido público é de movimentação; pseudônimo de candidato continua pessoal e privado.
- Pendências de seleção humana, licença, controlador/base legal, titularidade da conta seguem ao Regente. Ele informou que incluirá controlador/base legal no PRD.
- Fonte oficial ANPD localizada. Próximo passo continua revisão da F04 e fechamento documental.

## 2026-09-22 · Marco 4: primeira revisão F04

- PR F04 aberta: https://github.com/LucasOl1337/VidaNova/pull/1. Revisão inicial registrada como comentário de review; não houve merge.
- Solicitadas correções de: retenção por endpoint; residência sem inferência indevida; preços com fonte primária; minutos e fórmulas de custo; ausência de gravação persistente por padrão no celular; limites jurídicos do consentimento; benchmark sem generalização; licença de pesos e distinção entre IVR e IA.
- Arquitetura mantém gateway por turnos curtos. Framework de voz com worker persistente será alternativa futura, não acoplamento obrigatório às Edge Functions.
- Fonte OpenAI oficial conferida: /audio/transcriptions sem retenção de abuso/aplicação na tabela; /audio/speech com até 30 dias de abuso. Não generalizar por provedor.
- Próximo passo: aguardar SHA corrigido do Devin, revisar delta e consolidar custo/modelos com limites na arquitetura. Etapa 2 segue bloqueada.

## 2026-09-22 · Marco 5: recuperação da delegação

- Devin salvou revisão 2 com as principais correções, mas o provedor falhou três vezes com `Protocol error (unimplemented)`. PR #1 ainda aponta para `4c994069415c1730ab4e62ea684500a16d81a314`; há correções não commitadas no worktree dele.
- Arquivos do Devin consultados somente em leitura. Não houve commit, checkout, stash, reset nem edição naquele worktree.
- Segunda revisão pediu cinco ajustes finais: retenção de 1 h pertence ao endpoint de chat com áudio; residência por endpoint/modelo; cenário de custo Realtime não é piso universal; Whisper não tem o mesmo streaming; retirar afirmação sem fonte sobre Edge TTS; decisão humana segue proposta do PRD.
- Regente consultado via Maestri: proposta de recuperar relatório revisado no próprio worktree `fino`, concluir ajustes e incluir F04 na PR F02, deixando a substituição/fechamento da PR #1 para ele. Aguardando orientação dessa contingência.
- Síntese na ARQUITETURA já calcula US$ 0,096 por sessão nas premissas explícitas (STT 0,030 + LLM 0,012 + TTS-1 0,054), sem transferir custo por token do mini-tts para minuto como fato.
- Próximo passo: receber orientação, fixar versão de F04 consolidada, commit/push/PR F02 e report final. Etapa 2 continua sem autorização.


## 2026-09-22 · Marco 6: F04 recuperada e consolidada

- Regente autorizou assumir F04 em novo worktree próprio `fino-f04`, branch `fino/f04-voz`, e abrir PR separada. Ele fechará/substituirá a #1; proibido mexer no worktree do Devin, que foi preservado.
- F04 corrigida, commit `6444fb373ca4c84740f300191837adc7b9398f85`, PR https://github.com/LucasOl1337/VidaNova/pull/3. Registro da falha, três traces e hora de constatação está no DIARIO da F04.
- ARQUITETURA seção 5.2 consolida modelo, dispositivo, gateway, orçamento reproduzível, retenção por endpoint e critérios de ensaio. Sem naturalidade/latência de campo vendidas como fato; sem armazenamento offline persistente por padrão.
- Relida evolução de PRD na main (Coração da ideia e controlador) e alinhada proposta Apache-2.0 à F03 integrada na PR #2. Nenhum arquivo reservado foi alterado.
- Validação documental: seis itens do brief cobertos; referências e links locais conferidos; soma US$ 0,096 conferida; diff sem erros de espaço. Código/testes/build não se aplicam à etapa 1; cenários futuros estão explicitamente separados.
- Próximo passo: commit/push/PR F02 própria, report das duas PRs ao Regente e aguardar OK. Etapa 2 não iniciada.
