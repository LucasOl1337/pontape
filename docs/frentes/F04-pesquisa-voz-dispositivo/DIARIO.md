# Diário · F04 pesquisa de voz e dispositivo

## 22/09/2026

### O que fiz

- Li AGENTS.md, PRD.md, QUADRO.md e o BRIEF.md da F04.
- Pesquisei as 7 frentes do brief só com fontes públicas: STT, TTS, conversa em tempo real, dispositivo, visual de apoio, consentimento por voz e casos reais. Nenhuma conta criada, nenhuma chave, nenhuma API paga.
- Escrevi `docs/pesquisa/VOZ-E-DISPOSITIVO.md` com recomendação de 5 linhas, conta reproduzível por entrevista de 10 min, separação entre preço publicado e estimativa, evidência e hipótese, consentimento registrado e validade jurídica, tabela de privacidade/retenção/região, comportamento em conexão ruim e fallback humano.

### O que achei (resumo)

- Pipeline STT+LLM+TTS em framework aberto (Pipecat ou LiveKit Agents) custa ~US$ 0,10 por entrevista de 10 min; speech-to-speech (OpenAI Realtime, Gemini Live) sai 4 a 8 vezes mais caro por causa da recobrança de contexto de áudio. Pipeline é a recomendação pro piloto.
- Canal: celular Android barato do voluntário (R$ 450–900) com PWA push-to-talk; WhatsApp áudio e ligação PSTN como degradação graciosa; totem fora do piloto por capex e exposição.
- LGPD permite consentimento por voz (art. 8º), mas o ônus da prova é nosso: precisa guardar áudio do aceite + roteiro lido + timestamp. Consentimento genérico ou viciado é nulo. Transferência internacional de dados é permitida com cláusulas-padrão (Res. ANPD 19/2024); OpenAI não tem residência no Brasil, Google/AWS/Azure têm região em São Paulo e Deepgram tem self-hosted.
- WER publicado em fala espontânea PT-BR fica em 20–25% (CORAA, NURC-SP). Hipótese: pergunta dirigida com confirmação pela IA compensa; validar em rua.

### Decisões propostas (aguardando fino/Regente)

1. Piloto: PWA no celular do voluntário + pipeline; realtime só se latência provar problema.
2. Requisito duro pra F09: a IA nunca infere caráter, emoção ou merecimento pela voz; decide só sobre o que a pessoa disse.
3. Consentimento: roteiro falado fixo + "sim" explícito gravado + log de versão do roteiro; revogação por voz a qualquer momento.
4. Separar "receber a ponte inicial" de "topar a entrevista gravada" pra não viciar o consentimento.

### Onde parei e próximo passo

Relatório completo, DIARIO fechado. Falta: commit, push, PR pra `main` e report ao EngenheiroFino via maestri. Incertezas listadas na seção 12 do relatório (WER em rua real, tarifa de áudio do gpt-realtime-mini, custo de totem sem fonte publicada).
