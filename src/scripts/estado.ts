// The state component from a script (F44, plano 2.2). Same markup as StateNote.astro; the icon uses
// the sprite already on the page. Text goes in as text.
import { STATE_ICON, STATE_ROLE, type StateInput } from '../data/site/estado';

const SVG = 'http://www.w3.org/2000/svg';

export function stateNote({ kind, title, body, actions = [], id }: StateInput): HTMLElement {
  const box = document.createElement('section');
  box.className = 'state';
  box.dataset.state = kind;
  const role = STATE_ROLE[kind];
  if (role) box.setAttribute('role', role);
  if (id) { box.id = id; box.setAttribute('aria-labelledby', `${id}-title`); }
  const icon = document.createElementNS(SVG, 'svg');
  icon.setAttribute('class', 'icon state-icon');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVG, 'use');
  use.setAttribute('href', `#i-${STATE_ICON[kind]}`);
  icon.append(use);
  const text = document.createElement('div');
  text.className = 'state-text';
  const heading = document.createElement('h3');
  heading.className = 'state-title';
  if (id) heading.id = `${id}-title`;
  heading.textContent = title;
  text.append(heading);
  if (body !== undefined) {
    const p = document.createElement('div');
    p.className = 'state-body';
    for (const part of Array.isArray(body) ? body : [body]) {
      if (typeof part === 'string') { const para = document.createElement('p'); para.textContent = part; p.append(para); } else p.append(part);
    }
    text.append(p);
  }
  if (actions.length) {
    const row = document.createElement('p');
    row.className = 'state-actions';
    for (const a of actions) {
      const cls = `btn${a.primary ? ' btn--ink' : ''}`;
      if (a.href) {
        const link = document.createElement('a');
        link.className = cls;
        link.href = a.href;
        link.textContent = a.label;
        row.append(link);
      } else {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = cls;
        button.textContent = a.label;
        if (a.onClick) button.addEventListener('click', a.onClick);
        row.append(button);
      }
    }
    text.append(row);
  }
  box.append(icon, text);
  return box;
}
