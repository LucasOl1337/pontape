import { stopSpeech, toast } from './site';

const all = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) => [...root.querySelectorAll<T>(selector)];

// Native dialogs keep the page in place. The opener regains focus on close.
all<HTMLElement>('[data-open]').forEach(button => button.addEventListener('click', () => {
  const dialog = document.getElementById(button.dataset.open ?? '');
  if (!(dialog instanceof HTMLDialogElement)) return;
  stopSpeech();
  dialog.showModal();
  dialog.scrollTop = 0;
  dialog.addEventListener('close', () => { stopSpeech(); button.focus({ preventScroll: true }); }, { once: true });
}));

const full = document.querySelector<HTMLButtonElement>('[data-fullscreen]');
if (full) {
  full.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { toast('Tela cheia indisponível aqui. Você pode abrir o site em uma aba própria.'); }
  });
  document.addEventListener('fullscreenchange', () => {
    const active = Boolean(document.fullscreenElement);
    full.setAttribute('aria-pressed', String(active));
    full.setAttribute('aria-label', active ? 'Sair da tela cheia' : 'Entrar em tela cheia');
  });
}

// A single card changes without moving the document or stealing focus.
const tablist = document.querySelector<HTMLElement>('[data-chapters]');
if (tablist) {
  const tabs = all<HTMLButtonElement>('[data-chapter]', tablist);
  let current = 0;
  const select = (index: number, focus = false) => {
    current = Math.max(0, Math.min(tabs.length - 1, index));
    stopSpeech();
    tabs.forEach((tab,i) => {
      tab.setAttribute('aria-selected', String(i === current));
      tab.tabIndex = i === current ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute('aria-controls')!);
      if (panel) panel.hidden = i !== current;
    });
    const person = document.querySelector<SVGElement>('[data-person]');
    if (person) person.style.transform = `translate(${current * 130}px, ${current * -53}px)`;
    document.querySelector('#chapter-count')!.textContent = String(current + 1).padStart(2,'0');
    const labels = ['A ideia','O caminho','Os módulos','À vista','Sua parte'];
    document.querySelector('#chapter-label')!.textContent = labels[current]!;
    const listen = document.querySelector<HTMLElement>('.chapter-top [data-listen]');
    if (listen) listen.dataset.listen = `chapter-${current}`;
    all('.chapter-dots i').forEach((dot,i) => dot.classList.toggle('active',i===current));
    all<HTMLButtonElement>('[data-chapter-shift]').forEach(button => {
      const forward = button.dataset.chapterShift === '1';
      button.disabled = forward ? current === tabs.length - 1 : current === 0;
    });
    if (focus) tabs[current]!.focus({ preventScroll: true });
  };
  tabs.forEach((tab,i) => tab.addEventListener('click',() => select(i)));
  tablist.addEventListener('keydown',event => {
    const index = { ArrowRight:current+1, ArrowUp:current+1, ArrowLeft:current-1, ArrowDown:current-1, Home:0, End:tabs.length-1 }[event.key];
    if (index === undefined) return;
    event.preventDefault();
    select(index,true);
  });
  all<HTMLButtonElement>('[data-chapter-shift]').forEach(button => button.addEventListener('click',() => {
    select(current + Number(button.dataset.chapterShift));
    // A disabled edge button cannot keep keyboard focus.
    if (button.disabled) tabs[current]!.focus({ preventScroll:true });
  }));
  const followHash = () => {
    const target = location.hash.slice(1);
    const aliases: Record<string,number> = { inicio:0, 'como-funciona':1, modulos:2, transparencia:3, gargalos:4, contribuicoes:4, ajudar:4, 'codigo-aberto':4 };
    if (target in aliases) select(aliases[target]!);
    const module = /^m[1-9]$/i.test(target) && document.getElementById(`detail-${target.toUpperCase()}`);
    if (module instanceof HTMLDialogElement && !module.open) { select(2); module.showModal(); }
  };
  window.addEventListener('hashchange',followHash);
  followHash();
}

const journey = document.querySelector<HTMLElement>('[data-journey-tabs]');
if (journey) {
  const tabs = all<HTMLButtonElement>('[role="tab"]',journey);
  let current = 0;
  const select = (index:number, focus = false) => {
    current = Math.max(0, Math.min(tabs.length-1,index));
    stopSpeech();
    tabs.forEach((tab,i) => {
      tab.setAttribute('aria-selected',String(i===current));
      tab.tabIndex = i===current ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')!)!.hidden = i!==current;
    });
    if (focus) tabs[current]!.focus({preventScroll:true});
  };
  tabs.forEach((tab,i) => tab.addEventListener('click',()=>select(i)));
  journey.addEventListener('keydown',event => {
    const index = { ArrowRight:current+1, ArrowLeft:current-1, Home:0, End:tabs.length-1 }[event.key];
    if (index === undefined) return;
    event.preventDefault(); select(index,true);
  });
}
