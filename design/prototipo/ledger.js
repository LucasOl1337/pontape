/* global window, crypto, TextEncoder, setTimeout */
// Public ledger for the prototype: how each action reads, how it is drawn and how "Conferir" checks it.
// Follows the F08 contract (docs/transparencia/CONTRATO.md, src/lib/ledger/schema.ts): closed payloads,
// no free text or URL; every sentence comes from the action map below. In the real site (F07 step 1)
// the types, the verifier and the seeded ledger come from F08; this file only shows the experience.
(() => {
  'use strict';
  const { $, $$, icon, escapeHtml, brl, reducedMotion } = window.VN;
  const DATA = window.VN_LEDGER;
  const REPOSITORY_URL = 'https://github.com/LucasOl1337/VidaNova';

  const TYPES = {
    finance: { label: 'Dinheiro', icon: 'coin' },
    field: { label: 'Vida real', icon: 'package' },
    candidate: { label: 'Candidato', icon: 'person' },
    project: { label: 'Projeto', icon: 'flag' },
  };
  // Money going out, by contract category. Donations are the money coming in.
  const CATEGORIES = [
    { id: 'food', name: 'Comida', spent: 'Gasto com comida', icon: 'plate', color: 'var(--color-sun)' },
    { id: 'clothing', name: 'Roupa', spent: 'Gasto com roupa', icon: 'shirt', color: 'var(--color-indigo)' },
    { id: 'hygiene', name: 'Higiene', spent: 'Gasto com higiene', icon: 'soap', color: '#5CC8B5' },
    { id: 'operations', name: 'Operação', spent: 'Custo de operação', icon: 'wrench', color: 'var(--color-ink-2)' },
    { id: 'fee', name: 'Tarifas', spent: 'Tarifa', icon: 'receipt', color: '#A78BFA' },
    { id: 'refund', name: 'Devoluções', spent: 'Devolução de doação', icon: 'undo', color: '#E9E4D8' },
  ];
  const EVIDENCE = { pending: 'Comprovante pendente', not_published: 'Comprovante não publicado' };
  const plural = (n, one, many) => `${n} ${Number(n) === 1 ? one : many}`;

  // The only source of a line's sentence: action (+ closed fields) to PT-BR.
  function phrase(p) {
    switch (p.type) {
      case 'project':
        if (p.action === 'repository_created') return 'Repositório do projeto criado';
        if (p.action === 'decision_recorded') return `Decisão ${p.decisionId} registrada`;
        return `PR #${p.pullRequest} integrada`;
      case 'finance':
        if (p.action === 'reversal') return `Estorno da ação nº ${p.correctionOf}`;
        return p.category === 'donation' ? 'Doação recebida' : CATEGORIES.find(c => c.id === p.category).spent;
      case 'field':
        if (p.action === 'food_delivered') return plural(p.quantity, 'entrega de comida', 'entregas de comida');
        if (p.action === 'clothing_delivered') return plural(p.quantity, 'entrega de roupa', 'entregas de roupa');
        return plural(p.quantity, 'kit de higiene entregue', 'kits de higiene entregues');
      case 'candidate':
        if (p.action === 'contact_completed') return plural(p.count, 'contato feito', 'contatos feitos');
        if (p.action === 'interview_completed') return plural(p.count, 'entrevista concluída', 'entrevistas concluídas');
        if (p.action === 'referral_completed') return plural(p.count, 'encaminhamento pra vaga', 'encaminhamentos pra vaga');
        return plural(p.count, 'apoio dos primeiros dias concluído', 'apoios dos primeiros dias concluídos');
    }
    return '';
  }
  const PROJECT_KIND = { repository_created: 'repositório', decision_recorded: 'decisão', pull_request_merged: 'mudança' };

  // Same rule as projectSourceUrl in src/lib/ledger/schema.ts: links come only from closed references.
  function projectSourceUrl(p) {
    if (p.type !== 'project') return null;
    if (p.action === 'repository_created') return REPOSITORY_URL;
    if (p.action === 'decision_recorded') return `${REPOSITORY_URL}/blob/${p.sourceCommit}/docs/DECISOES.md`;
    return `${REPOSITORY_URL}/pull/${p.pullRequest}`;
  }

  const shortHash = h => `${h.slice(0, 4)} ${h.slice(4, 8)}`;
  const formatDay = iso => iso.split('-').reverse().join('/');
  function formatRecorded(iso) {
    const d = new Date(iso);
    const day = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const time = d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
    return `${day}, às ${time}`;
  }
  const centsToReais = c => Number(c) / 100;

  // sequence -> sequence of the later event that corrects it.
  function correctionsOf(events) {
    const map = {};
    for (const e of events) if (e.payload.correctionOf) map[e.payload.correctionOf] = e.sequence;
    return map;
  }

  function entryHTML(e, { isNew = false, correctedBy } = {}) {
    const p = e.payload;
    const t = TYPES[p.type];
    const facts = [];
    if (p.type === 'finance') {
      const delta = BigInt(p.amountCents);
      facts.push(`<span class="chain-amount ${delta > 0n ? 'is-in' : ''}">${delta > 0n ? '+' : '−'} ${brl.format(Math.abs(centsToReais(p.amountCents)))}</span>`);
      facts.push(`<span>${icon('clock')} ${EVIDENCE[p.evidence]}</span>`);
    }
    if (p.type === 'project') {
      facts.push(`<a href="${escapeHtml(projectSourceUrl(p))}" rel="noopener">${icon('lock')}Ver a fonte<span class="sr-only"> (repositório ainda fechado)</span></a>`);
    }
    if (p.type === 'candidate') facts.push('<span>Só a contagem. Sem nome, rosto, apelido ou lugar.</span>');
    if (p.type === 'field') facts.push('<span>Sem dizer quem recebeu nem onde.</span>');
    if (p.correctionOf && p.action !== 'reversal') facts.push(`<span>Corrige a ação nº ${p.correctionOf}</span>`);
    if (correctedBy) facts.push(`<span class="chain-corrected">${icon('undo')} ${p.type === 'finance' ? 'Estornada' : 'Corrigida'} pela nº ${correctedBy}</span>`);
    const kind = p.type === 'project' ? ` · ${PROJECT_KIND[p.action]}` : '';
    return `
      <li class="chain-entry ${isNew ? 'is-new' : ''}" data-seq="${e.sequence}" data-type="${p.type}">
        <span class="chain-node" aria-hidden="true">${e.sequence}</span>
        <div class="chain-card">
          <div class="chain-meta"><span class="type-chip">${icon(t.icon)}${t.label}${kind}</span><span class="sr-only">Ação nº ${e.sequence}.</span><time datetime="${p.occurredOn}">${formatDay(p.occurredOn)}</time></div>
          <p class="chain-title">${escapeHtml(phrase(p))}</p>
          ${facts.length ? `<p class="chain-facts">${facts.join('')}</p>` : ''}
          <div class="chain-seal">
            ${icon('link')}<code title="Marca desta ação">${shortHash(e.hash)}</code>
            <span>${e.sequence === '1' ? 'começo da corrente' : `presa na nº ${Number(e.sequence) - 1}`}</span>
            <details class="chain-full">
              <summary>marca inteira</summary>
              <dl><dt>Marca desta ação</dt><dd>${e.hash}</dd><dt>Marca da anterior</dt><dd>${e.previousHash}</dd><dt>Registrada em</dt><dd>${formatRecorded(e.recordedAt)}</dd></dl>
            </details>
          </div>
        </div>
      </li>`;
  }

  /* ---------- Chain math: same envelope and JCS as ledger/build-ledger.mjs ---------- */

  const canonical = v => Array.isArray(v)
    ? `[${v.map(canonical).join(',')}]`
    : v && typeof v === 'object'
      ? `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`
      : JSON.stringify(v);
  const canHash = !!(window.crypto && crypto.subtle);
  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  const hashEntry = e => sha256(canonical({
    schemaVersion: e.schemaVersion, sequence: e.sequence, previousHash: e.previousHash, recordedAt: e.recordedAt, payload: e.payload,
  }));

  // The swappable verifier: walks the chain from the first action, stops at the first break and says why.
  // Step 1 swaps this for the F08 verifier behind the same result shape.
  async function verify(events, onStep = () => {}) {
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      const expected = String(i + 1);
      if (e.sequence !== expected) return { ok: false, at: e.sequence, reason: 'missing', expected, checked: i };
      if (e.previousHash !== (i ? events[i - 1].hash : DATA.genesis)) return { ok: false, at: e.sequence, reason: 'link', checked: i };
      if (await hashEntry(e) !== e.hash) return { ok: false, at: e.sequence, reason: 'changed', checked: i };
      await onStep(e, i);
    }
    return { ok: true, checked: events.length };
  }

  async function append(events, { recordedAt, payload }) {
    const last = events[events.length - 1];
    const entry = { schemaVersion: 1, sequence: String(events.length + 1), previousHash: last ? last.hash : DATA.genesis, recordedAt, payload };
    entry.hash = await hashEntry(entry);
    events.push(entry);
    return entry;
  }

  // Sums every delta with BigInt, as the contract asks. Donations (and their reversals) are what came in.
  function money(events) {
    let inCents = 0n;
    let balance = 0n;
    const out = {};
    for (const e of events) {
      const p = e.payload;
      if (p.type !== 'finance') continue;
      const delta = BigInt(p.amountCents);
      balance += delta;
      if (p.category === 'donation') inCents += delta;
      else out[p.category] = (out[p.category] || 0n) - delta;
    }
    const outCents = Object.values(out).reduce((a, b) => a + b, 0n);
    const cat = Object.fromEntries(Object.entries(out).map(([k, v]) => [k, centsToReais(v)]));
    return { in: centsToReais(inCents), out: centsToReais(outCents), balance: centsToReais(balance), cat };
  }
  const countByType = events => Object.fromEntries(Object.keys(TYPES).map(k => [k, events.filter(e => e.payload.type === k).length]));
  // People and deliveries are counted by the numbers inside the events, not by lines.
  const sumOf = (events, type, field) => events.filter(e => e.payload.type === type).reduce((a, e) => a + Number(e.payload[field]), 0);
  const cloneEvents = list => list.map(e => ({ ...e, payload: { ...e.payload } }));

  /* ---------- The "Conferir" panel ---------- */

  const RESULTS = {
    idle: () => ({ state: 'idle', icon: 'shield', title: 'Ainda não conferido.', text: 'Aperte Conferir e o seu aparelho refaz as contas de cada ação.' }),
    ok: (r, events) => ({
      state: 'ok', icon: 'check-circle', title: 'Tudo certo.', text: 'Nada foi apagado nem mudado desde o começo.',
      detail: `${plural(r.checked, 'ação conferida', 'ações conferidas')}, da nº 1 até a nº ${r.checked}. Marca mais recente: ${shortHash(events[events.length - 1].hash)}.`,
    }),
    changed: r => ({ state: 'broken', icon: 'x-circle', title: `A corrente quebrou na ação nº ${r.at}.`, text: 'Alguém mudou essa linha depois que ela foi registrada.', detail: `As ${r.checked} ações antes dela estão certas. Dali pra frente, nada vale até alguém explicar.` }),
    link: r => ({ state: 'broken', icon: 'x-circle', title: `A ação nº ${r.at} não se prende à anterior.`, text: 'Alguma linha foi apagada ou trocada de lugar.', detail: `As ${r.checked} ações antes dela estão certas.` }),
    missing: r => ({ state: 'broken', icon: 'x-circle', title: `Falta a ação nº ${r.expected}.`, text: 'Alguma linha foi apagada.', detail: `As ${r.checked} ações antes dela estão certas.` }),
    unavailable: () => ({ state: 'broken', icon: 'x-circle', title: 'Não deu pra conferir aqui.', text: 'Este navegador não faz a conta SHA-256. Use o verificador aberto.' }),
  };

  // Wires a .verify panel to a list of events and to the chain drawn in `listEl`.
  function mountVerify(panel, { getEvents, listEl }) {
    const btn = $('[data-verify]', panel);
    const bar = $('.verify-progress', panel);
    const out = $('.verify-result', panel);
    const show = res => {
      out.dataset.state = res.state;
      out.innerHTML = `${icon(res.icon)}<div><p class="verify-title">${res.title}</p><p>${res.text}</p>${res.detail ? `<p class="verify-detail">${res.detail}</p>` : ''}</div>`;
    };
    const clearMarks = () => $$('.chain-entry', listEl).forEach(li => li.classList.remove('is-ok', 'is-broken', 'is-unchecked'));
    const reset = () => { clearMarks(); bar.hidden = true; show(RESULTS.idle()); };
    reset();
    btn.addEventListener('click', async () => {
      const events = getEvents();
      clearMarks();
      if (!canHash) { show(RESULTS.unavailable()); return; }
      btn.disabled = true;
      bar.hidden = false;
      show({ state: 'running', icon: 'shield', title: 'Conferindo…', text: `Refazendo a conta de ${events.length} ações, uma por uma.` });
      const pause = reducedMotion.matches ? 0 : Math.max(18, Math.min(70, 1200 / events.length));
      const r = await verify(events, async (e, i) => {
        $(`.chain-entry[data-seq="${e.sequence}"]`, listEl)?.classList.add('is-ok');
        bar.style.setProperty('--p', `${((i + 1) / events.length) * 100}%`);
        if (pause) await new Promise(res => setTimeout(res, pause));
      });
      if (!r.ok) {
        const broken = $(`.chain-entry[data-seq="${r.at}"]`, listEl);
        broken?.classList.add('is-broken');
        $$('.chain-entry', listEl).filter(li => Number(li.dataset.seq) > Number(r.at)).forEach(li => li.classList.add('is-unchecked'));
        broken?.scrollIntoView({ block: 'center', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      }
      show(r.ok ? RESULTS.ok(r, events) : RESULTS[r.reason](r));
      btn.disabled = false;
    });
    return { reset };
  }

  window.VN.ledger = {
    DATA, TYPES, CATEGORIES, phrase, entryHTML, correctionsOf, formatDay, formatRecorded, shortHash,
    verify, append, money, countByType, sumOf, cloneEvents, mountVerify,
  };
})();
