// The benefits check: one question at a time, all in memory. No request, no storage (D012).
import { ALWAYS, CHECKED, EXAMPLE, check, reais, type Answers, type Cadunico, type Result } from '../data/site/direitos';
import { formatDay } from '../data/site/project';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const form = $<HTMLFormElement>('dr-form');
const steps = Array.from(form.querySelectorAll<HTMLFieldSetElement>('.dr-step'));
const income = $<HTMLInputElement>('dr-income');
let at = 0;
const current = () => steps[at]!;

const count = (id: string) => Number($(id).textContent);
const picked = (name: string) => form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value;

function answers(): Answers {
  return {
    people: count('dr-people'),
    income: Number(income.value || 0),
    kidsUpTo6: count('dr-kids6'),
    kids7to17: count('dr-kids17'),
    pregnantOrNursing: picked('pregnant') === 'sim',
    medicalDevice: picked('medical') === 'sim',
    receivesBolsa: picked('bolsa') === 'sim',
    cadunico: (picked('cadunico') ?? 'unknown') as Cadunico,
  };
}

// What is still missing on a step, in words; empty when it can move on.
function missing(step: HTMLFieldSetElement): string {
  const name = step.dataset.step!;
  if (name === 'income') return income.value ? '' : 'Escreva o valor, ou toque em "Não entra nada".';
  if (['pregnant', 'medical', 'bolsa', 'cadunico'].includes(name)) return picked(name) ? '' : 'Escolha uma resposta pra continuar.';
  return '';
}

const say = (message: string) => { const el = $('dr-say'); el.textContent = message; el.hidden = !message; };

function show(index: number) {
  at = Math.max(0, Math.min(index, steps.length - 1));
  steps.forEach((s, i) => s.classList.toggle('on', i === at));
  $('dr-progress').textContent = `Pergunta ${at + 1} de ${steps.length}`;
  $('dr-bar').style.width = `${((at + 1) / steps.length) * 100}%`;
  $<HTMLButtonElement>('dr-back').disabled = at === 0;
  $('dr-next').firstChild!.textContent = at === steps.length - 1 ? 'Ver o resultado' : 'Continuar';
  say('');
}

function focusStep() {
  current().querySelector<HTMLElement>('input, output + button, button')?.focus({ preventScroll: true });
  form.scrollIntoView({ block: 'start' });
}

/* ---------- Counters and the money box: buttons and digits only, never words ---------- */

form.addEventListener('click', e => {
  const button = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-step-by]');
  if (!button) return;
  const box = button.closest<HTMLElement>('[data-counter]')!;
  const out = $(box.dataset.counter!);
  let next = Math.max(Number(box.dataset.min), Number(out.textContent) + Number(button.dataset.stepBy));
  next = Math.min(next, 20);
  // Children can't outnumber the people in the house.
  if (out.id !== 'dr-people') {
    const other = out.id === 'dr-kids6' ? count('dr-kids17') : count('dr-kids6');
    if (next + other > count('dr-people')) { say('Tem mais criança que gente na casa. Confira quantas pessoas moram aí.'); return; }
  } else if (next < count('dr-kids6') + count('dr-kids17')) {
    $('dr-kids6').textContent = '0'; $('dr-kids17').textContent = '0';
  }
  out.textContent = String(next);
  say('');
});

income.addEventListener('input', () => { income.value = income.value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''); say(''); });
$('dr-zero').addEventListener('click', () => { income.value = '0'; show(at + 1); focusStep(); });

/* ---------- Moving through the questions ---------- */

$('dr-next').addEventListener('click', () => {
  const problem = missing(current());
  if (problem) { say(problem); return; }
  if (at < steps.length - 1) { show(at + 1); focusStep(); } else showResult();
});
$('dr-back').addEventListener('click', () => { show(at - 1); focusStep(); });
form.addEventListener('submit', e => { e.preventDefault(); $('dr-next').click(); });
// A choice is an answer: move on by itself, the way a question on paper would.
form.addEventListener('change', e => {
  if ((e.target as HTMLInputElement).type === 'radio' && at < steps.length - 1) setTimeout(() => { show(at + 1); focusStep(); }, 250);
});

/* ---------- The result ---------- */

let last: Result | undefined;

function showResult() {
  stopSpeaking();
  const a = answers();
  last = check(a);
  const { perPerson, benefits, updateCadunico } = last;
  $('dr-sum').innerHTML = `Na sua casa entram <b>${reais(a.income)}</b> por mês pra <b>${a.people} ${a.people === 1 ? 'pessoa' : 'pessoas'}</b>. Dá <b>${reais(perPerson)} por pessoa</b>.`;
  $('dr-alert').innerHTML = updateCadunico
    ? `<p class="dr-alert"><b>${a.cadunico === 'old' ? 'Atualize seu CadÚnico.' : 'O primeiro passo é o CadÚnico.'}</b> Sem ele em dia, os benefícios não chegam ou podem parar.</p>`
    : benefits.length ? '' : '<p class="dr-sum">Se a vida mudar, faça a conta de novo. Enquanto isso, isto vale pra qualquer pessoa:</p>';

  const card = (title: string, body: string) => `<li class="dr-card"><h3>${esc(title)}</h3>${body}</li>`;
  const source = (label: string, url: string) =>
    `<p class="dr-src">Fonte: <a href="${esc(url)}" rel="noopener" target="_blank">${esc(label)}</a>, conferida em ${formatDay(CHECKED)}.</p>`;
  const list = (tag: 'ol' | 'ul', items: string[]) => `<${tag}>${items.map(i => `<li>${esc(i)}</li>`).join('')}</${tag}>`;

  $('dr-result-title').textContent = benefits.length ? 'Vocês podem ter direito a:' : 'Pelas respostas, nenhum destes benefícios agora.';
  $('dr-cards').innerHTML = benefits.length
    ? benefits.map(b => card(b.title,
        (b.estimate ? `<p class="dr-est">${esc(b.estimate)}</p>` : '')
        + `<p class="dr-what">${esc(b.what)}</p>`
        + `<h4>Como pedir</h4>${list('ol', b.steps)}`
        + (b.papers ? `<h4>O que levar</h4>${list('ul', b.papers)}` : '')
        + source(b.source.label, b.source.url))).join('')
    : ALWAYS.map(x => card(x.title, `<p class="dr-what">${esc(x.what)}</p>${source(x.source.label, x.source.url)}`)).join('');

  form.hidden = true;
  const result = $('dr-result');
  result.hidden = false;
  result.focus({ preventScroll: true });
  result.scrollIntoView({ block: 'start' });
}

function backToQuestions(index: number) {
  stopSpeaking();
  $('dr-result').hidden = true;
  form.hidden = false;
  show(index);
  focusStep();
}
$('dr-edit').addEventListener('click', () => backToQuestions(0));
$('dr-restart').addEventListener('click', () => { reset(); backToQuestions(0); say('Tudo apagado. Pode começar.'); });
$('dr-print').addEventListener('click', () => { stopSpeaking(); window.print(); });

function reset() {
  form.reset();
  income.value = '';
  $('dr-people').textContent = '1'; $('dr-kids6').textContent = '0'; $('dr-kids17').textContent = '0';
}

$('dr-example').addEventListener('click', () => {
  reset();
  $('dr-people').textContent = String(EXAMPLE.people);
  income.value = String(EXAMPLE.income);
  $('dr-kids6').textContent = String(EXAMPLE.kidsUpTo6);
  $('dr-kids17').textContent = String(EXAMPLE.kids7to17);
  const tick = (name: string, value: string) => { form.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`)!.checked = true; };
  tick('pregnant', EXAMPLE.pregnantOrNursing ? 'sim' : 'nao');
  tick('medical', EXAMPLE.medicalDevice ? 'sim' : 'nao');
  tick('bolsa', EXAMPLE.receivesBolsa ? 'sim' : 'nao');
  tick('cadunico', EXAMPLE.cadunico);
  showResult();
  $('dr-sum').insertAdjacentHTML('afterbegin', '<b>Família inventada, só de exemplo.</b> ');
});

/* ---------- Listen: the phone reads aloud, offline, for whoever reads little ---------- */

let speaking: HTMLButtonElement | undefined;
const labels = new Map<HTMLButtonElement, string>();

function stopSpeaking() {
  try { speechSynthesis.cancel(); } catch { /* nothing to stop */ }
  if (speaking) speaking.querySelector('span')!.textContent = labels.get(speaking)!;
  speaking = undefined;
}

function speak(button: HTMLButtonElement, parts: string[]) {
  if (!('speechSynthesis' in window)) { say('Este navegador não sabe ler em voz alta. No celular Android e no iPhone funciona.'); return; }
  if (speaking === button) { stopSpeaking(); return; }
  stopSpeaking();
  if (!labels.has(button)) labels.set(button, button.querySelector('span')!.textContent!);
  try {
    // One sentence per utterance: Chrome stops a long one after about 15 seconds.
    const voice = speechSynthesis.getVoices().find(v => /pt[-_]BR/i.test(v.lang));
    parts.forEach((text, i) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.95;
      if (voice) utterance.voice = voice;
      if (i === parts.length - 1) utterance.onend = stopSpeaking;
      utterance.onerror = e => {
        // Pressing stop cancels the queue; that is not a failure.
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        stopSpeaking();
      };
      speechSynthesis.speak(utterance);
    });
    speaking = button;
    button.querySelector('span')!.textContent = 'Parar de ouvir';
  } catch {
    stopSpeaking();
  }
}

const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

$('dr-listen-q').addEventListener('click', e => {
  const step = current();
  const options = Array.from(step.querySelectorAll('.dr-choice span')).map(text);
  speak(e.currentTarget as HTMLButtonElement, [
    text(step.querySelector('legend')),
    ...Array.from(step.querySelectorAll('.dr-hint')).map(text),
    ...(options.length ? [`As respostas são: ${options.join('; ')}.`] : []),
  ].filter(Boolean));
});

$('dr-listen').addEventListener('click', e => {
  const parts = [text($('dr-result-title')), text($('dr-sum')), text($('dr-alert'))];
  $('dr-cards').querySelectorAll('.dr-card').forEach(c => {
    c.querySelectorAll('h3, .dr-est, .dr-what, h4, li').forEach(el => parts.push(text(el)));
  });
  speak(e.currentTarget as HTMLButtonElement, parts.filter(Boolean));
});

show(0);
