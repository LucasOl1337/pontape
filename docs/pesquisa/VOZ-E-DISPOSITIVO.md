# Voz e dispositivo · pesquisa F04

22/09/2026 · autor: devin (SubAgente) · revisor: fino · frente: F04 · base: PRD M4
Revisão final: pesquisa de Devin, revisão e recuperação por EngenheiroFino em `fino/f04-voz`, autorizadas pelo Regente. Substitui a PR #1 após falha do provedor; nenhum dado real coletado.

## Recomendação pro piloto (5 itens)

1. **Dispositivo**: celular Android de entrada do voluntário (preferir aparelho já disponível; reserva estimada de R$ 500–900 se precisar comprar, sujeita a cotação) rodando PWA com botão "falar"; o voluntário está sempre presente e é o fallback humano.
2. **Stack**: pipeline STT + LLM + TTS em turnos curtos sobre o gateway da F02 (Edge Functions); workers persistentes (Pipecat, LiveKit Agents) ficam como alternativa futura se sessão contínua virar requisito.
3. **Sem rede ou falha**: pausar a IA e o voluntário segue a entrevista com o mesmo roteiro. Áudio de WhatsApp e ligação PSTN são canais futuros avaliados à parte, com contrato, custo e consentimento próprios; não são fallback automático nem universais.
4. **Custo**: ~US$ 0,10 por entrevista de 10 min na pipeline (teto de captura), canal à parte; ver conta reproduzível na seção 8.
5. **Limite**: a voz carrega a conversa; a IA transcreve e conduz o roteiro, nunca infere caráter, emoção ou merecimento. Proposta do piloto: decisão final humana, ainda pendente de confirmação do Lucas no PRD §10.

## Convenções deste relatório

- **[PUBLICADO]** preço ou fato com link oficial do provedor ou fonte primária.
- **[ESTIMATIVA]** conta nossa a partir de preço publicado, com premissas explícitas.
- **[PENDENTE]** não verificado em fonte primária nesta rodada; tratar como aberto.
- **Evidência vs. hipótese**: evidência é dado medido ou publicado; hipótese é o que precisa de teste no piloto.
- **Consentimento registrado vs. válido**: registrado é o artefato guardado; válido é o requisito legal. Um não garante o outro (seção 6).
- Câmbio de referência: **US$ 1 ≈ R$ 5,50** [ESTIMATIVA]. Preços em dólar antes de impostos.

## 1. Reconhecimento de fala (STT) em PT-BR

### Opções pagas, preço publicado por minuto de áudio

| Provedor / modelo | Preço publicado | Streaming | Notas |
|---|---|---|---|
| Groq, whisper-large-v3-turbo | US$ 0,04/hora ≈ US$ 0,0007/min | via API de transcrição | modelo aberto hospedado; whisper-large-v3 US$ 0,111/h [1] |
| OpenAI, gpt-4o-mini-transcribe | US$ 0,003/min (tokens: US$ 1,25/M in, US$ 5/M out) | sim | [2] |
| OpenAI, gpt-transcribe | US$ 0,0045/min | sim | [2] |
| Deepgram, Nova-3 | US$ 0,0043/min pagamento por uso, US$ 0,0036/min Growth (monolíngue); US$ 0,0052/US$ 0,0043 (multilíngue); streaming a US$ 0,0077 | sim | pt-BR suportado; marketing do fornecedor cita ruído, crosstalk e far-field, não é ensaio nosso [3] |
| ElevenLabs, Scribe | US$ 0,22/hora batch ≈ US$ 0,0037/min; Scribe realtime US$ 0,39/hora | sim | [4] |
| OpenAI, whisper-1 / gpt-4o-transcribe | US$ 0,006/min | Whisper-1 por arquivo, sem streaming de resposta; GPT-4o Transcribe admite streaming | [2][39] |
| OpenAI, gpt-live-transcribe / gpt-realtime-whisper | US$ 0,017/min | sim, dedicado a streaming | [2] |
| Google Cloud STT v2 | US$ 0,016/min (até 500 mil min/mês); dynamic batch US$ 0,003/min; 60 min/mês grátis na v1 | sim | [5] |
| Azure Speech | 5 horas de áudio/mês grátis documentadas; tarifa paga não legível na página consultada | sim | [6] [PENDENTE: confirmar valor pago] |

### Opções abertas e offline

- **Whisper / faster-whisper / whisper.cpp**: modelo aberto; roda em GPU própria, CPU e até Android. Custo é o da máquina [7].
- **Vosk**: modelo pt-BR pequeno (~45 MB) e grande, roda offline em Android e Linux [8].
- **Wav2Vec2-XLSR-53 afinado em CORAA**: corpus de fala espontânea em PT-BR (290 h, sotaques de MG, Recife e SP). No teste do próprio estudo, WER 24,18% no CORAA e 20,08% no Common Voice pt [9].
- **Distil-Whisper afinado em NURC-SP**: corpus de fala espontânea com sotaque paulistano (239 h); melhor resultado do estudo, WER 24,22% [10].

### Ruído de rua e sotaque: o que é evidência

Os WER acima valem **para os modelos e datasets testados** (CORAA, NURC-SP, Common Voice pt), não pra toda fala em PT-BR. Num comparativo de 2026 com ~14 mil amostras de CORAA e Common Voice pt, Phi-4 Multimodal ficou à frente de Whisper, e Qwen 2.5 Omni atrás, principalmente em falas curtas [11]. Rua com ruído e sotaque fora desses conjuntos é **hipótese**: pergunta curta e dirigida, com a IA confirmando o que entendeu ("você disse que trabalhou como pedreiro, é isso?"), deve manter a entrevista funcional mesmo com WER nessa faixa. Validar no piloto.

## 2. Voz sintética (TTS) em PT-BR

| Provedor / modelo | Preço publicado | Latência / cobertura publicada |
|---|---|---|
| OpenAI tts-1 | US$ 15/M caracteres (tts-1-hd: US$ 30/M) | pt-BR via API de speech [2] |
| OpenAI gpt-4o-mini-tts | US$ 0,60/M tokens de texto in, US$ 12/M tokens de áudio out | cobrança por token de áudio; razão tokens/minuto de fala não publicada na página consultada [PENDENTE: medir em teste] [2] |
| ElevenLabs Multilingual v2/v3 | US$ 0,10/1.000 caracteres | português BR e PT; latência total a medir [4][12] |
| ElevenLabs Flash/Turbo | US$ 0,05/1.000 caracteres | fornecedor anuncia ~75 ms; não inclui o fluxo completo nem rede [4] |
| Google Cloud TTS | Standard/WaveNet US$ 4/M após 4 M caracteres grátis; Neural2 US$ 16/M após 1 M; Chirp 3 HD US$ 30/M, franquia conforme tier | pt-BR [13] |
| AWS Polly | Standard US$ 4/M; Neural US$ 16/M; Generative US$ 30/M; Long-Form US$ 100/M caracteres | pt-BR neural [14] |
| Azure TTS Neural | 500 mil caracteres/mês grátis documentados; tarifa paga [PENDENTE] | vozes pt-BR [6] |

**Abertos, com licença verificada** (código aberto não garante peso livre pra uso comercial):

- **Coqui XTTS v2**: pesos sob Coqui Public Model License, com restrição de uso comercial [15]. ONG sem fins lucrativos não é automaticamente "não comercial" em todas as interpretações: [PENDENTE] avaliação jurídica antes de usar.
- **Kokoro-82M**: Apache-2.0, com vozes pt-BR [16].
- **Piper**: o repositório legado `rhasspy/piper` tem código MIT e está arquivado; verificar licença/model card de cada voz e licença da implementação mantida escolhida antes de adotar [17].

Naturalidade e latência reais em pt-BR não foram medidas nesta pesquisa; comparar por ensaio no piloto, não por marketing.

## 3. Conversa em tempo real

Três desenhos:

**A. Pipeline por turnos curtos** (o que encaixa no gateway da F02): por turno, o app envia o áudio ao endpoint de STT, o texto ao LLM, e a resposta ao TTS. Stateless, simples de hospedar em Edge Functions, cada peça trocável. Interrupção e controle de turno ficam no cliente (VAD local + cancelamento).

**B. Pipeline com worker persistente** (Pipecat, LiveKit Agents, ambos open source): um processo dedicado por sessão cuida de VAD, barge-in e streaming nas três pontas [18][19]. Pode reduzir latência e melhorar interrupção [HIPÓTESE a medir], ao custo de hospedar worker. **Alternativa futura**, não requisito pro piloto.

**C. Fala-pra-fala direta** (OpenAI Realtime, GPT-Live, Gemini Live, Deepgram Voice Agent): sessão contínua por transporte suportado por cada API; avaliar interrupção, latência e esforço de integração por fornecedor. Cobrança por token de áudio com o contexto da sessão recobrado como input a cada turno; o fórum Google AI discute esse efeito no Gemini Live [20]; conferir a regra vigente da API/modelo antes do orçamento. Custo depende do número de turnos e do tamanho do contexto, então **não é comparável por minuto sem fórmula**:

- gpt-realtime: áudio in US$ 32/M tok, out US$ 64/M tok; 1 tok por 100 ms de áudio in e 1 por 50 ms out [2][21]. Cenário de orçamento sem custo de contexto: 600 s × 10 tok/s × US$ 32/M = US$ 0,19 de input + 240 s × 20 tok/s × US$ 64/M = US$ 0,31 de output = **US$ 0,50 + contexto recobrado** [ESTIMATIVA para 600 s capturados + 240 s gerados; não é piso universal de uma conversa de 10 min; total depende de turnos e cache a US$ 0,40/M].
- gpt-realtime-mini: áudio in US$ 10/M, out US$ 20/M [2]. Mesmo cenário recalculado: US$ 0,06 + US$ 0,10 = **US$ 0,16 + contexto** [ESTIMATIVA sem custo de contexto, não piso de toda sessão].
- gpt-live-1: sessão de voz a US$ 0,05/min publicado, cobrado por segundo; modelo e ferramentas à parte [2]. 10 min ≈ **US$ 0,50 + custo do modelo** [ESTIMATIVA].
- Gemini 3.8 Live: equivalentes publicados ~US$ 0,005/min de áudio in e ~US$ 0,018/min out; contexto de áudio recobrado por turno [20][22]. Total por sessão: [PENDENTE] medir.

Não foi medido benchmark comum de latência ou naturalidade nesta pesquisa. Proposta de teste: p95 até 3 s do fim da fala ao início da resposta no desenho A, com cancelamento acessível; comparar B/C no mesmo aparelho, rede e roteiro se A não atender. Esse valor é meta, não desempenho garantido.

Recomendação: desenho A no piloto. Entrevista é Q&A dirigido, o custo por turno é previsível e cada componente pode virar modelo aberto depois. Speech-to-speech entra se o teste mostrar que a latência do pipeline quebra o fluxo.

## 4. Dispositivo

| Opção | Custo | Conectividade | Segurança | Facilidade pra quem nunca usou |
|---|---|---|---|---|
| **Android de entrada do voluntário** | reutilizar aparelho; reserva de R$ 500–900 se necessário [ESTIMATIVA de planejamento, cotar antes da compra]; referências de varejo em [23] | precisa de 4G/Wi-Fi na hora | dado sensível passa pelo aparelho: app/perfil dedicado, bloqueio de tela, política de retenção | o voluntário opera; o candidato só fala |
| **Totem/quiosque em ponto público** | [ESTIMATIVA] R$ 8 mil a 25 mil por ponto; sem fonte publicada confiável | rede fixa ou 4G router; ponto único de falha | vandalismo, fila visível expõe o candidato, áudio ambiente vaza | ninguém ajuda; a interface precisa se virar sozinha |
| **Ligação telefônica comum (PSTN)** | Twilio: receber chamada US$ 0,010/min, ligar pra fixo US$ 0,031/min, pra celular US$ 0,0663/min, número local US$ 4,25/mês [PUBLICADO] [24] | não depende de dados; cobre feature phone | áudio transita por operadora e Twilio; exige contrato, número e consentimento de gravação | funciona em qualquer telefone; **canal futuro**, não fallback automático |
| **Áudio de WhatsApp** | conversa de serviço gratuita [PUBLICADO]; chamada via Business Calling API: iniciada pelo usuário é grátis; iniciada pela empresa cobra por minuto, tabela BRL vigente desde jul/2026 [PUBLICADO] [25] | assíncrono, tolera rede ruim e retomada | depende de o candidato ter celular e WhatsApp (PRD diz que pode não ter); áudio transita pela Meta | estudos com grupos de baixa escolaridade observaram uso de áudio para reduzir leitura [26][27]; não generalizar a toda população; **canal futuro** |

Leitura: celular do voluntário com co-presença é o canal do piloto. Sem rede, **a IA pausa e o humano conduz a entrevista com o mesmo roteiro**; fila ou gravação persistente no aparelho não entra como default por risco de perda do dispositivo com dado sensível (qualquer buffer local é exceção a decidir na F09, com criptografia e apagamento após sincronia). PSTN e WhatsApp ficam como canais futuros com avaliação própria de contrato, custo e consentimento. Totem fora do piloto.

## 5. Visual de apoio pra quem não lê

Evidência de pesquisa brasileira com baixo letramento [26][27]:

- Os estudos citados observaram dificuldades com leitura e uso de áudio/foto nos grupos estudados. Proposta: permitir concluir o fluxo sem ler, mantendo texto como apoio opcional.
- **Um botão só por vez**: microfone grande no centro, estado visível (ouvindo / pensando / falando), sem menu.
- Ícones grandes e familiares (microfone, orelha, check), sempre com feedback sonoro junto; ícone nunca carrega significado sozinho.
- Um rosto animado simples pode ajudar a pessoa a saber quando falar e quando esperar [HIPÓTESE]; avatar realista é desnecessário.
- Alto contraste; WCAG AA já exigida no PRD §7.
- **Hipótese** a testar: indicador visível de que a fala foi captada (onda ou check) reduz abandono. Sem fonte medida.

## 6. Consentimento por voz

A LGPD admite demonstração da manifestação de vontade por outros meios além da escrita. Áudio é uma possível evidência, não validade automática: finalidade, informação prévia, liberdade, ausência de vício e demonstração pelo controlador continuam necessárias (arts. 5º XII, 8º e 9º). Se o fundamento escolhido para dado sensível for consentimento, deve ser específico e destacado; outras hipóteses do art. 11 exigem avaliação própria [28].

**Desenho proposto, pendente jurídico:** aviso local falado antes de enviar conteúdo ao provedor; aceite por finalidade, versão do roteiro, horário, sessão e operador. Validar se gravação curta do aceite ou atesto do voluntário com metadados demonstra suficientemente a manifestação; não reter a entrevista inteira só para provar aceite. Oferecer recusa, parada e atendimento humano, sem perda da ajuda material. Retenção e forma de exclusão precisam ser explicadas sem prometer apagar obrigação legal ou cópia fora do controle.

Exemplo de abertura a testar, a ser completado com responsável, provedor e prazos aprovados: “Você pode conversar com uma pessoa. Se preferir, uma inteligência artificial pode ouvir e ajudar nesta conversa. Você pode parar quando quiser. Isso não muda a ajuda que você pode receber.” Depois explicar quem receberá o áudio e para quê, conferir compreensão e pedir aceite separado. Esse trecho sozinho não é aviso jurídico completo.

Transferência internacional tem mecanismos no art. 33 e na Resolução ANPD 19/2024, incluindo cláusulas-padrão [29]. Quando a via for contratual, contrato não substitui base legal, finalidade e minimização. Provedor, mecanismo e registro exigem validação jurídica antes de dados reais.

## 7. Casos reais de voz com público de baixa escolaridade

- **Mobile Vaani (Gram Vaani, Índia)**: mídia comunitária por **IVR, sem IA de conversa**, em feature phone com 3 teclas e chamada perdida com retorno grátis; 1 milhão+ de usuários em 20 estados e 12 línguas. Evidência de que canal de voz simples alcança quem não lê [30].
- **ARMMAN mMitra / Kilkari (Índia)**: **chamadas de voz gravadas**, gratuitas, pra gestantes; Kilkari alcançou 60 milhões de mulheres e crianças. A IA entra só pra prever abandono do programa (redução de até 32% no grupo de maior risco), não pra conversar nem julgar [31][32].
- **FarmerChat (Digital Green)**: **IA conversacional** por voz, texto ou foto pra agricultores de baixa escolaridade, desenhada pra conexão ruim; 1 milhão+ de usuários, com operação também no Brasil [33].
- **WhatsApp como canal de fato**: dissertação da PUC-Rio com 22 adultos de baixa escolaridade registra o áudio como estratégia principal pra evitar texto [26]; artigo sobre design pra analfabetos funcionais no Brasil confirma o padrão [27].

## 8. Custo por entrevista de 10 minutos (conta reproduzível)

Premissas declaradas: sessão de 10 min; **teto de captura** de 10 min de áudio enviado ao STT (o máximo possível na sessão, não fala efetiva); IA fala ~4 min (~600 palavras, ~3.600 caracteres) [ESTIMATIVA]; ~15 turnos; LLM com ~40 mil tokens de entrada e 10 mil de saída acumulados [ESTIMATIVA]. Câmbio US$ 1 = R$ 5,50.

**Pipeline recomendada (turnos curtos), com tarifas oficiais [2] e volumes assumidos:**

| Componente | Conta | Custo |
|---|---|---|
| STT gpt-4o-mini-transcribe | 10 min × US$ 0,003/min [PUBLICADO] | US$ 0,030 |
| LLM gpt-4o-mini | 40k tok in × US$ 0,15/M + 10k out × US$ 0,60/M [tarifa PUBLICADO; volume ESTIMATIVA] | US$ 0,012 |
| TTS tts-1 | 3.600 caracteres × US$ 15/M [PUBLICADO] | US$ 0,054 |
| **Total** | | **US$ 0,096 ≈ R$ 0,53 no câmbio hipotético** |

Variantes: STT Deepgram Nova-3 (10 × US$ 0,0043 = US$ 0,043 → total ~US$ 0,11); TTS ElevenLabs v3 (3.600 × US$ 0,10/1k = US$ 0,36 → total ~US$ 0,40). gpt-4o-mini-tts é cobrado por token de áudio sem razão tokens/minuto publicada: não entra no orçamento reproduzível, medir em teste.

**Speech-to-speech**: cenários calculados na seção 3 (US$ 0,16 a 0,50 + contexto recobrado, ou US$ 0,05/min no gpt-live-1). Não comparáveis por minuto sem medir o contexto por turno.

**Canal, à parte**: PSTN inbound +US$ 0,10/entrevista + US$ 4,25/mês de número; PSTN outbound pra celular +US$ 0,66; WhatsApp conversa de serviço +US$ 0 [PUBLICADO] [24][25]. Plano de dados do voluntário fora da conta.

Referência de planejamento: **US$ 0,096** na pipeline, sem ser teto garantido de fatura. Tokens, caracteres, retries, impostos, gateway, aparelho e canal alteram o total. Câmbio R$ 5,50 é cenário assumido, não cotação verificada. Medir custo real antes de fixar orçamento.

## 9. Privacidade, retenção e região

Matriz do que está documentado por endpoint/modelo. Região de nuvem existir não prova que inferência ou backup ficam nela; onde não verificado, **pendente**.

| Provedor | Treina com dados da API? | Retenção documentada | Região documentada |
|---|---|---|---|
| OpenAI | não, desde 2023 [34] | por endpoint: `/v1/audio/transcriptions` e `/v1/audio/translations` sem retenção de monitoramento; `/v1/audio/speech` e `/v1/realtime` com logs de abuso até 30 dias; não extrapolar retenção de outros endpoints para esses serviços; ZDR elegível por endpoint mediante aprovação [34][35] | regiões e distinção armazenamento/inferência variam por modelo/endpoint e elegibilidade; Brasil não aparece na lista consultada. Confirmar combinação contratada [34][35] |
| Deepgram | amostra de áudio pode ser retida pra treino, com opt-out via MIP [37] | self-hosted: não persiste áudio nem transcrição além da requisição; só licença e metadado de uso [38] | processamento em US por padrão; endpoints `api.eu.deepgram.com` e `api.au.deepgram.com`; self-hosted na nossa infra [37][38] |
| Google Cloud STT/TTS | [PENDENTE por serviço] | [PENDENTE] | região São Paulo existe na plataforma; cobertura do serviço específico e local de backup não verificados [PENDENTE] |
| Azure Speech | [PENDENTE] | [PENDENTE] | região Brazil South existe; cobertura por serviço não verificada [PENDENTE] |
| AWS Polly/Transcribe | [PENDENTE] | [PENDENTE] | região sa-east-1 existe; cobertura por serviço não verificada [PENDENTE] |
| ElevenLabs | [PENDENTE por plano] | [PENDENTE] | [PENDENTE] |
| Meta/WhatsApp Cloud API | canal, não motor de IA; áudio transita pela Meta | política Meta [PENDENTE detalhe] | global [PENDENTE] |
| Twilio | canal; gravações ficam na conta do cliente | [PENDENTE por produto] | números BR via operadoras locais; edge São Paulo não verificado [PENDENTE] [24] |

## 10. Conexão ruim e fallback humano

- **PWA em turnos curtos**: cada turno é uma chamada HTTP; se a rede cai no meio, o turno falha de forma explícita e o voluntário assume. Não há sessão persistente a perder.
- **Regra do piloto**: sem rede ou duas falhas seguidas de STT, **a IA pausa e o voluntário conduz a entrevista com o mesmo roteiro**, registrando o desfecho. O humano não é contingência remota, está presente.
- **WhatsApp áudio e PSTN**: canais futuros tolerantes a rede ruim (assíncrono / sem dados), mas exigem contrato, custo e consentimento avaliados à parte, e WhatsApp pressupõe o candidato ter celular.
- **STT/TTS offline no aparelho** (whisper.cpp, Vosk, Piper): tecnicamente possível em Android de entrada, qualidade e memória a medir [HIPÓTESE]. Sem recomendação de fila persistente local por risco de perda do aparelho com dado sensível.

## 11. Limite duro: a IA não julga a pessoa

Instrução do revisor, coerente com os princípios 2 e 5 do PRD: **a voz carrega a conversa, não vira prova de caráter**. Nada de análise de estresse, emoção ou "sinceridade" pela voz. A IA transcreve, organiza e recomenda sobre o que a pessoa **disse**; propõe-se decisão final humana. Essa confirmação ainda depende do Lucas (PRD §10); não tratar como decisão já tomada. Registrar proposta na F09.

## 12. Incertezas que o piloto precisa medir

1. WER do STT escolhido em rua real, com ruído e sotaque local; benchmarks citados valem pros datasets deles.
2. Latência ponta a ponta do pipeline por turnos e se ela atrapalha o fluxo.
3. Custo real do speech-to-speech com recobrança de contexto por turno (fórmula na seção 3, falta medir).
4. Custo do gpt-4o-mini-tts por minuto de fala (cobrança por token de áudio, razão não publicada).
5. Se o roteiro de consentimento falado é compreendido; avaliação jurídica do desenho de registro (áudio integral vs. atesto do voluntário).
6. Custo de totem sem fonte publicada confiável; decisão adiada.
7. Matriz de privacidade: linhas marcadas como pendente precisam de verificação por serviço antes de contratar.

## Fontes

Todas acessadas em 22/09/2026.

1. Groq, modelos e preços (whisper-large-v3 US$ 0,111/h; turbo US$ 0,04/h): https://console.groq.com/docs/models
2. OpenAI, pricing (transcrições por minuto, gpt-realtime e mini por token de áudio, tts por caractere, gpt-live-1 por minuto): https://developers.openai.com/api/docs/pricing
3. Deepgram, pricing: https://deepgram.com/pricing ; Nova-3: https://deepgram.com/learn/introducing-nova-3-speech-to-text-api ; pt-BR: https://deepgram.com/learn/ola-enhanced-portuguese-beta-speech-to-text-language-model-now-available
4. ElevenLabs, pricing de API (TTS por 1k caracteres, Scribe por hora, latência declarada): https://elevenlabs.io/pricing/api
5. Google Cloud Speech-to-Text, pricing: https://cloud.google.com/speech-to-text/pricing
6. Azure Speech, pricing (free tier documentado): https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/
7. whisper.cpp: https://github.com/ggerganov/whisper.cpp ; faster-whisper: https://github.com/SYSTRAN/faster-whisper
8. Vosk, modelos pt: https://alphacephei.com/vosk/models
9. CORAA ASR: https://github.com/nilc-nlp/CORAA ; paper: https://link.springer.com/article/10.1007/s10579-022-09621-4
10. NURC-SP corpus: https://doi.org/10.48550/arxiv.2409.15350
11. Comparativo ASR PT-BR (Whisper, Qwen 2.5 Omni, Phi-4): https://www.scitepress.org/Papers/2026/146373/146373.pdf
12. ElevenLabs, modelos e idiomas: https://help.elevenlabs.io/hc/en-us/articles/17883183930129
13. Google Cloud Text-to-Speech, pricing: https://cloud.google.com/text-to-speech/pricing
14. AWS Polly, pricing: https://aws.amazon.com/polly/pricing/
15. Licença XTTS (CPML, restrições de uso comercial): https://docs.coqui.ai/en/latest/models/xtts.html ; https://github.com/idiap/coqui-ai-TTS/discussions/216
16. Kokoro-82M, Apache-2.0: https://github.com/hexgrad/kokoro
17. Piper: https://github.com/rhasspy/piper
18. Pipecat: https://github.com/pipecat-ai/pipecat
19. LiveKit Agents: https://github.com/livekit/agents
20. Fórum Google AI, cobrança por token e recobrança de contexto de áudio no Live API: https://discuss.ai.google.dev/t/pricing-of-speech-to-speech-live-model/140340
21. OpenAI, guia de custo/latência (tokens de áudio por segundo no Realtime): https://developers.openai.com/api/docs/guides/voice-latency-cost
22. Google, Gemini 3.8 Live (equivalentes ~US$ 0,005/min in, ~US$ 0,018/min out): https://blog.google/innovation-and-ai/technology/developers-tools/build-real-time-voice-applications-gemini-audio/
23. Varejo de celulares de entrada (2026): https://shop.samsung.com/br/galaxy-a06/p ; https://leiturasingular.com.br/celular-mais-barato-funcional-2026/ ; https://www.kadri.com.br/produto/smartphone-samsung-galaxy-a06-4g-tela-de-67-128gb-4gb-de-ram-bateria-5000mah-ve/1003673
24. Twilio Voice Brasil: https://www.twilio.com/pt-br/voice/pricing/br
25. Meta, WhatsApp Business Calling (países e preços, tabela BRL jul/2026): https://developers.facebook.com/docs/whatsapp/cloud-api/calling/ ; https://developers.facebook.com/docs/whatsapp/cloud-api/calling/pricing/
26. Conceição (2016), dissertação PUC-Rio, baixo letramento e comunicadores: https://doi.org/10.17771/pucrio.acad.27168
27. Design de apps pra analfabetos funcionais no Brasil (IJIER): https://www.scholarsjournal.net/ijier/article/view/2691
28. LGPD, Lei 13.709/2018 compilada (arts. 5º, 7º, 8º, 9º, 11º, 33º): https://planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm ; comentário sobre ônus da prova e registro técnico: https://confidata.com.br/blog/lgpd-comentada-07-consentimento-informacao
29. ANPD, Resolução CD/ANPD nº 19/2024 (transferência internacional): https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024
30. GSMA, case Mobile Vaani / Gram Vaani: https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-for-development/wp-content/uploads/2024/04/Language-and-Digital-Humanitarian-Action_CaseStudies_MobileVaani_R.pdf
31. ARMMAN mMitra e inovação: https://armman.org/mmitra/ ; https://armman.org/innovation/
32. Google, Kilkari e IA de previsão de abandono: https://blog.google/intl/en-in/company-news/making-every-call-count-how-ai-is-supporting-mothers-in-india/
33. Digital Green FarmerChat: https://www.digitalgreen.org/farmerchat ; https://digitalgreentrust.org/farmerchat
34. OpenAI, controles de dados e retenção por endpoint: https://developers.openai.com/api/docs/guides/your-data
35. OpenAI, data residency da API (endpoints por região): https://help.openai.com/en/articles/10503543-data-residency-for-the-openai-api
36. OpenAI, business data (lista de regiões): https://openai.com/business-data/
37. Deepgram, FAQ de privacidade e MIP: https://deepgram.gitbook.io/help-center/faq/data-security-privacy-faq ; https://developers.deepgram.com/docs/the-deepgram-model-improvement-partnership-program.mdx
38. Deepgram, self-hosted e endpoints regionais: https://developers.deepgram.com/docs/self-hosted-introduction.mdx ; https://developers.deepgram.com/trust-security/data-privacy-compliance.mdx

39. OpenAI, transcrição de arquivos e limites de streaming: https://developers.openai.com/api/docs/guides/speech-to-text (acesso: 22/09/2026).
