/* global window, location, URLSearchParams */
// /transparencia: the full public ledger, filters, sample mode with tamper demo and money.
(() => {
  'use strict';
  const { $, $$, icon, brl, toast, spokenBRL, SPEECH } = window.VN;
  const L = window.VN.ledger;
  const REAL = L.DATA.real;

  const params = new URLSearchParams(location.search);
  let mode = params.has('exemplo') ? 'sample' : 'real';
  let filter = L.TYPES[params.get('tipo')] ? params.get('tipo') : 'all';
  let sample = L.cloneEvents(L.DATA.sample);
  let incoming = [...L.DATA.sampleIncoming];
  let tampered = null;

  const events = () => (mode === 'real' ? REAL : sample);
  const chainEl = $('#ledger-chain');

  // Empty states only happen in the real ledger: sample mode has every type.
  const EMPTY = {
    finance: ['Nenhum real entrou nem saiu ainda.', 'A doação abre quando existir a conta oficial do projeto. Quando abrir, cada real aparece aqui, com comprovante. Aqui nunca vai ter número inventado.'],
    field: ['Nenhuma entrega na rua ainda.', 'Isso começa com o piloto. Cada comida, kit ou roupa entregue vira uma linha, sem dizer quem recebeu nem onde.'],
    candidate: ['Nenhum passo de candidato ainda.', 'A entrevista por voz ainda não abriu. Quando abrir, aparece aqui só a contagem: quantos contatos, entrevistas e encaminhamentos. Sem nome, rosto, apelido nem lugar.'],
    project: ['Nenhuma ação do projeto ainda.', ''],
  };

  /* ---------- Hero numbers (always the real ledger) ---------- */

  const realMoney = L.money(REAL);
  const last = REAL[REAL.length - 1];
  $('#stat-actions').textContent = String(REAL.length);
  $('#stat-in').textContent = brl.format(realMoney.in);
  $('#stat-out').textContent = brl.format(realMoney.out);
  $('#stat-head').textContent = L.shortHash(last.hash);
  $('#stat-updated').innerHTML = `${icon('clock')}<span>Livro estático. Última ação registrada em ${L.formatRecorded(last.recordedAt)}. A página é refeita sempre que entra uma ação nova.</span>`;

  // Decorative: the four newest actions stacked as linked blocks.
  $('#chain-art').innerHTML = REAL.slice(-4).reverse().map((e, i) => `${i ? '<li class="art-link"></li>' : ''}
    <li data-type="${e.payload.type}">${icon(L.TYPES[e.payload.type].icon)}<span>${L.shortHash(e.hash)}</span><span class="art-seq">nº ${e.sequence}</span></li>`).join('');

  /* ---------- Filters and list ---------- */

  function renderFilters() {
    const counts = L.countByType(events());
    $('#type-filters').innerHTML = [['all', 'Todas', events().length, ''], ...Object.entries(L.TYPES).map(([k, t]) => [k, t.label, counts[k], icon(t.icon)])]
      .map(([k, label, n, ic]) => `<button class="filter" type="button" data-type-filter="${k}" aria-pressed="${k === filter}">${ic}${label}<span class="count">${n}</span></button>`)
      .join('');
  }
  function renderList(newSeq) {
    const corrected = L.correctionsOf(events());
    const list = events().filter(e => filter === 'all' || e.payload.type === filter).slice().reverse();
    chainEl.innerHTML = list.map(e => L.entryHTML(e, { isNew: e.sequence === newSeq, correctedBy: corrected[e.sequence] })).join('');
    const empty = $('#ledger-empty');
    empty.hidden = list.length > 0;
    if (!list.length) {
      const [title, text] = EMPTY[filter];
      empty.innerHTML = `${icon(L.TYPES[filter].icon)}<p class="chain-empty-title">${title}</p><p>${text}</p>`;
    }
  }

  const bars = $('#bars');
  bars.innerHTML = L.CATEGORIES.map(c => `
    <li data-cat="${c.id}">
      <div class="bar-head"><span class="bar-name">${icon(c.icon)}${c.name}</span><span class="bar-value"><span data-value>R$ 0,00</span><small data-share>0%</small></span></div>
      <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="--fill:${c.color}"></div></div>
    </li>`).join('');
  function renderMoney() {
    const t = L.money(events());
    $('[data-total="in"]').textContent = brl.format(t.in);
    $('[data-total="out"]').textContent = brl.format(t.out);
    $('[data-total="balance"]').textContent = brl.format(t.balance);
    L.CATEGORIES.forEach(c => {
      const v = t.cat[c.id] || 0;
      const share = t.out ? (v / t.out) * 100 : 0;
      const li = $(`[data-cat="${c.id}"]`, bars);
      $('[data-value]', li).textContent = brl.format(v);
      $('[data-share]', li).textContent = `${Math.round(share)}%`;
      const fill = $('.bar-fill', li);
      fill.style.setProperty('--p', `${share}%`);
      fill.classList.toggle('has-value', v > 0);
    });
    $('#why-zero').hidden = mode === 'sample';
    $('#money-sample').hidden = mode === 'real';
  }

  function renderMode() {
    const isSample = mode === 'sample';
    $$('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    $('#sample-banner').hidden = !isSample;
    $('#sample-tools').hidden = !isSample;
    $('#ledger-list').classList.toggle('is-sample', isSample);
    $('#download-ledger').setAttribute('href', isSample ? 'ledger/sample.json' : 'ledger/real.json');
    $('#download-ledger').lastChild.textContent = isSample ? 'Baixar o exemplo' : 'Baixar o livro inteiro';
    updateSampleTools();
  }
  function updateSampleTools() {
    $('#sample-append').disabled = !incoming.length;
    $('#sample-tamper').hidden = !!tampered;
    $('#sample-undo').hidden = !tampered;
  }
  function renderAll(newSeq) {
    renderFilters();
    renderList(newSeq);
    renderMoney();
    renderMode();
  }

  const verifyCtl = L.mountVerify($('#page-verify'), { getEvents: events, listEl: chainEl });

  $('#type-filters').addEventListener('click', e => {
    const btn = e.target.closest('[data-type-filter]');
    if (!btn) return;
    filter = btn.dataset.typeFilter;
    renderFilters();
    renderList();
    verifyCtl.reset();
  });
  $$('[data-mode]').forEach(btn => btn.addEventListener('click', () => {
    if (mode === btn.dataset.mode) return;
    mode = btn.dataset.mode;
    filter = 'all';
    renderAll();
    verifyCtl.reset();
  }));

  /* ---------- Sample tools: a new action arrives; someone edits a line in secret ---------- */

  $('#sample-append').addEventListener('click', async () => {
    const entry = await L.append(sample, incoming.shift());
    filter = 'all';
    renderAll(entry.sequence);
    verifyCtl.reset();
    toast(`Entrou a ação nº ${entry.sequence}, presa na nº ${Number(entry.sequence) - 1}.`);
  });
  $('#sample-tamper').addEventListener('click', () => {
    const target = sample.find(e => e.payload.category === 'clothing');
    tampered = { seq: target.sequence, amount: target.payload.amountCents };
    target.payload.amountCents = String(Math.round(Number(target.payload.amountCents) / 10));
    renderAll();
    verifyCtl.reset();
    toast(`Mudamos o valor da ação nº ${target.sequence} de ${brl.format(Math.abs(tampered.amount) / 100)} pra ${brl.format(Math.abs(Number(target.payload.amountCents)) / 100)}, sem avisar. Agora aperte Conferir.`);
  });
  $('#sample-undo').addEventListener('click', () => {
    sample.find(e => e.sequence === tampered.seq).payload.amountCents = tampered.amount;
    tampered = null;
    renderAll();
    verifyCtl.reset();
    toast('Mudança desfeita. O livro voltou ao que era.');
  });

  /* ---------- Speech ---------- */

  const countsSpoken = list => {
    const c = L.countByType(list);
    return `Dinheiro: ${c.finance}. Vida real: ${c.field}. Candidato: ${c.candidate}. Projeto: ${c.project}.`;
  };
  Object.assign(SPEECH, {
    livro: () => `Livro público. Tudo que o projeto faz, à vista. Hoje o livro tem ${REAL.length} ações. ${countsSpoken(REAL)} ` +
      `Entrou ${spokenBRL(realMoney.in)} e saiu ${spokenBRL(realMoney.out)}, porque a doação ainda não abriu. ` +
      'Toda ação aparece. Quem é a pessoa, não.',
    acoes: () => {
      const list = events().slice(-5).reverse();
      return `${mode === 'sample' ? 'Isto é um exemplo, com ações inventadas. ' : ''}São ${events().length} ações. As mais novas: ` +
        list.map(e => `${L.phrase(e.payload)}.`).join(' ');
    },
    dinheiro: () => {
      const t = L.money(events());
      return mode === 'sample'
        ? `Exemplo com valores inventados. Entrou ${spokenBRL(t.in)}. Saiu ${spokenBRL(t.out)}. Em caixa, ${spokenBRL(t.balance)}.`
        : 'Entrou zero real e saiu zero real. A doação só abre quando existir uma conta oficial do projeto. Aqui nunca vai ter número inventado.';
    },
  });

  renderAll();
})();
