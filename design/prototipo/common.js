/* global window, document, matchMedia, localStorage, speechSynthesis, SpeechSynthesisUtterance, IntersectionObserver, requestAnimationFrame, addEventListener, scrollY, setTimeout, clearTimeout */
// Shared by index.html and transparencia.html: name, icons, statuses, speech, header, toast.
(() => {
  'use strict';

  // Provisional name: change it here and every page, tab title and spoken text follow.
  const PROJECT_NAME = 'VidaNova';
  const STATUS_DATE = '22/09/2026';
  const STATUS_DATE_SPOKEN = '22 de setembro de 2026';

  // Icons live here so both pages share one sprite without a build step.
  document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <symbol id="i-plate" viewBox="0 0 24 24"><circle cx="15" cy="12" r="6.5"/><circle cx="15" cy="12" r="3"/><path d="M3 3.5v5a1.5 1.5 0 0 0 3 0v-5M4.5 10v10.5"/></symbol>
  <symbol id="i-shirt" viewBox="0 0 24 24"><path d="M8.5 3 3.5 5.5 2 10.5l3 1.2V21h14v-9.3l3-1.2-1.5-5L15.5 3a3.5 3.5 0 0 1-7 0Z"/></symbol>
  <symbol id="i-soap" viewBox="0 0 24 24"><rect x="2.5" y="11" width="14" height="9.5" rx="3"/><path d="M6 15.5h7"/><circle cx="17.5" cy="6" r="2.5"/><circle cx="10.5" cy="6.5" r="1.5"/><circle cx="20.5" cy="11.5" r="1"/></symbol>
  <symbol id="i-briefcase" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 7V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2M3 12.5h18M12 11v3"/></symbol>
  <symbol id="i-voice-ai" viewBox="0 0 24 24"><path d="M4 4.5h16v11.5H10l-6 4.5Z"/><path d="M9 8.5v4M12 7.5v6M15 9v3"/></symbol>
  <symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21.5s-7-6.3-7-12a7 7 0 0 1 14 0c0 5.7-7 12-7 12Z"/><circle cx="12" cy="9.5" r="2.5"/></symbol>
  <symbol id="i-mic" viewBox="0 0 24 24"><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3.5M8.5 21h7"/></symbol>
  <symbol id="i-check-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8 5.2-5.8"/></symbol>
  <symbol id="i-chart" viewBox="0 0 24 24"><path d="M3.5 20.5h17M7 20.5v-6M12 20.5v-11M17 20.5v-8.5"/><path d="m5 9 5-4.5 3.5 2.5L19 3"/></symbol>
  <symbol id="i-speaker" viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z"/><path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></symbol>
  <symbol id="i-stop" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2.5"/></symbol>
  <symbol id="i-phone" viewBox="0 0 24 24"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M11 18.5h2"/></symbol>
  <symbol id="i-people" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20.5a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14a5 5 0 0 1 5 5.5"/></symbol>
  <symbol id="i-arrow-right" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
  <symbol id="i-arrow-left" viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></symbol>
  <symbol id="i-chevron-down" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></symbol>
  <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></symbol>
  <symbol id="i-cone" viewBox="0 0 24 24"><path d="M10 3.5h4L18.5 19h-13ZM3 20.5h18M8.2 11h7.6M6.9 15.2h10.2"/></symbol>
  <symbol id="i-alert" viewBox="0 0 24 24"><path d="M12 3.5 21.5 20h-19Z"/><path d="M12 10v4.5M12 17.2v.3"/></symbol>
  <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></symbol>
  <symbol id="i-code" viewBox="0 0 24 24"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4.5l-3 15"/></symbol>
  <symbol id="i-coin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M14.8 9.2c-.5-.9-1.6-1.4-2.8-1.4-1.6 0-2.8.9-2.8 2.1 0 2.8 5.6 1.4 5.6 4.2 0 1.2-1.2 2.1-2.8 2.1-1.2 0-2.3-.5-2.8-1.4M12 6.2v1.6M12 16.2v1.6"/></symbol>
  <symbol id="i-eye" viewBox="0 0 24 24"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></symbol>
  <symbol id="i-receipt" viewBox="0 0 24 24"><path d="M6 2.5h12v19l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5Z"/><path d="M9 7.5h6M9 11h6M9 14.5h3.5"/></symbol>
  <symbol id="i-doc" viewBox="0 0 24 24"><path d="M6 2.5h8l4 4v15H6Z"/><path d="M14 2.5v4h4M9 12h6M9 15.5h6"/></symbol>
  <symbol id="i-folder" viewBox="0 0 24 24"><path d="M3 6.5a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></symbol>
  <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
  <symbol id="i-pause" viewBox="0 0 24 24"><path d="M9 5.5v13M15 5.5v13"/></symbol>
  <symbol id="i-play" viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5Z"/></symbol>
  <symbol id="i-lock" viewBox="0 0 24 24"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5v-3a4 4 0 0 1 8 0v3"/></symbol>
  <symbol id="i-link" viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></symbol>
  <symbol id="i-bus" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="14" rx="3"/><path d="M4 10.5h16M8 17v3M16 17v3M8 13.8h.01M16 13.8h.01"/></symbol>
  <symbol id="i-wrench" viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.3 5.3l-6 6a1.8 1.8 0 0 0 2.6 2.6l6-6a4 4 0 0 0 5.3-5.3l-2.5 2.5-2.4-.6-.6-2.4Z"/></symbol>
  <symbol id="i-bulb" viewBox="0 0 24 24"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/></symbol>
  <symbol id="i-package" viewBox="0 0 24 24"><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5Z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9M7.8 5.2l8.5 4.6"/></symbol>
  <symbol id="i-person" viewBox="0 0 24 24"><circle cx="12" cy="7.5" r="3.5"/><path d="M5 20.5a7 7 0 0 1 14 0"/></symbol>
  <symbol id="i-flag" viewBox="0 0 24 24"><path d="M5 21V4M5 4.5h11l-2 3.5 2 3.5H5"/></symbol>
  <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></symbol>
  <symbol id="i-download" viewBox="0 0 24 24"><path d="M12 3.5v11M7 10l5 5 5-5M4.5 20.5h15"/></symbol>
  <symbol id="i-pen" viewBox="0 0 24 24"><path d="M15.5 4.5 19.5 8.5 8.5 19.5H4.5v-4Z"/><path d="m13 7 4 4"/></symbol>
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></symbol>
  <symbol id="i-scale" viewBox="0 0 24 24"><path d="M12 3.5v17M7 20.5h10M4 7.5h16M6.5 7.5 3.5 14a3 3 0 0 0 6 0Zm11 0-3 6.5a3 3 0 0 0 6 0Z"/></symbol>
  <symbol id="i-sprout" viewBox="0 0 24 24"><path d="M12 20.5v-8"/><path d="M12 12.5C12 8 9 5.5 4.5 5.5 4.5 10 7.5 12.5 12 12.5ZM12 10.5c0-3.5 2.5-6 7.5-6 0 4-2.5 6-7.5 6Z"/></symbol>
  <symbol id="i-x-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/></symbol>
  <symbol id="i-merge" viewBox="0 0 24 24"><circle cx="6" cy="5.5" r="2.5"/><circle cx="6" cy="18.5" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path d="M6 8v8M6 8c0 3 3 4 9.5 4"/></symbol>
  <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
  <symbol id="i-undo" viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></symbol>
</svg>`);

  const root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const icon = (id, cls = '') => `<svg class="icon ${cls}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const withName = s => s.replaceAll('{name}', PROJECT_NAME);
  const joinList = items => items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;

  document.title = withName(document.body.dataset.pageTitle || '{name}');
  $$('[data-name]').forEach(el => { el.textContent = PROJECT_NAME; });
  $$('[data-status-date]').forEach(el => { el.textContent = STATUS_DATE; });

  // Public labels of each module status (D011: "Precisa de ajuda" for bottlenecks).
  const STATUSES = {
    live: { label: 'Funcionando', icon: 'check', meaning: 'Já está no ar e dá pra usar.' },
    building: { label: 'Em construção', icon: 'cone', meaning: 'A equipe está fazendo agora.' },
    bottleneck: { label: 'Precisa de ajuda', icon: 'alert', meaning: 'Ainda não sabemos resolver. Aqui sua ajuda vale mais.' },
    planned: { label: 'Planejado', icon: 'clock', meaning: 'Está no plano. Ainda não começou.' },
  };
  const badge = (status, text) => `<span class="badge badge--${status}">${icon(STATUSES[status].icon)}${escapeHtml(text || STATUSES[status].label)}</span>`;

  /* ---------- Toast ---------- */

  let toastTimer;
  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('shown'), 4200);
  }

  /* ---------- Listen (browser speech synthesis) ---------- */

  const speech = { button: null };
  function setSpeaking(btn, on) {
    btn.classList.toggle('speaking', on);
    btn.setAttribute('aria-pressed', String(on));
    const label = $('.label', btn);
    if (label) label.textContent = on ? 'Parar' : 'Ouvir';
    const use = $('use', btn);
    if (use && !btn.classList.contains('voice-btn')) use.setAttribute('href', on ? '#i-stop' : '#i-speaker');
  }
  function stopSpeech() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (speech.button) setSpeaking(speech.button, false);
    speech.button = null;
  }
  function speak(text, btn) {
    if (!('speechSynthesis' in window)) { toast('Este navegador não consegue ler em voz alta.'); return; }
    const sameButton = speech.button === btn;
    stopSpeech();
    if (sameButton) return;
    const voices = speechSynthesis.getVoices();
    const voice = voices.find(v => /^pt[-_]BR/i.test(v.lang)) || voices.find(v => /^pt/i.test(v.lang));
    if (voices.length && !voice) { toast('Seu aparelho não tem voz em português instalada.'); return; }
    const sentences = withName(text).replace(/\s+/g, ' ').match(/[^.!?]+[.!?]*/g) || [text];
    speech.button = btn;
    setSpeaking(btn, true);
    sentences.forEach((sentence, i) => {
      const u = new SpeechSynthesisUtterance(sentence.trim());
      u.lang = 'pt-BR';
      if (voice) u.voice = voice;
      u.rate = 0.95;
      if (i === sentences.length - 1) u.onend = () => { if (speech.button === btn) stopSpeech(); };
      u.onerror = e => {
        if (speech.button !== btn || e.error === 'interrupted' || e.error === 'canceled') return;
        stopSpeech();
        toast('Não deu pra ler em voz alta neste aparelho.');
      };
      speechSynthesis.speak(u);
    });
    if (!voices.length) {
      setTimeout(() => {
        if (speech.button === btn && !speechSynthesis.speaking) {
          stopSpeech();
          toast('Seu aparelho não tem voz em português instalada.');
        }
      }, 1500);
    }
  }
  if ('speechSynthesis' in window) speechSynthesis.getVoices();

  const spokenBRL = v => {
    const whole = Math.floor(v + 1e-9);
    const cents = Math.round((v - whole) * 100);
    const base = whole === 0 && !cents ? 'zero real' : `${whole.toLocaleString('pt-BR')} ${whole === 1 ? 'real' : 'reais'}`;
    return cents ? `${base} e ${cents} centavos` : base;
  };

  // Pages register generated speech here, keyed by the data-listen target.
  const SPEECH = {};

  /* ---------- Global clicks ---------- */

  document.addEventListener('click', e => {
    const listen = e.target.closest('[data-listen]');
    if (listen) {
      const target = listen.dataset.listen;
      const text = SPEECH[target] ? SPEECH[target]() : document.getElementById(target)?.dataset.speech;
      if (text) speak(text, listen);
      return;
    }
    const close = e.target.closest('[data-close]');
    if (close) { close.closest('dialog').close(); return; }
    if (e.target.matches('dialog')) { e.target.close(); return; }
    const proto = e.target.closest('[data-prototype]');
    if (proto) { e.preventDefault(); toast(`Protótipo. ${proto.dataset.prototype}`); }
  });

  /* ---------- Header: menu, A+, border on scroll ---------- */

  const header = $('.site-header');
  const menuBtn = $('#menu-btn');
  const closeMenu = () => { header.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', 'false'); };
  menuBtn.addEventListener('click', () => menuBtn.setAttribute('aria-expanded', String(header.classList.toggle('menu-open'))));
  $$('.site-nav a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && header.classList.contains('menu-open')) { closeMenu(); menuBtn.focus(); }
  });

  const textSizeBtn = $('#text-size-btn');
  const setLargeText = on => { root.classList.toggle('large-text', on); textSizeBtn.setAttribute('aria-pressed', String(on)); };
  try { setLargeText(localStorage.getItem('large-text') === '1'); } catch { /* no storage: keep default size */ }
  textSizeBtn.addEventListener('click', () => {
    const on = !root.classList.contains('large-text');
    setLargeText(on);
    try { localStorage.setItem('large-text', on ? '1' : '0'); } catch { /* same */ }
    toast(on ? 'Texto maior ligado.' : 'Texto no tamanho normal.');
  });

  let scrollTicking = false;
  addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => { header.classList.toggle('scrolled', scrollY > 8); scrollTicking = false; });
  }, { passive: true });

  /* ---------- Blocks entering the viewport ---------- */

  const revealables = $$('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    revealables.forEach(el => io.observe(el));
  } else {
    revealables.forEach(el => el.classList.add('visible'));
  }

  window.VN = {
    PROJECT_NAME, STATUS_DATE, STATUS_DATE_SPOKEN, STATUSES, SPEECH,
    $, $$, reducedMotion, icon, brl, escapeHtml, withName, joinList, badge, toast, speak, stopSpeech, spokenBRL,
  };
})();
