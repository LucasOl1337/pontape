/* global window, document, location, history, addEventListener */
// Home page: modules, journey, compare, ledger teaser and open contributions.
(() => {
  'use strict';
  const { $, $$, reducedMotion, icon, brl, escapeHtml, withName, joinList, badge, stopSpeech, spokenBRL,
    STATUSES, STATUS_DATE, STATUS_DATE_SPOKEN, SPEECH } = window.VN;
  const L = window.VN.ledger;

  /* ---------- Data ---------- */

  // One block per PRD §5 module. Status as of STATUS_DATE.
  const MODULES = [
    { id: 'M1', name: 'Site público', status: 'building',
      summary: 'Esta página. Explica o projeto e mostra tudo em aberto.',
      what: 'A porta de entrada do projeto. Mostra o que é, como funciona, o livro público e o que ainda falta.',
      how: 'Cada parte do projeto vira um bloco com estado: funcionando, em construção, precisa de ajuda ou planejado.',
      operation: 'Feito pela equipe e por quem quiser contribuir. Pensado pra abrir rápido em celular barato.',
      strength: 'Tudo num lugar só, sem esconder o que ainda não funciona.',
      missing: 'O nome definitivo e o endereço na internet.',
      helpers: 'Design, texto simples, acessibilidade, código.' },
    { id: 'M2', name: 'Doação e transparência total', status: 'bottleneck',
      summary: 'Um livro público de todas as ações, que qualquer pessoa confere. E, quando abrir, a doação.',
      what: 'Um livro público com toda ação do projeto: dinheiro, entrega na rua, passo de candidato e decisão.',
      how: 'Cada ação vira uma linha presa na anterior por uma marca. Mudou uma linha, a corrente quebra, e qualquer pessoa vê.',
      operation: 'A equipe registra cada ação e cobre o dado pessoal antes de publicar. O botão Conferir refaz as contas no aparelho de quem olha.',
      strength: 'Ninguém precisa confiar na gente: dá pra conferir.',
      missing: 'Receber doação pede estrutura legal e conta oficial. Isso ainda não existe.',
      helpers: 'Advogado do terceiro setor, contador, quem entende de criptografia e prestação de contas pública.' },
    { id: 'M3', name: 'Captação de candidatos', status: 'bottleneck',
      summary: 'Encontrar quem quer mudar de vida de fato.',
      what: 'Os jeitos de chegar até a pessoa: voluntário na rua, panfleto, ponto público e este site.',
      how: 'A pessoa é convidada pra uma conversa curta. De graça e sem compromisso.',
      operation: 'Voluntários treinados vão até onde a pessoa está. Panfleto e ponto público chamam quem passa.',
      strength: 'Vários caminhos. Quem não tem celular também chega.',
      missing: 'Como saber quem quer mudar de vida de fato, sem deixar de fora quem mais precisa.',
      helpers: 'Assistência social, abrigo, organização que já trabalha na rua.' },
    { id: 'M4', name: 'Entrevista por voz', status: 'bottleneck',
      summary: 'Uma conversa por voz com IA. Não precisa ler nem escrever.',
      what: 'Uma IA que conversa pela voz, e talvez com imagem, pra conhecer a pessoa e o que ela quer.',
      how: 'A pessoa fala, a IA escuta e responde falando. A conversa é curta e simples.',
      operation: 'No celular do voluntário, com ele sempre junto.',
      strength: 'Quem lê pouco ou não lê passa pela conversa do mesmo jeito.',
      missing: 'Entender sotaque, gíria e barulho de rua. E um aparelho barato que aguente o dia a dia.',
      helpers: 'Engenharia de voz, hardware, quem desenha conversa pra quem não lê.' },
    { id: 'M5', name: 'Ponte inicial', status: 'planned',
      summary: 'Comida, roupa e higiene nos primeiros dias.',
      what: 'O básico pra pessoa se reerguer: comer por alguns dias, roupa nova e limpa, higiene.',
      how: 'O dinheiro vem da doação. Cada compra e cada entrega entram no livro público.',
      operation: 'Compra direta ou com parceiros: mercado, loja de roupa, ponto de banho.',
      strength: 'Ajuda concreta, na hora em que faz mais diferença.',
      missing: 'Achar parceiros e entregar sem burocracia e sem constrangimento.',
      helpers: 'Mercado, loja de roupa, ponto de banho, quem entende de logística.' },
    { id: 'M6', name: 'Rede de oportunidades', status: 'planned',
      summary: 'Levar quem foi escolhido até uma vaga de trabalho.',
      what: 'Uma rede que liga as pessoas escolhidas a quem oferece trabalho.',
      how: 'O perfil vai pra redes de emprego sem expor quem a pessoa é. Empresas e pessoas oferecem vaga.',
      operation: 'A equipe faz a ponte e acompanha os primeiros meses.',
      strength: 'Trabalho é o que mantém a mudança de pé.',
      missing: 'Convencer empregador a dar a primeira chance.',
      helpers: 'Empresa com vaga, RH, quem conhece rede de emprego.' },
    { id: 'M7', name: 'IA contínua', status: 'planned',
      summary: 'Uma IA simples, por voz, que acompanha a pessoa depois.',
      what: 'Acesso duradouro a uma IA fácil, pra pensar no que dá pra conquistar e se preparar.',
      how: 'A pessoa conversa por voz quando quiser: treinar entrevista, planejar a semana, aprender algo novo.',
      operation: 'Pelo celular, ou num ponto público pra quem não tem aparelho.',
      strength: 'A mesma IA que está mudando o mundo, nas mãos de quem mais precisa.',
      missing: 'Custo por pessoa e um jeito de usar que não dependa de leitura.',
      helpers: 'Quem desenvolve IA de voz, educação de adultos.' },
    { id: 'M8', name: 'Código aberto e governança', status: 'building',
      summary: 'Código e decisões abertos, com aprovação de admin.',
      what: 'Todo o código, todo documento e o livro público ficam num lugar aberto.',
      how: 'Qualquer pessoa propõe melhoria. Um admin revisa e aprova antes de entrar.',
      operation: 'Admins cuidam da revisão. O caminho é virar uma organização sem fins lucrativos formal.',
      strength: 'Ninguém precisa confiar de olho fechado: está tudo lá pra ver.',
      missing: 'Escolher a licença e abrir o repositório ao público.',
      helpers: 'Código, revisão, documentação.' },
    { id: 'M9', name: 'Marca, nome e domínio', status: 'building',
      summary: 'Nome próprio, endereço na internet e identidade visual.',
      what: 'O nome do projeto, o endereço do site e a cara que você está vendo.',
      how: 'Nome curto, fácil de falar e de lembrar. Nada genérico.',
      operation: 'A direção visual está pronta. O nome está em escolha.',
      strength: 'Uma cara que se reconhece na rua, no panfleto e no site.',
      missing: 'O nome definitivo. {name} é provisório.',
      helpers: 'Ideia de nome, design, quem entende de marca.' },
  ];
  const DETAIL_FIELDS = [
    ['what', 'O que é'], ['how', 'Como funciona'], ['operation', 'Como opera'],
    ['strength', 'Ponto forte'], ['missing', 'O que falta resolver', 'is-missing'], ['helpers', 'Quem pode ajudar', 'is-helpers'],
  ];

  // Candidate journey, PRD §4.
  const STEPS = [
    { shortName: 'Encontro', title: 'Encontro', icon: 'pin', module: 'M3', who: ['Voluntário', 'Panfleto', 'Site'],
      text: 'Um voluntário na rua, um panfleto, um ponto público ou este site. Vários jeitos de chegar até quem quer recomeçar.' },
    { shortName: 'Conversa', title: 'Conversa por voz', icon: 'mic', module: 'M4', who: ['IA', 'Voluntário'],
      text: 'Uma conversa curta com a nossa IA, falando e ouvindo. Não precisa ler nem escrever.' },
    { shortName: 'Escolha', title: 'Escolha', icon: 'check-circle', module: 'M3', who: ['IA', 'Pessoa da equipe'],
      text: 'A IA recomenda quem está pronto pra mudar. A proposta é que uma pessoa sempre confirme. Isso ainda está em decisão.' },
    { shortName: 'Primeiros dias', title: 'Primeiros dias', icon: 'plate', module: 'M5', who: ['Doação', 'Parceiros'],
      text: 'Comida por alguns dias, roupa nova e limpa, higiene básica. Tudo pago com doação e registrado no livro público.' },
    { shortName: 'Trabalho', title: 'Trabalho', icon: 'briefcase', module: 'M6', who: ['Empregador', 'Equipe'],
      text: 'O perfil entra na rede de oportunidades, sem expor a pessoa. Empresas e pessoas oferecem vaga.' },
    { shortName: 'IA junto', title: 'IA que acompanha', icon: 'voice-ai', module: 'M7', who: ['IA'],
      text: 'Depois da escolha, a pessoa segue com uma IA simples, por voz, pra planejar o que quer conquistar.' },
    { shortName: 'Prova', title: 'Prova', icon: 'chart', module: 'M2', who: ['Livro público'],
      text: 'Cada passo entra no livro público só como contagem: quantas entrevistas, quantos encaminhamentos. Ninguém é exposto.' },
  ];

  const CONTRIB_TYPES = {
    codigo: { label: 'Código', icon: 'code' },
    design: { label: 'Design', icon: 'pen' },
    pesquisa: { label: 'Pesquisa', icon: 'search' },
    campo: { label: 'Campo', icon: 'pin' },
    juridico: { label: 'Jurídico', icon: 'scale' },
    conteudo: { label: 'Conteúdo', icon: 'doc' },
  };
  // Public names from MAPA-DO-SITE, block 06.
  const BOTTLENECKS = {
    'achar-a-pessoa-certa': 'Achar a pessoa certa',
    'conversar-com-quem-nao-le': 'Conversar com quem não lê',
    'receber-doacao-do-jeito-certo': 'Receber doação do jeito certo',
    'escolha-justa': 'Escolha justa',
    'seguranca-no-encontro': 'Segurança no encontro',
  };
  const ISSUES_URL = 'https://github.com/LucasOl1337/VidaNova/issues/';
  const CONTRIBUTIONS = window.VN_CONTRIBUTIONS.items;
  const REAL = L.DATA.real;

  /* ---------- Speech for generated blocks ---------- */

  Object.assign(SPEECH, {
    'como-funciona': () => `São ${STEPS.length} passos. ` + STEPS.map((s, i) => `${i + 1}: ${s.title}. ${s.text}`).join(' '),
    modulos: () => {
      const names = status => MODULES.filter(m => m.status === status).map(m => m.name);
      const part = (status, label) => {
        const n = names(status);
        return n.length ? `${label}: ${n.length}. ${joinList(n)}.` : `${label}: nenhum ainda.`;
      };
      return `O projeto tem ${MODULES.length} blocos. Estado em ${STATUS_DATE_SPOKEN}. ` +
        [part('live', 'Funcionando'), part('building', 'Em construção'),
         part('bottleneck', 'Precisa de ajuda, que é o que a gente ainda não sabe resolver'), part('planned', 'Planejados')].join(' ') +
        ' Toque num bloco pra saber mais.';
    },
    transparencia: () => {
      const t = L.money(REAL);
      return `O livro público já tem ${REAL.length} ações, todas do próprio projeto: decisões e mudanças. ` +
        `Dinheiro: entrou ${spokenBRL(t.in)} e saiu ${spokenBRL(t.out)}, porque a doação ainda não abriu. ` +
        'Cada ação fica presa na anterior. Aperte Conferir pra ver que nada foi mudado. Toda ação aparece. Quem é a pessoa, não.';
    },
    contribuicoes: () => {
      const first = CONTRIBUTIONS.filter(c => c.goodFirst);
      return `Tem ${CONTRIBUTIONS.length} tarefas abertas. ${first.length} são boas pra quem está começando: ` +
        `${joinList(first.map(c => c.title))}. Pegar uma tarefa abre junto com o repositório.`;
    },
    'module-dialog': () => {
      const m = MODULES.find(x => x.id === moduleDialog.dataset.module);
      if (!m) return '';
      return `Bloco ${m.id.slice(1)}: ${m.name}. Estado: ${STATUSES[m.status].label}. ` +
        DETAIL_FIELDS.map(([key, label]) => `${label}: ${withName(m[key])}`).join(' ');
    },
  });

  /* ---------- Journey ---------- */

  let currentStep = 0;
  const track = $('#journey-track');
  const stepPanel = $('#step-panel');
  track.innerHTML = STEPS.map((s, i) => `
    <button role="tab" type="button" id="step-tab-${i}" aria-controls="step-panel" aria-selected="false" tabindex="-1">
      <span class="track-num">${i + 1}</span><span class="track-name">${escapeHtml(s.shortName)}</span>
    </button>`).join('');
  function selectStep(i, { focus = false, scroll = false } = {}) {
    currentStep = Math.max(0, Math.min(STEPS.length - 1, i));
    $$('[role="tab"]', track).forEach((tab, k) => {
      tab.setAttribute('aria-selected', String(k === currentStep));
      tab.tabIndex = k === currentStep ? 0 : -1;
      tab.classList.toggle('done', k < currentStep);
    });
    const tab = $(`#step-tab-${currentStep}`);
    if (focus) tab.focus({ preventScroll: true });
    if (scroll && track.scrollWidth > track.clientWidth) {
      track.scrollTo({ left: tab.offsetLeft - (track.clientWidth - tab.offsetWidth) / 2, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }
    const s = STEPS[currentStep];
    const m = MODULES.find(x => x.id === s.module);
    stepPanel.setAttribute('aria-labelledby', tab.id);
    stepPanel.innerHTML = `
      <div class="step-icon">${icon(s.icon)}</div>
      <div>
        <p class="step-count">Passo ${currentStep + 1} de ${STEPS.length}</p>
        <h3 class="step-title">${escapeHtml(s.title)}</h3>
        <p class="step-text">${escapeHtml(s.text)}</p>
        <p class="step-meta"><span>Quem faz:</span> ${s.who.map(w => `<span class="chip">${escapeHtml(w)}</span>`).join(' ')}</p>
        <button class="step-module" type="button" data-module="${m.id}" aria-haspopup="dialog">
          <span class="module-id">${m.id}</span><span>${escapeHtml(m.name)}</span>${badge(m.status)}${icon('arrow-right', 'arrow')}
        </button>
        <div class="step-nav">
          <button class="btn btn--back" type="button" data-step="-1" ${currentStep === 0 ? 'disabled' : ''}>${icon('arrow-left')}<span>Anterior</span></button>
          <button class="btn btn--primary" type="button" data-step="1" ${currentStep === STEPS.length - 1 ? 'disabled' : ''}>Próximo${icon('arrow-right')}</button>
        </div>
      </div>`;
    if (!reducedMotion.matches) {
      stepPanel.classList.remove('swap');
      void stepPanel.offsetWidth;
      stepPanel.classList.add('swap');
    }
  }
  track.addEventListener('click', e => {
    const tab = e.target.closest('[role="tab"]');
    if (tab) selectStep($$('[role="tab"]', track).indexOf(tab), { scroll: true });
  });
  track.addEventListener('keydown', e => {
    const keys = { ArrowRight: currentStep + 1, ArrowLeft: currentStep - 1, Home: 0, End: STEPS.length - 1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    selectStep(keys[e.key], { focus: true, scroll: true });
  });
  stepPanel.addEventListener('click', e => {
    const btn = e.target.closest('[data-step]');
    if (!btn || btn.disabled) return;
    selectStep(currentStep + Number(btn.dataset.step), { scroll: true });
    const same = $(`[data-step="${btn.dataset.step}"]`, stepPanel);
    (same && !same.disabled ? same : $(`#step-tab-${currentStep}`)).focus({ preventScroll: true });
  });
  selectStep(0);

  /* ---------- Modules ---------- */

  let activeFilter = 'all';
  const countByStatus = () => Object.fromEntries(Object.keys(STATUSES).map(k => [k, MODULES.filter(m => m.status === k).length]));
  function renderFilters() {
    const counts = countByStatus();
    $('#filters').innerHTML = [['all', 'Todos', MODULES.length, ''], ...Object.entries(STATUSES).map(([k, s]) => [k, s.label, counts[k], icon(s.icon)])]
      .map(([k, label, n, ic]) => `<button class="filter" type="button" data-filter="${k}" aria-pressed="${k === activeFilter}">${ic}${label}<span class="count">${n}</span></button>`)
      .join('');
  }
  function renderModules() {
    const visible = MODULES.filter(m => activeFilter === 'all' || m.status === activeFilter);
    $('#module-grid').innerHTML = visible.map(m => `
      <li><button class="module-card" type="button" data-module="${m.id}" data-status="${m.status}" aria-haspopup="dialog">
        <span class="module-card-head"><span class="module-id">${m.id}</span>${badge(m.status)}</span>
        <span class="module-name">${escapeHtml(m.name)}</span>
        <span class="module-summary">${escapeHtml(withName(m.summary))}</span>
        <span class="module-more">Ver o bloco${icon('arrow-right')}</span>
      </button></li>`).join('');
    const empty = $('#module-empty');
    empty.hidden = visible.length > 0;
    if (!visible.length) {
      empty.innerHTML = activeFilter === 'live'
        ? '<strong>Nenhum bloco funcionando ainda.</strong><p>É cedo: o projeto começou em setembro de 2026. Quando um bloco entrar no ar, o selo muda aqui, com a data.</p>'
        : '<strong>Nenhum bloco nesse estado.</strong>';
    }
    $('#filter-note').innerHTML = activeFilter === 'all'
      ? `<span class="status-date">Estado em ${STATUS_DATE}</span><span>Toque num selo aí em cima pra entender o que ele quer dizer.</span>`
      : `${badge(activeFilter)}<span>${STATUSES[activeFilter].meaning}</span>`;
  }
  $('#filters').addEventListener('click', e => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    activeFilter = btn.dataset.filter;
    $$('[data-filter]', $('#filters')).forEach(x => x.setAttribute('aria-pressed', String(x === btn)));
    renderModules();
  });
  renderFilters();
  renderModules();

  const moduleDialog = $('#module-dialog');
  let focusBefore = null;
  function openModule(id, origin) {
    const i = MODULES.findIndex(m => m.id === id);
    if (i < 0) return;
    const m = MODULES[i];
    const prev = MODULES[(i + MODULES.length - 1) % MODULES.length];
    const next = MODULES[(i + 1) % MODULES.length];
    stopSpeech();
    moduleDialog.dataset.module = m.id;
    $('#module-dialog-id').textContent = m.id;
    $('#module-dialog-title').textContent = m.name;
    $('#module-dialog-status').innerHTML = `${badge(m.status)}<span class="status-date">Estado em ${STATUS_DATE}</span>`;
    $('#module-dialog-details').innerHTML = DETAIL_FIELDS
      .map(([key, label, cls = '']) => `<div class="${cls}"><dt>${label}</dt><dd>${escapeHtml(withName(m[key]))}</dd></div>`).join('');
    $('#module-dialog-nav').innerHTML = `
      <button class="btn" type="button" data-module="${prev.id}" aria-label="Bloco anterior: ${escapeHtml(prev.name)}">${icon('arrow-left')}${prev.id}</button>
      <button class="btn" type="button" data-module="${next.id}" aria-label="Próximo bloco: ${escapeHtml(next.name)}">${next.id}${icon('arrow-right')}</button>`;
    if (!moduleDialog.open) {
      focusBefore = origin || document.activeElement;
      moduleDialog.showModal();
    }
    moduleDialog.scrollTop = 0;
    $('.close-btn', moduleDialog).focus();
    history.replaceState(null, '', `#${m.id.toLowerCase()}`);
  }
  moduleDialog.addEventListener('close', () => {
    stopSpeech();
    history.replaceState(null, '', location.pathname + location.search);
    if (focusBefore && document.contains(focusBefore)) focusBefore.focus({ preventScroll: true });
  });
  document.addEventListener('click', e => {
    const mod = e.target.closest('[data-module]');
    if (mod) openModule(mod.dataset.module, moduleDialog.open ? null : mod);
  });

  /* ---------- Compare: loose help vs full path ---------- */

  const COMPARE_CAPTIONS = {
    loose: 'Só o prato de comida. Ajuda hoje, mas amanhã tudo volta.',
    full: 'Comida, roupa, higiene, trabalho e IA. Um degrau depois do outro.',
  };
  $$('[data-compare]').forEach(btn => btn.addEventListener('click', () => {
    $$('[data-compare]').forEach(x => x.setAttribute('aria-pressed', String(x === btn)));
    $('#compare-stairs').dataset.mode = btn.dataset.compare;
    $('#compare-caption').textContent = COMPARE_CAPTIONS[btn.dataset.compare];
  }));

  /* ---------- Ledger teaser (block 05) and scoreboard ---------- */

  const money = L.money(REAL);
  const counts = L.countByType(REAL);
  $('#score-in').textContent = brl.format(money.in);
  $('#score-out').textContent = brl.format(money.out);
  $('#score-actions').textContent = String(REAL.length);

  const EMPTY_NOTES = { finance: 'A doação ainda não abriu', field: 'Começa com o piloto', candidate: 'A entrevista ainda não abriu' };
  const VALUES = {
    finance: brl.format(money.in),
    field: String(L.sumOf(REAL, 'field', 'quantity')),
    candidate: String(L.sumOf(REAL, 'candidate', 'count')),
    project: String(counts.project),
  };
  $('#type-counters').innerHTML = Object.entries(L.TYPES).map(([type, t]) => {
    const value = VALUES[type];
    const note = counts[type] ? `${counts[type]} ${counts[type] === 1 ? 'ação' : 'ações'} no livro` : EMPTY_NOTES[type];
    return `<li><a class="type-counter" data-type="${type}" href="transparencia.html?tipo=${type}">
      <span class="type-counter-label">${icon(t.icon)}${t.label}</span>
      <span class="type-counter-value">${value}</span>
      <span class="type-counter-note">${type === 'finance' ? `Entrou. ${note}.` : note}</span>
    </a></li>`;
  }).join('');

  const teaser = $('#teaser-chain');
  const corrected = L.correctionsOf(REAL);
  teaser.innerHTML = REAL.slice(-3).reverse().map(e => L.entryHTML(e, { correctedBy: corrected[e.sequence] })).join('');
  L.mountVerify($('#teaser-verify'), { getEvents: () => REAL, listEl: teaser });

  /* ---------- Open contributions (block 07) ---------- */

  const HOME_LIMIT = 6;
  let contribFilter = 'all';
  let contribExpanded = false;
  const contribFilters = [
    ['all', 'Todas', CONTRIBUTIONS.length, ''],
    ['first', 'Bom primeiro passo', CONTRIBUTIONS.filter(c => c.goodFirst).length, icon('sprout')],
    ...Object.entries(CONTRIB_TYPES)
      .map(([k, t]) => [k, t.label, CONTRIBUTIONS.filter(c => c.type === k).length, icon(t.icon)])
      .filter(([, , n]) => n > 0),
  ];
  $('#contrib-filters').innerHTML = contribFilters
    .map(([k, label, n, ic]) => `<button class="filter" type="button" data-contrib="${k}" aria-pressed="${k === contribFilter}">${ic}${label}<span class="count">${n}</span></button>`)
    .join('');
  function contribCard(c) {
    const t = CONTRIB_TYPES[c.type];
    const unlocks = c.bottleneck
      ? `Destrava: <a href="#gargalos">${escapeHtml(BOTTLENECKS[c.bottleneck])}</a>`
      : 'Melhora a plataforma';
    return `<li class="contrib-card">
      <div class="contrib-head"><span class="contrib-type">${icon(t.icon)}${t.label}</span>${c.goodFirst ? `<span class="good-first">${icon('sprout')}Bom primeiro passo</span>` : ''}</div>
      <h3>${escapeHtml(c.title)}</h3>
      <p>${escapeHtml(c.summary)}</p>
      <p class="contrib-unlocks"><span class="module-id">${c.module}</span><span>${unlocks}</span></p>
      <p class="contrib-status"><a href="${ISSUES_URL}${c.issueNumber}" rel="noopener">${icon('lock')}Issue #${c.issueNumber}<span class="sr-only"> (repositório ainda fechado)</span></a></p>
    </li>`;
  }
  function renderContributions() {
    const list = CONTRIBUTIONS.filter(c => contribFilter === 'all' || (contribFilter === 'first' ? c.goodFirst : c.type === contribFilter));
    const limited = contribFilter === 'all' && !contribExpanded && list.length > HOME_LIMIT;
    $('#contrib-grid').innerHTML = (limited ? list.slice(0, HOME_LIMIT) : list).map(contribCard).join('');
    const more = $('#contrib-more');
    more.hidden = !limited;
    more.textContent = `Mostrar as ${list.length} contribuições`;
  }
  $('#contrib-filters').addEventListener('click', e => {
    const btn = e.target.closest('[data-contrib]');
    if (!btn) return;
    contribFilter = btn.dataset.contrib;
    $$('[data-contrib]').forEach(x => x.setAttribute('aria-pressed', String(x === btn)));
    renderContributions();
  });
  $('#contrib-more').addEventListener('click', () => {
    contribExpanded = true;
    renderContributions();
    $('#contrib-grid li:nth-child(7) a')?.focus();
  });
  renderContributions();

  const firstCount = CONTRIBUTIONS.filter(c => c.goodFirst).length;
  $('#open-contrib-text').innerHTML = `<strong>${CONTRIBUTIONS.length} contribuições abertas</strong>, ${firstCount} boas pra quem está começando.`;

  /* ---------- Deep link to a module (#m4) ---------- */

  const openFromHash = () => {
    const match = location.hash.match(/^#m([1-9])$/i);
    if (match) openModule(`M${match[1]}`);
  };
  addEventListener('hashchange', openFromHash);
  openFromHash();
})();
