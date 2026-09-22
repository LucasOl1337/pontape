# Voz e dispositivo · pesquisa F04

22/09/2026 · autor: devin (SubAgente) · revisor: fino · frente: F04 · base: PRD M4

## Recomendação pro piloto em 5 linhas

Celular Android barato do voluntário rodando uma PWA com botão "falar" (push-to-talk), pipeline STT + LLM + TTS orquestrado por framework aberto (Pipecat ou LiveKit Agents): gpt-4o-mini-transcribe ou Deepgram Nova-3 pt-BR na entrada, modelo leve no meio, gpt-4o-mini-tts ou ElevenLabs Flash na saída. Conexão ruim degrada pra áudio de WhatsApp (assíncrono, sobrevive a 3G) ou ligação PSTN via Twilio; sem conexão, grava local e transcreve depois. Custo estimado US$ 0,10 a 0,60 por entrevista de 10 minutos, uns R$ 0,55 a 3,30. O voluntário está sempre presente: ele é o fallback humano, não um opcional. A IA conduz a entrevista e transcreve; nunca infere caráter, honestidade ou merecimento pela voz.

## Convenções deste relatório

- **[PUBLICADO]** preço ou fato com link oficial do provedor ou fonte primária.
- **[ESTIMATIVA]** conta nossa a partir de preço publicado, com premissas explícitas.
- **Evidência vs. hipótese**: evidência é dado medido ou publicado; hipótese é o que a gente acha que vai funcionar e ainda precisa testar no piloto.
- **Consentimento registrado vs. consentimento válido**: registrado é o artefato (áudio do "sim", log, timestamp); válido é o requisito legal (livre, informado, inequívoco, finalidade específica). Um não garante o outro, seção 6.
- Câmbio de referência: **US$ 1 ≈ R$ 5,50** [ESTIMATIVA, 22/09/2026]. Todos os preços em dólar são antes de impostos.

## 1. Reconhecimento de fala (STT) em PT-BR

### Opções pagas, preço publicado por minuto de áudio

| Provedor / modelo | Preço/min | Streaming | Notas PT-BR |
|---|---|---|---|
| Groq, whisper-large-v3-turbo | ~US$ 0,0006 | não | Mais barato da lista; modelo aberto hospedado [1] |
| OpenAI, gpt-4o-mini-transcribe | US$ 0,003 | sim | Metade do preço do whisper-1 [2] |
| OpenAI, gpt-transcribe | US$ 0,0045 | sim | Recomendado pela OpenAI pra arquivo [3] |
| Deepgram, Nova-3 monolíngue | US$ 0,0043 (pagamento por uso) / US$ 0,0036 (Growth) | sim (streaming US$ 0,0077) | pt-BR suportado; feito pra ruído, crosstalk e far-field [4] |
| ElevenLabs, Scribe | US$ 0,22/hora ≈ US$ 0,0037/min | Scribe realtime US$ 0,39/hora | 99 idiomas [5] |
| AssemblyAI, Universal | ~US$ 0,0037 | sim (US$ 0,0074) | [1] |
| OpenAI, whisper-1 / gpt-4o-transcribe | US$ 0,006 | sim | Legado e modelo base GPT-4o [2][3] |
| Azure Speech, tempo real | US$ 1,00/hora ≈ US$ 0,0167; batch US$ 0,003 | sim | 5h/mês grátis; 148 locales [6] |
| Google Cloud STT v2 | US$ 0,016 (até 500 mil min/mês); dynamic batch US$ 0,003 | sim | 60 min/mês grátis na v1 [7] |
| OpenAI, transcribe em streaming dedicado | US$ 0,017 | sim | [1] |

### Opções abertas e offline

- **Whisper / faster-whisper / whisper.cpp**: modelo aberto da OpenAI, roda em GPU própria ou CPU. whisper.cpp roda até em Android. Custo é só o da máquina. [8]
- **Vosk**: modelo pt-BR pequeno (~45 MB) e grande, roda offline em Android e Linux, pensado pra embedded. Qualidade abaixo do Whisper em fala espontânea. [9]
- **Wav2Vec2-XLSR-53 afinado em CORAA**: corpus brasileiro de fala espontânea (290 h, com sotaques de MG, Recife e SP). Melhor modelo aberto dedicado a PT-BR na literatura: WER 24,18% no teste CORAA e 20,08% no Common Voice pt. [10]
- **Distil-Whisper afinado em NURC-SP**: corpus de fala espontânea com sotaque paulistano (239 h); WER 24,22%, melhor resultado do estudo. [11]

### Ruído de rua e sotaque: o que é evidência

WER em PT-BR espontâneo fica na faixa de **20 a 25%** nos melhores modelos abertos medidos em CORAA e NURC-SP [10][11]. Isso é fala espontânea real, com disfluência e sotaque. Um comparativo de 2026 entre Whisper, Qwen 2.5 Omni e Phi-4 Multimodal em CORAA e Common Voice pt colocou Phi-4 na frente, Whisper em segundo, Qwen atrás, principalmente em falas curtas [12]. Número de benchmark não é número de rua: **hipótese** a validar no piloto é que pergunta curta e dirigida (roteiro fechado) mantém a entrevista funcional mesmo com WER nessa faixa, porque a IA confirma o que entendeu ("você disse que trabalhou como pedreiro, é isso?").

## 2. Voz sintética (TTS) em PT-BR

| Provedor / modelo | Preço publicado | Naturalidade / latência |
|---|---|---|
| OpenAI gpt-4o-mini-tts | US$ 0,60/M tokens entrada, US$ 12/M saída ≈ US$ 0,015/min falado [ESTIMATIVA, medido ~1,5 cent/min] | Vozes naturais, controlável por prompt; streaming [13][14] |
| OpenAI tts-1 | US$ 15/M caracteres | Qualidade inferior ao mini-tts [15] |
| ElevenLabs Multilingual v2/v3 | US$ 0,10/1.000 caracteres (~US$ 0,10/min) | Mais natural da lista; ~250–300 ms; pt-BR [16] |
| ElevenLabs Flash/Turbo | US$ 0,05/1.000 caracteres | Otimizado pra latência [16] |
| Azure TTS Neural | US$ 16/M caracteres; 500 mil/mês grátis permanente | Vozes neurais pt-BR maduras (Francisca etc.) [17] |
| Google Cloud TTS Neural2/WaveNet | US$ 16/M caracteres; 1 M/mês grátis permanente; Chirp 3 HD US$ 30/M | Boa qualidade, pt-BR [17] |
| AWS Polly Neural | US$ 16/M caracteres; Standard US$ 4/M | pt-BR neural; Standard soa robótica [18] |
| Aberto: Coqui XTTSv2, Kokoro-82M, Piper | grátis (custo de máquina) | XTTSv2 e Kokoro têm pt-BR; qualidade abaixo dos pagos, latência depende do hardware [19] |
| Edge TTS | grátis, não oficial | Vozes neurais da Microsoft; uso fora do termo de serviço, risco de bloqueio |

Leitura: pra entrevista de rua, naturalidade ajuda confiança mas o que manda é latência e clareza. gpt-4o-mini-tts ou ElevenLabs Flash são o ponto de equilíbrio; Edge TTS serve pra prototipar sem custo, não pra produção.

## 3. Conversa em tempo real

Duas arquiteturas:

**A. Pipeline STT + LLM + TTS** (Pipecat ou LiveKit Agents, ambos open source, Apache-2.0/BSD) [20][21]. Cada peça é trocável, dá pra misturar provedor barato com caro, gravar transcrição limpa e controlar custo. Resposta em ~0,8 a 1,5 s com streaming nas três pontas [ESTIMATIVA de literatura de voz, citada em [22]]. Interrupção (barge-in) precisa de VAD + cancelamento explícito; Pipecat e LiveKit já trazem isso.

**B. Fala-pra-fala direta** (OpenAI Realtime, Gemini Live, Deepgram Voice Agent). Uma chamada WebRTC/SIP só, interrupção nativa, latência menor (~300–600 ms típico [ESTIMATIVA]), menos código. Custo maior e lock-in maior; o histórico de áudio da sessão volta como input a cada turno, o que encarece conversas longas. No Gemini Live isso é explícito: tokens de áudio acumulados são recobrados por turno na tarifa de input [23].

| Opção | Preço publicado | Custo/entrevista de 10 min [ESTIMATIVA] |
|---|---|---|
| Pipeline (gpt-4o-mini-transcribe + gpt-4o-mini + gpt-4o-mini-tts) | ver §8 | ~US$ 0,10 a 0,15 |
| OpenAI Realtime, gpt-realtime | áudio in US$ 32/M tok, out US$ 64/M tok; 1 tok por 100 ms de áudio in, 1 por 50 ms out [24][25] | ~US$ 0,60 a 1,20 (com recobrança de contexto) |
| gpt-realtime-mini | texto US$ 0,60 in / US$ 2,40 out por M tok; tarifa de áudio não consta na página do modelo | verificar na pricing page antes de usar [26] |
| Gemini 3.8 Live | áudio in US$ 3/M tok (~US$ 0,005/min), out US$ 12/M tok (~US$ 0,018/min); contexto recobrado por turno [27][23] | ~US$ 0,25 a 0,60 |

Recomendação: **pipeline** pro piloto. Entrevista é Q&A dirigido, não conversa solta; turn-taking com VAD basta, o custo é 4 a 8 vezes menor e cada componente pode virar modelo aberto depois. Speech-to-speech fica como upgrade se o teste de campo mostrar que 1 s de latência quebra o fluxo.

## 4. Dispositivo

| Opção | Custo | Conectividade | Segurança | Facilidade pra quem nunca usou |
|---|---|---|---|---|
| **Android barato do voluntário** | aparelho novo de entrada: Moto G05 R$ 484–610, Galaxy A06 R$ 809–899, Redmi A3/A5 R$ 450–600 [PUBLICADO, varejo 2026] | 4G + Wi-Fi; fallback pra WhatsApp áudio e gravação local | dado sensível passa pelo aparelho: precisa de perfil de trabalho/app dedicado e bloqueio; voluntário é parte do protocolo | alta: voluntário opera, candidato só fala |
| **Totem/quiosque em ponto público** | [ESTIMATIVA] R$ 8 mil a 25 mil por ponto (hardware, instalação, energia, rede, manutenção); sem fonte publicada confiável | fixa (fibra/4G router); ponto único de falha | vandalismo, fila visível expõe o candidato; áudio público vaza | média: ninguém ajuda, interface tem que se virar sozinha |
| **Ligação telefônica comum (PSTN)** | Twilio: receber chamada US$ 0,010/min, ligar p/ fixo US$ 0,031/min, celular US$ 0,0663/min, número local US$ 4,25/mês [PUBLICADO] | funciona em qualquer telefone, até feature phone; melhor cobertura possível | áudio transita pela operadora e pela Twilio; sem visual de apoio | máxima: todo mundo sabe atender telefone |
| **Áudio de WhatsApp** | conversa de serviço gratuita [PUBLICADO]; chamada via WhatsApp Business Calling API: iniciada pelo usuário é grátis, iniciada pela empresa cobra por minuto (tabela BRL desde jul/2026) [PUBLICADO] | assíncrono, tolera 3G ruim e retry automático | depende do candidato ter celular e WhatsApp (PRD diz que pode não ter); áudio passa pela Meta | alta pra quem tem WhatsApp: áudio já é o canal principal de quem lê pouco [28][29] |

Leitura: celular do voluntário com co-presença é o canal do piloto. PSTN é o plano B universal (atinge quem só tem feature phone). WhatsApp áudio é o plano B de quem tem o app. Totem fica fora do piloto: capex alto, manutenção e exposição, sem ganho claro.

## 5. Visual de apoio pra quem não lê

Evidência da pesquisa brasileira com baixo letramento [28][30]:

- Texto é barreira, não apoio: pessoas com baixo letramento já usam WhatsApp por áudio e foto e evitam ler/escrever. A tela deve assumir isso.
- **Um botão só por vez**: microfone grande no centro, estado claro (ouvindo / pensando / falando), sem menu.
- Ícones universais e grandes (microfone, orelha, check verde), sempre com feedback sonoro junto, nunca ícone sozinho carregando significado.
- Um rosto animado simples ajuda a pessoa a saber quando falar e quando esperar; avatar fotorrealista é desnecessário e pode assustar.
- Cores de alto contraste; WCAG AA já exigida no PRD §7.
- **Hipótese** a testar: onda de áudio visível enquanto a pessoa fala reduz abandono, porque mostra que "a máquina escutou". Sem fonte medida; validar no piloto.

## 6. Consentimento por voz

**O que a lei pede (consentimento válido)** [31]: LGPD art. 5º XII define consentimento como manifestação **livre, informada e inequívoca** pra finalidade determinada. Art. 8º permite consentimento "por escrito ou por outro meio que demonstre a manifestação de vontade": **voz gravada é meio válido**. Art. 8º §2º joga o ônus da prova no controlador: se não dá pra demonstrar, juridicamente não existiu. Art. 9º exige informar antes: finalidade, forma e duração do tratamento, com quem se compartilha, direitos do titular. Consentimento genérico é nulo (§4º) e revogável a qualquer momento por procedimento gratuito e facilitado (§5º). Áudio de entrevista pode conter dado sensível (saúde, religião), o que puxa o art. 11: consentimento específico e destacado.

**O que isso vira em produto (consentimento registrado)**:

1. A IA lê um roteiro curto e fixo, em linguagem simples, antes de qualquer pergunta: o que é, o que será gravado, pra que serve, quem vê, como apagar depois.
2. Pergunta de confirmação explícita ("posso gravar e usar isso pra sua candidatura?") e só segue com um "sim" claro. Silêncio ou dúvida não é consentimento.
3. Registro: áudio da resposta + metadados (timestamp, versão do roteiro lido, id da sessão, id do voluntário presente, hash do arquivo). O áudio sozinho, sem saber o que foi lido, prova pouco [32].
4. Revogação por voz a qualquer momento ("quero parar e apagar") gera flag imediata; encerrar fácil é parte da validade.

**Distinção que importa**: consentimento **registrado** é o artefato que a gente guarda; consentimento **válido** depende do que foi dito antes do "sim" e da liberdade real de recusar sem perder o acesso à ajuda. Um candidato que acha que recusar corta a comida não consente livremente. O roteiro tem que separar "receber a ponte inicial" de "ser entrevistado/gravado" pra não viciar o consentimento (art. 8º §3º).

**Transferência internacional**: a LGPD não exige dado no Brasil; transferência é permitida pelos mecanismos do art. 33 regulados pela Resolução CD/ANPD nº 19/2024 (cláusulas-padrão contratuais) [33]. Processar áudio em provedor americano é legal **com** contrato adequado e transparência; não é desculpa pra escolher fora de propósito.

## 7. Casos reais de voz com público de baixa escolaridade

- **Mobile Vaani (Gram Vaani, Índia)**: plataforma de mídia comunitária por IVR que roda em feature phone com 3 teclas e chamada perdida com retorno grátis. Mais de 1 milhão de usuários em 20 estados e 12 línguas, licenciada também pra Afeganistão, Etiópia, Namíbia, Paquistão e África do Sul. Prova que IVR burro + voz resolve alfabetização zero [34].
- **ARMMAN mMitra / Kilkari (Índia)**: ligações de voz gratuitas e semanais pra gestantes e mães; Kilkari é o maior programa do tipo do mundo, 60 milhões de mulheres e crianças alcançadas. IA do Google DeepMind prevê quem vai abandonar o programa e reduziu desistência em até 32% no grupo de maior risco. O caso mostra o canal funcionando em escala e, ao mesmo tempo, um uso de IA (prever desistência) que a gente deliberadamente não copia pra julgar candidato [35][36].
- **FarmerChat (Digital Green)**: assistente de IA pra agricultores de baixa renda e baixa escolaridade, por voz, texto ou foto, desenhado pra conexão ruim; 1 milhão+ de usuários, operando inclusive no Brasil [37].
- **WhatsApp como padrão de fato**: estudo qualitativo com 22 adultos brasileiros de baixa escolaridade mostrou o áudio como estratégia principal pra fugir de texto [28]; artigo sobre design inclusivo pra analfabetos funcionais no Brasil confirma: usam WhatsApp por áudio e foto e evitam ler e escrever [30].

## 8. Custo por entrevista de 10 minutos (conta reproduzível)

Premissas: entrevista de 10 min; ~10 min de áudio do candidato enviados ao STT (com pausas); ~4 min de fala da IA (~600 palavras, ~3.600 caracteres); ~15 turnos; LLM com ~40 mil tokens de entrada e 10 mil de saída no total [ESTIMATIVA]. Câmbio US$ 1 = R$ 5,50.

**Pipeline recomendada:**

| Componente | Conta | Custo |
|---|---|---|
| STT gpt-4o-mini-transcribe | 10 min × US$ 0,003/min [PUBLICADO] | US$ 0,030 |
| LLM gpt-4o-mini | 40k in × US$ 0,15/M + 10k out × US$ 0,60/M [PUBLICADO tarifa; volume ESTIMATIVA] | US$ 0,012 |
| TTS gpt-4o-mini-tts | 4 min × ~US$ 0,014/min [ESTIMATIVA medida ~1,5 cent/min] | US$ 0,056 |
| **Total** | | **~US$ 0,10 ≈ R$ 0,55** |

Com TTS premium (ElevenLabs v3): 3.600 chars × US$ 0,10/1k = US$ 0,36 → total ~US$ 0,40 ≈ R$ 2,20.
Com STT Deepgram Nova-3: 10 × 0,0043 = US$ 0,043 → total ~US$ 0,11.

**Canais somam por cima:**

- PWA no 4G: só o plano de dados do voluntário.
- PSTN inbound: +US$ 0,10/entrevista + US$ 4,25/mês o número [PUBLICADO].
- PSTN outbound p/ celular: +US$ 0,66/entrevista [PUBLICADO].
- WhatsApp áudio: +US$ 0 (conversa de serviço) [PUBLICADO].

Resumo honesto: **entre R$ 0,55 e R$ 3,30 por entrevista** dependendo da arquitetura, fora o hardware e o plano de dados do voluntário. Faixa provável do piloto: **~R$ 0,55 a 1,00**.

## 9. Privacidade, retenção e região

| Provedor | Treina com meu áudio? | Retenção | Região | Observação |
|---|---|---|---|---|
| OpenAI API | não [PUBLICADO] | logs de abuso até 30 dias; Zero Data Retention mediante aprovação [38] | residência de dados em US, UE, UK, JP, CA, KR, SG, AU, IN, UAE; **sem Brasil** [39] | melhor catálogo de voz; saída de dado do BR precisa de cláusula-padrão ANPD |
| Deepgram | amostra pequena pode ser retida pra treino salvo opt-out [40] | configurável; self-hosted não retém nada além de metadado de uso [41] | US por padrão; endpoint UE e AU; self-hosted | único com opção real de rodar na nossa infra |
| Google Cloud (STT/TTS) | não, conforme termos Cloud | data logging opcional cobra menos na v1 (US$ 0,016 vs 0,024) [7] | região São Paulo (southamerica-east1) | único hyperscaler com tudo em território nacional |
| Azure (Speech/OpenAI) | não | configurável | Brazil South | forte em TTS neural pt-BR |
| AWS (Polly/Transcribe) | não | configurável | sa-east-1 São Paulo | |
| ElevenLabs | plano pago não; gratuito pode [verificar termos] | conforme plano | US/UE | melhor naturalidade pt-BR |
| Meta/WhatsApp (Cloud API) | mensagens passam pela infra da Meta | política Meta | global | canal, não motor de IA |
| Twilio | não treina com conteúdo | gravações guardadas na conta; edge em São Paulo [verificar] | US + edges | canal PSTN/WhatsApp |

**Hipótese de arquitetura**: como a LGPD permite transferência com cláusulas-padrão (Res. 19/2024), o piloto pode usar provedor US/EU; o caminho de soberania (Deepgram self-hosted ou Google/AWS em São Paulo) existe pra quando o volume justificar.

## 10. Conexão ruim e fallback humano

- **PWA/WebRTC**: precisa de ~50–100 kbps sustentados; perda de pacote degrada e queda de sessão perde contexto [ESTIMATIVA de engenharia]. Mitigar com push-to-talk (áudio vai em bloco) e fila local.
- **Áudio de WhatsApp**: a forma mais tolerante: upload assíncrono, retoma sozinho, funciona em 3G ruim. Resposta não é em tempo real, mas a entrevista anda por turnos.
- **PSTN**: não depende de dados, ponto.
- **Offline total**: whisper.cpp ou Vosk no aparelho + Piper de TTS é tecnicamente possível em Android de entrada, com qualidade menor. **Hipótese** a testar: viável pra captar resposta curta quando não há rede nenhuma, sincronizando depois.
- **Fallback humano é a regra, não a exceção**: o voluntário está presente. Se o STT errar 2 vezes seguidas, a pessoa travar ou o sinal cair, o voluntário assume a entrevista com o mesmo roteiro e anota. A IA nunca fica sozinha com o candidato. Isso também fecha com o princípio 5 do PRD: IA filtra, humano responde.

## 11. Limite duro: a IA não julga a pessoa

Instrução do revisor e coerência com os princípios 2 e 5 do PRD: **a voz carrega a conversa, não vira prova de caráter**. Nada de análise de estresse, emoção ou "sinceridade" pela voz: além de eticamente errado pra este projeto, a base científica de inferir traços internos por sinais vocais é fraca e enviesada. A IA transcreve, organiza e recomenda segundo o que a pessoa **disse**; a decisão final é de um humano. Incluir isso como requisito explícito na F09 (piloto).

## 12. Incertezas que o piloto precisa medir

1. WER real do STT escolhido em rua barulhenta com sotaque local (benchmark de papel é 20–25%; rua pode ser pior).
2. Se ~1 s de latência do pipeline atrapalha o fluxo ou se o turn-taking dirigido resolve.
3. Tarifa de áudio do gpt-realtime-mini (página do modelo só lista texto) e custo real do Gemini Live com recobrança de contexto.
4. Se o roteiro de consentimento falado é compreendido na prática (testar com voluntários).
5. Custo real do totem e disponibilidade de pontos públicos (precisa de cotação local, nenhuma fonte publicada confiável achada).

## Fontes

Todas acessadas em 22/09/2026.

1. Awesome Agents, comparativo de preços de STT: https://awesomeagents.ai/pricing/transcription-api-pricing/
2. OpenAI, modelo gpt-4o-transcribe e pricing: https://developers.openai.com/api/docs/models/gpt-4o-transcribe ; https://developers.openai.com/api/docs/models/whisper-1
3. OpenAI, modelo gpt-transcribe: https://developers.openai.com/api/docs/models/gpt-transcribe
4. Deepgram, pricing: https://deepgram.com/pricing ; pt-BR enhanced: https://deepgram.com/learn/ola-enhanced-portuguese-beta-speech-to-text-language-model-now-available ; Nova-3: https://deepgram.com/learn/introducing-nova-3-speech-to-text-api
5. ElevenLabs, pricing de API: https://elevenlabs.io/pricing/api
6. Azure Speech pricing: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/ ; resumo de terceiro: https://brasstranscripts.com/blog/azure-speech-services-pricing-2025-microsoft-ecosystem-costs
7. Google Cloud STT pricing: https://cloud.google.com/speech-to-text/pricing
8. whisper.cpp: https://github.com/ggerganov/whisper.cpp ; faster-whisper: https://github.com/SYSTRAN/faster-whisper
9. Vosk modelos (pt): https://alphacephei.com/vosk/models
10. CORAA ASR (corpus PT-BR espontâneo, WER do wav2vec2): https://github.com/nilc-nlp/CORAA ; https://link.springer.com/article/10.1007/s10579-022-09621-4
11. NURC-SP corpus (sotaque paulistano, Distil-Whisper WER 24,22%): https://doi.org/10.48550/arxiv.2409.15350
12. Comparativo de ASR em PT-BR com multimodais (Whisper, Qwen, Phi-4): https://www.scitepress.org/Papers/2026/146373/146373.pdf
13. OpenAI gpt-4o-mini-tts: https://developers.openai.com/api/docs/models/gpt-4o-mini-tts
14. Medição de custo real do gpt-4o-mini-tts (~1,5 cent/min): https://www.s-anand.net/blog/openai-tts-cost/
15. OpenAI tts-1: https://developers.openai.com/api/docs/models/tts-1
16. ElevenLabs modelos (pt-BR, latência): https://help.elevenlabs.io/hc/en-us/articles/17883183930129 ; https://elevenlabs.io/docs/overview/capabilities/text-to-speech.mdx
17. Calculadora comparativa com preços de vendor (Google, Azure, Polly, ElevenLabs): https://induwara.lk/tools/ai-tts-cost-calculator ; Azure TTS: https://texttolab.com/blog/azure-text-to-speech-pricing
18. AWS Polly pricing: https://aws.amazon.com/polly/pricing/
19. Kokoro TTS: https://github.com/hexgrad/kokoro ; Coqui XTTS: https://github.com/coqui-ai/TTS
20. Pipecat: https://github.com/pipecat-ai/pipecat
21. LiveKit Agents: https://github.com/livekit/agents
22. Comparativo Pipecat vs LiveKit Agents vs TEN (jul/2026): https://builderai.tools/blog/building-voice-agents-ten-pipecat-livekit
23. Fórum Google AI: cobrança por token e recobrança de contexto de áudio no Live API: https://discuss.ai.google.dev/t/pricing-of-speech-to-speech-live-model/140340
24. OpenAI gpt-realtime: https://developers.openai.com/api/docs/models/gpt-realtime
25. OpenAI, guia de custo/latência de voz (tokens de áudio por segundo): https://developers.openai.com/api/docs/guides/voice-latency-cost
26. OpenAI gpt-realtime-mini (só tarifa de texto na página): https://developers.openai.com/api/docs/models/gpt-realtime-mini
27. Google, modelos Gemini 3.8 Live (US$ 0,005/min in, US$ 0,018/min out): https://blog.google/innovation-and-ai/technology/developers-tools/build-real-time-voice-applications-gemini-audio/ ; https://ai.google.dev/gemini-api/docs/live-api
28. Conceição (2016), dissertação PUC-Rio sobre baixo letramento e comunicadores: https://doi.org/10.17771/pucrio.acad.27168
29. Meta, WhatsApp Business Calling (preços e países): https://developers.facebook.com/docs/whatsapp/cloud-api/calling/ ; https://developers.facebook.com/docs/whatsapp/cloud-api/calling/pricing/ ; Twilio WhatsApp Calling: https://www.twilio.com/en-us/whatsapp/pricing
30. Design de apps pra analfabetos funcionais no Brasil (IJIER): https://www.scholarsjournal.net/ijier/article/view/2691
31. LGPD, Lei 13.709/2018 compilada (arts. 5º, 7º, 8º, 9º, 11º, 33º): https://planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm
32. Comentário sobre registro técnico de consentimento (ônus da prova, art. 8º §2º): https://confidata.com.br/blog/lgpd-comentada-07-consentimento-informacao
33. ANPD, Resolução CD/ANPD nº 19/2024 (transferência internacional): https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024
34. GSMA, case Mobile Vaani / Gram Vaani: https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-for-development/wp-content/uploads/2024/04/Language-and-Digital-Humanitarian-Action_CaseStudies_MobileVaani_R.pdf
35. ARMMAN mMitra: https://armman.org/mmitra/ ; inovação/IA: https://armman.org/innovation/
36. Google, "Making every call count" (Kilkari, 60 mi, -32% desistência): https://blog.google/intl/en-in/company-news/making-every-call-count-how-ai-is-supporting-mothers-in-india/
37. Digital Green FarmerChat: https://www.digitalgreen.org/farmerchat ; https://digitalgreentrust.org/farmerchat
38. OpenAI, controles de dados da plataforma (30 dias, ZDR): https://developers.openai.com/api/docs/guides/your-data
39. OpenAI, data residency (lista de regiões, sem Brasil): https://openai.com/business-data/ ; https://help.openai.com/en/articles/10503543-data-residency-for-the-openai-api
40. Deepgram, FAQ de privacidade (processamento em US, amostra pra treino): https://deepgram.gitbook.io/help-center/faq/data-security-privacy-faq
41. Deepgram, self-hosted e endpoints regionais: https://developers.deepgram.com/docs/self-hosted-introduction ; https://developers.deepgram.com/trust-security/data-privacy-compliance
42. Twilio Voice Brasil: https://www.twilio.com/en-us/voice/pricing/br ; https://www.twilio.com/pt-br/voice/pricing/br
43. Preços de celulares de entrada no Brasil 2026 (varejo): https://leiturasingular.com.br/celular-mais-barato-funcional-2026/ ; https://www.kadri.com.br/produto/smartphone-samsung-galaxy-a06-4g-tela-de-67-128gb-4gb-de-ram-bateria-5000mah-ve/1003673
