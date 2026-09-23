# Diário · F04 pesquisa de voz e dispositivo

## 22/09/2026

### O que fiz

- Li AGENTS.md, PRD.md, QUADRO.md e o BRIEF.md da F04.
- Pesquisei as 7 frentes do brief só com fontes públicas. Nenhuma conta, chave ou API paga.
- Escrevi `docs/pesquisa/VOZ-E-DISPOSITIVO.md`, abri a PR #1 pra `main`.
- Recebi revisão do EngenheiroFino na PR #1 e reescrevi o relatório (rev. 2).

### Correções aplicadas da revisão

1. Removida a recomendação de gravação/fila local offline como default: risco de perda do aparelho com dado sensível. Regra do piloto: sem rede, IA pausa e o voluntário conduz com o mesmo roteiro. WhatsApp e PSTN passaram a "canais futuros" com contrato, custo e consentimento próprios, não fallback automático.
2. Seção de privacidade virou matriz endpoint/modelo/região/retenção documentada, com [PENDENTE] onde não verifiquei fonte primária. Removidos "único", "tudo nacional" e "não treina" genérico. Retenção OpenAI por endpoint: transcriptions sem retenção de monitoramento; speech e realtime com logs de 30 dias; ZDR elegível por endpoint.
3. Preços só de fontes primárias (páginas oficiais de OpenAI, Groq, Deepgram, ElevenLabs, Google, AWS, Azure, Twilio, Meta). Removidas calculadoras e blogs de preço. Conta da entrevista refeita: teto de 10 min de captura no STT (não 14 min de fala), TTS orçado por caractere (tts-1) porque o mini-tts cobra por token de áudio sem razão publicada. Realtime e Gemini Live com fórmula de piso + recobrança de contexto, marcados como não comparáveis por minuto sem medição. Removido o "4–8x".
4. LGPD reescrita: áudio demonstra manifestação de vontade, não garante validade; falta de registro torna o consentimento indemonstrável, não inexistente; contrato adequado é condição necessária, não suficiente; adicionada alternativa de atesto do voluntário sem reter áudio integral, pendente jurídico.
5. Removidos rankings subjetivos sem ensaio. WER restrito aos modelos/datasets dos papers. Licenças de TTS verificadas: XTTS v2 é CPML não comercial (restrições de uso precisam de validação), Kokoro Apache-2.0, Piper com licença por voz.
6. Resumo inicial em exatos 5 itens curtos. Casos reais agora distinguem IVR sem IA (Mobile Vaani), chamada gravada com IA auxiliar (Kilkari) e IA conversacional (FarmerChat).
7. Arquitetura alinhada à F02: pipeline por turnos curtos sobre Edge Functions; Pipecat/LiveKit como alternativa futura de worker persistente.

### O que achei (resumo)

- Pipeline em turnos curtos custa ~US$ 0,10 por entrevista de 10 min (teto de captura); speech-to-speech depende do cenário de captura e contexto, sem piso universal estabelecido.
- Canal do piloto: Android do voluntário + PWA push-to-talk, co-presença humana sempre.
- LGPD: consentimento por voz é meio válido de demonstrar a manifestação; registro precisa de roteiro + aceite + metadados; separar ajuda material do aceite de gravação.
- WER publicado nos datasets PT-BR espontâneos (CORAA, NURC-SP): 20–25% nos modelos testados. Rua é hipótese a medir.

### Decisões propostas (aguardando fino/Regente)

1. Piloto: PWA no celular do voluntário + pipeline por turnos curtos no gateway da F02.
2. Requisito duro pra F09: a IA nunca infere caráter, emoção ou merecimento pela voz.
3. Consentimento: roteiro falado fixo + "sim" explícito + log de versão; desenho de retenção (áudio integral vs. atesto) pendente de jurídico.
4. Matriz de privacidade com pendências a verificar antes de contratar provedor.

### Onde parei e próximo passo

Na interrupção do Devin, a revisão 2 estava salva mas NÃO commitada. A PR #1 ainda continha a primeira versão; ver recuperação abaixo.


## 22/09/2026 · Recuperação pelo EngenheiroFino

- Às 20:54 BRT, constatadas três falhas do provedor em sequência (falha inicial e duas tentativas de retomada), registradas pelo `maestri check`. Horários individuais não estavam disponíveis; 20:54 é a hora da constatação, não uma hora inventada para cada tentativa.
- Erro literal nas três: `Client error: Protocol error (unimplemented): The third-party model provider is experiencing issues and is currently not available. Please try this model again later.`
- Traces: `43fe4fa8ddaa45ddf43c78e5d8345390`, `8cae1ffeedebe5557c066049a2876095`, `8fbc658b3acf357f686dd034203e78e5`.
- Regente autorizou assumir a frente em PR separada, novo worktree `/home/lol/Projects/VidaNova/.worktrees/fino-f04`, branch `fino/f04-voz`, baseado em `origin/main` (`354185b`). Revisão 2 copiada só por leitura; nada editado, commitado ou limpo no worktree Devin.
- Ajustes finais: retenção e residência por endpoint; cenários Realtime sem chamar de piso; streaming de Whisper; remoção de afirmação sem fonte sobre termos Edge TTS; decisão humana mantida como proposta pendente. Corrigido também preço WaveNet com fonte Google atual e indicado Piper legado arquivado.
- Orçamento pipeline conferido: US$ 0,030 STT + 0,012 LLM + 0,054 TTS-1 = US$ 0,096 nas premissas; câmbio apenas hipotético. Naturalidade, latência e desempenho em campo continuam a medir.
- Validação documental: revisão dos sete itens do brief, referências e unidades do orçamento, `git diff --check`. Sem chamadas pagas, conta, chave, dados reais ou código de piloto.
- Próximo passo: commit/push e PR substituta da #1; integrar síntese na ARQUITETURA da F02. Regente fará merge e fechamento da #1.

## 22/09/2026 · Entrega recuperada

- Relatório revisado no commit `6444fb373ca4c84740f300191837adc7b9398f85`, enviado para `origin/fino/f04-voz`.
- PR substituta aberta: https://github.com/LucasOl1337/VidaNova/pull/3 (base `main`). Substitui a #1; fechamento e merge reservados ao Regente.
- Síntese técnica e custo incorporados na seção 5.2 da ARQUITETURA, PR própria da F02. Report das duas entregas ao Regente pelo Maestri no fechamento F02.
- Estado: pesquisa concluída e revisada; aguarda integração do Regente. Nenhum piloto implementado ou teste com pessoa realizado. Futuras decisões de provedor, base legal, cidade e seleção seguem pendentes.
