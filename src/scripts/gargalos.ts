// /construir/gargalos: a link to one question (#escolha-justa) opens it.
function openTarget() {
  let id: string;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const question = id ? document.getElementById(id) : null;
  if (!(question instanceof HTMLDetailsElement)) return;
  question.open = true;
  question.scrollIntoView({ block: 'start' });
  question.querySelector('summary')?.focus({ preventScroll: true });
}
// After load: Chrome moves focus back to the page when it scrolls to the fragment.
if (document.readyState === 'complete') openTarget();
else addEventListener('load', openTarget, { once: true });
addEventListener('hashchange', openTarget);
