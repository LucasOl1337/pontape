type Message = { role: 'user' | 'assistant'; content: string };

const dialog = document.querySelector<HTMLDialogElement>('#yumi-dialog');
const opener = document.querySelector<HTMLButtonElement>('#yumi-open');
const form = document.querySelector<HTMLFormElement>('#yumi-form');
const input = document.querySelector<HTMLTextAreaElement>('#yumi-input');
const log = document.querySelector<HTMLElement>('#yumi-messages');
const status = document.querySelector<HTMLElement>('#yumi-status');
const history: Message[] = [];
let busy = false;

function addMessage(content: string, role: Message['role']) {
  const paragraph = document.createElement('p');
  paragraph.className = `yumi-message yumi-message--${role}`;
  paragraph.textContent = content;
  log?.append(paragraph);
  log?.scrollTo({ top: log.scrollHeight });
  return paragraph;
}

async function readAnswer(response: Response, target: HTMLElement) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('A resposta não chegou.');
  const decoder = new TextDecoder();
  let buffer = '';
  let answer = '';
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, '\n');
    let end;
    while ((end = buffer.indexOf('\n\n')) !== -1) {
      const event = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      const data = event.split('\n').filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).trimStart()).join('\n');
      if (!data || data === '[DONE]') continue;
      try {
        const chunk = JSON.parse(data);
        const token = chunk.choices?.[0]?.delta?.content;
        if (typeof token === 'string') {
          answer += token;
          target.textContent = answer;
          log?.scrollTo({ top: log.scrollHeight });
        }
      } catch { /* Event without a text token. */ }
    }
    if (done) break;
  }
  if (!answer.trim()) throw new Error('A Yumi não conseguiu responder agora.');
  return answer.trim();
}

form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy || !input || !status) return;
  const content = input.value.trim();
  if (!content || content.length > 600) return;
  busy = true;
  input.value = '';
  input.disabled = true;
  form.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled = true;
  status.textContent = 'Yumi está respondendo...';
  addMessage(content, 'user');
  const reply = addMessage('', 'assistant');
  const messages = [...history, { role: 'user' as const, content }].slice(-12);
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages }),
      cache: 'no-store',
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(body.error || 'A Yumi não conseguiu responder agora.');
    }
    const answer = await readAnswer(response, reply);
    if (response.headers.get('x-yumi-private') !== '1') {
      history.push({ role: 'user', content }, { role: 'assistant', content: answer });
      if (history.length > 12) history.splice(0, history.length - 12);
    }
    status.textContent = '';
  } catch (cause) {
    reply.textContent = cause instanceof Error ? cause.message : 'A Yumi não conseguiu responder agora.';
    status.textContent = 'Tente de novo daqui a pouco.';
  } finally {
    busy = false;
    input.disabled = false;
    form.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled = false;
    input.focus();
  }
});

input?.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    form?.requestSubmit();
  }
});

dialog?.addEventListener('close', () => opener?.focus());
dialog?.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), textarea:not(:disabled)')];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
});

export function openYumiChat() {
  if (!dialog?.open) dialog?.showModal();
  input?.focus();
}
