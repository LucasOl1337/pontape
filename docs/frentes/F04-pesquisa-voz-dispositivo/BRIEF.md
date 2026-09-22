# F04 · Pesquisa: entrevista por voz e dispositivo

Dono: `devin` (SubAgente) · Revisor e integrador: `fino` · Worktree: `.worktrees/devin` · Branch: `devin/f04-voz` · Base: `main`

## Por que agora

É o gargalo mais técnico do projeto (PRD M4). O candidato pode não ler e não ter celular. Ele precisa conversar com a IA por voz, numa entrevista curta, na rua, num ponto público ou no celular de um voluntário. A arquitetura da F02 depende dessa resposta.

## Entregável

`docs/pesquisa/VOZ-E-DISPOSITIVO.md`, abrindo com **recomendação pro piloto em 5 linhas**:

1. **Reconhecimento de fala em PT-BR**: opções abertas e pagas, desempenho com ruído de rua e sotaques, custo por minuto, se roda offline.
2. **Voz sintética em PT-BR**: naturalidade, latência, custo.
3. **Conversa em tempo real**: arquiteturas (fala pra fala direto vs STT + LLM + TTS), latência, interrupção, custo por entrevista de 10 minutos.
4. **Dispositivo**, comparando: celular Android barato do voluntário, totem ou quiosque em ponto público, ligação telefônica comum, áudio de WhatsApp. Pra cada um: custo, conectividade, segurança, facilidade pra quem nunca usou.
5. **Visual de apoio**: o que a tela mostra pra quem não lê (ícones, rosto, cores).
6. **Consentimento por voz**: como pedir e registrar de forma válida, em linguagem simples.
7. Exemplos reais de IA de voz usada com público de baixa escolaridade, com link.

Diário em `docs/frentes/F04-pesquisa-voz-dispositivo/DIARIO.md`.

## Limites

Só leitura e consulta. Nada de criar conta ou chave de API.

## Pronto quando

- Os 7 itens respondidos, com link e data de acesso em toda afirmação factual.
- Custo por entrevista estimado pra opção recomendada.
- PR aberta pra `main`, revisada pelo EngenheiroFino, que reporta ao Regente.
