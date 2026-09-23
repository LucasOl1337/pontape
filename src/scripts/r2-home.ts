// Existing site links select a typographic step. The radio group itself works without JS.
const hashToStep: Record<string, number> = {
  '#inicio': 1,
  '#como-funciona': 2,
  '#modulos': 3,
  '#transparencia': 4,
  '#gargalos': 5,
  '#contribuicoes': 6,
  '#ajudar': 7,
  '#codigo-aberto': 7,
};

function selectFromHash() {
  const step = hashToStep[location.hash];
  if (!step) return;
  const input = document.getElementById(`r2-step-${step}`);
  if (input instanceof HTMLInputElement) input.checked = true;
}

addEventListener('hashchange', selectFromHash);
selectFromHash();
