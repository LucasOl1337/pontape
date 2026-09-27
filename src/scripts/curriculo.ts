// The résumé tool: everything stays in this page, in memory. No request, no storage (D012).
import { EXAMPLE } from '../data/site/curriculo';

interface Job { id: number; what: string; where: string; time: string }

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const input = (id: string) => $<HTMLInputElement>(id);
const value = (id: string) => input(id).value.trim();
const boxes = (selector: string) => Array.from(document.querySelectorAll<HTMLInputElement>(selector));

const form = $<HTMLFormElement>('cv-form');
const sheet = $('cv-sheet');
let extraSkills: string[] = [];
let courses: string[] = [];
let jobs: Job[] = [];
let jobSeq = 0;

function drawJobs() {
  $('cv-jobs').innerHTML = jobs.map(job => `<div class="cv-job-box" data-job="${job.id}">
    <div class="cv-job-head"><p class="cv-job-n">Trabalho</p><button class="btn cv-btn-sm cv-btn-quiet" type="button" data-rm-job="${job.id}">Tirar</button></div>
    <label class="cv-field"><span>O que eu fazia</span><input type="text" data-jf="what" value="${esc(job.what)}" placeholder="Faxina, ajudante de obra, cuidar de idoso" /></label>
    <div class="cv-row">
      <label class="cv-field"><span>Onde, se quiser dizer</span><input type="text" data-jf="where" value="${esc(job.where)}" placeholder="Casas de família, obra, mercado" /></label>
      <label class="cv-field"><span>Quanto tempo</span><input type="text" data-jf="time" value="${esc(job.time)}" placeholder="2 anos, 6 meses" /></label>
    </div>
  </div>`).join('');
}

function drawChips() {
  const chip = (text: string, i: number, kind: string) =>
    `<li class="cv-chip">${esc(text)}<button type="button" data-rm-${kind}="${i}" aria-label="Tirar ${esc(text)}">&times;</button></li>`;
  $('cv-skill-chips').innerHTML = extraSkills.map((s, i) => chip(s, i, 'skill')).join('');
  $('cv-course-chips').innerHTML = courses.map((c, i) => chip(c, i, 'course')).join('');
}

function read() {
  const availability = boxes('[data-shift]').filter(b => b.checked).map(b => b.dataset.shift!);
  if (input('cv-license').checked) availability.push(`CNH${value('cv-license-cat') ? ` ${value('cv-license-cat').toUpperCase()}` : ''}`);
  if (input('cv-travel').checked) availability.push('Pode viajar');
  return {
    name: value('cv-name'),
    phone: value('cv-phone'),
    place: [value('cv-district'), value('cv-city')].filter(Boolean).join(', '),
    skills: boxes('[data-skill]').filter(b => b.checked).map(b => b.dataset.skill!).concat(extraSkills),
    jobs: jobs.filter(j => j.what.trim()),
    courses: courses.slice(),
    school: $<HTMLSelectElement>('cv-school').value,
    availability,
  };
}

function render() {
  const d = read();
  const section = (title: string, body: string) => `<section><h3>${title}</h3>${body}</section>`;
  const contact = [d.phone && `<b>${esc(d.phone)}</b>`, d.place && esc(d.place)].filter(Boolean).join(' &nbsp;·&nbsp; ');
  let html = `<h2 class="cv-name">${d.name ? esc(d.name) : 'Seu nome aqui'}</h2>`;
  html += `<p class="cv-contact">${contact || 'Telefone e bairro aparecem aqui'}</p>`;
  html += section('O que sei fazer', d.skills.length
    ? `<ul class="cv-skills">${d.skills.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`
    : '<p class="cv-empty">Marque o que você sabe fazer. É a parte mais importante.</p>');
  if (d.jobs.length) html += section('Onde já trabalhei', d.jobs.map(j => {
    const sub = [j.where.trim(), j.time.trim()].filter(Boolean).join(' · ');
    return `<div class="cv-job"><b>${esc(j.what.trim())}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</div>`;
  }).join(''));
  if (d.courses.length) html += section('Cursos', d.courses.map(c => `<p class="cv-line">${esc(c)}</p>`).join(''));
  if (d.school) html += section('Escolaridade', `<p class="cv-line">${esc(d.school)}</p>`);
  if (d.availability.length) html += section('Disponibilidade', `<p class="cv-line">${esc(d.availability.join(' · '))}</p>`);
  sheet.innerHTML = html;

  const missing = [!d.name && 'o nome', !d.phone && 'o telefone', !d.skills.length && 'o que você sabe fazer'].filter(Boolean);
  $('cv-missing').textContent = missing.length ? `Falta ${missing.join(', ')}.` : 'Pronto pra imprimir.';
  boxes('.cv-check input').forEach(b => b.closest('.cv-check')?.classList.toggle('on', b.checked));
  $('cv-license-wrap').hidden = !input('cv-license').checked;
}

/* ---------- Listen: the phone reads the résumé aloud, offline, so whoever can't read can check it ---------- */

function spoken() {
  const d = read();
  const parts = [`Currículo de ${d.name || 'nome não preenchido'}.`];
  // Digit by digit, so a phone number is not read as one big number.
  if (d.phone) parts.push(`Telefone: ${d.phone.replace(/\d/g, n => `${n} `)}.`);
  if (d.place) parts.push(`Mora em ${d.place}.`);
  if (d.skills.length) parts.push(`Sei fazer: ${d.skills.join(', ')}.`);
  d.jobs.forEach(j => parts.push(`Já trabalhei com ${j.what.trim()}${j.where.trim() ? `, ${j.where.trim()}` : ''}${j.time.trim() ? `, por ${j.time.trim()}` : ''}.`));
  if (d.courses.length) parts.push(`Cursos: ${d.courses.join(', ')}.`);
  if (d.school) parts.push(`Escolaridade: ${d.school}.`);
  if (d.availability.length) parts.push(`Disponível: ${d.availability.join(', ')}.`);
  parts.push('Fim do currículo.');
  return parts.join(' ');
}

const say = (message: string) => { const el = $('cv-say'); el.textContent = message; el.hidden = false; };
const listenLabel = $('cv-listen').querySelector('span')!;
let speaking = false;
function stopSpeaking() {
  try { speechSynthesis.cancel(); } catch { /* nothing to stop */ }
  speaking = false;
  listenLabel.textContent = 'Ouvir meu currículo';
}

$('cv-listen').addEventListener('click', () => {
  if (!('speechSynthesis' in window)) { say('Este navegador não sabe ler em voz alta. No celular Android e no iPhone funciona.'); return; }
  if (speaking) { stopSpeaking(); return; }
  try {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(spoken());
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95;
    const voice = speechSynthesis.getVoices().find(v => /pt[-_]BR/i.test(v.lang));
    if (voice) utterance.voice = voice;
    utterance.onend = stopSpeaking;
    utterance.onerror = () => { stopSpeaking(); say('O aparelho não conseguiu falar agora. Tente de novo.'); };
    speechSynthesis.speak(utterance);
    speaking = true;
    listenLabel.textContent = 'Parar de ouvir';
    say('Ouça e confira se está tudo certo. Aperte de novo pra parar.');
  } catch {
    stopSpeaking();
    say('O aparelho não conseguiu falar agora.');
  }
});

$('cv-print').addEventListener('click', () => {
  stopSpeaking();
  window.print();
});

/* ---------- Form events ---------- */

form.addEventListener('input', e => {
  const target = e.target as HTMLInputElement;
  const field = target.dataset.jf as keyof Omit<Job, 'id'> | undefined;
  if (field) {
    const job = jobs.find(j => String(j.id) === target.closest<HTMLElement>('[data-job]')?.dataset.job);
    if (job) job[field] = target.value;
  }
  render();
});
form.addEventListener('change', render);

function addChip(inputId: string, list: string[]) {
  const el = input(inputId);
  const text = el.value.trim();
  if (!text) return;
  if (!list.includes(text)) list.push(text);
  el.value = '';
  drawChips(); render(); el.focus();
}
$('cv-skill-add').addEventListener('click', () => addChip('cv-skill-new', extraSkills));
$('cv-course-add').addEventListener('click', () => addChip('cv-course-new', courses));
for (const [id, list] of [['cv-skill-new', () => extraSkills], ['cv-course-new', () => courses]] as const) {
  input(id).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addChip(id, list()); } });
}

form.addEventListener('click', e => {
  const data = (e.target as HTMLElement).dataset;
  if (data.rmSkill !== undefined) { extraSkills.splice(Number(data.rmSkill), 1); drawChips(); render(); }
  if (data.rmCourse !== undefined) { courses.splice(Number(data.rmCourse), 1); drawChips(); render(); }
  if (data.rmJob !== undefined) { jobs = jobs.filter(j => String(j.id) !== data.rmJob); drawJobs(); render(); }
});

$('cv-job-add').addEventListener('click', () => {
  jobs.push({ id: ++jobSeq, what: '', where: '', time: '' });
  drawJobs(); render();
  $('cv-jobs').querySelector<HTMLInputElement>('.cv-job-box:last-child input')?.focus();
});

function clearAll() {
  form.reset();
  extraSkills = []; courses = []; jobs = [];
  drawJobs(); drawChips(); render();
}
$('cv-clear').addEventListener('click', () => {
  clearAll();
  say('Tudo apagado. Agora preencha com os seus dados.');
  input('cv-name').focus();
});

$('cv-example').addEventListener('click', () => {
  clearAll();
  input('cv-name').value = EXAMPLE.name;
  input('cv-phone').value = EXAMPLE.phone;
  input('cv-district').value = EXAMPLE.district;
  input('cv-city').value = EXAMPLE.city;
  boxes('[data-skill]').forEach(b => { b.checked = EXAMPLE.skills.includes(b.dataset.skill!); });
  boxes('[data-shift]').forEach(b => { b.checked = EXAMPLE.shifts.includes(b.dataset.shift!); });
  $<HTMLSelectElement>('cv-school').value = EXAMPLE.school;
  extraSkills = EXAMPLE.extraSkills.slice();
  courses = EXAMPLE.courses.slice();
  jobs = EXAMPLE.jobs.map(j => ({ id: ++jobSeq, ...j }));
  drawJobs(); drawChips(); render();
  say('Este é um exemplo inventado. Aperte Apagar tudo pra fazer o seu.');
});

/* ---------- Tabs on the phone; both panes side by side from 960px ---------- */

const tabs = [['cv-tab-form', 'cv-pane-form'], ['cv-tab-sheet', 'cv-pane-sheet']] as const;
for (const [tab] of tabs) {
  $(tab).addEventListener('click', () => {
    for (const [other, pane] of tabs) {
      $(other).setAttribute('aria-selected', String(other === tab));
      $(pane).hidden = other !== tab;
    }
    if (tab === 'cv-tab-sheet') $('cv-pane-sheet').scrollIntoView({ block: 'start' });
  });
}

drawJobs(); drawChips(); render();
