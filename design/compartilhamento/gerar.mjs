// Builds a WhatsApp-like chat that shows how the site links look when shared, straight from the
// built HTML and images in dist/. Only for review prints; nothing here ships.
//   npm run build && node design/compartilhamento/gerar.mjs
/* global console */
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', '..', 'dist');
const unescape = s => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const escape = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const meta = (html, prop) => unescape(html.match(new RegExp(`<meta property="${prop}" content="([^"]*)"`))?.[1] ?? '');

const pages = [
  { html: 'index.html', path: '/', note: 'Olha esse projeto, é sem fins lucrativos e mostra tudo que faz:' },
  { html: 'transparencia/index.html', path: '/transparencia', note: 'E aqui dá pra conferir cada ação, até o dinheiro:' },
].map(p => {
  const html = readFileSync(join(dist, p.html), 'utf8');
  const image = meta(html, 'og:image').split('/').pop();
  copyFileSync(join(dist, image), join(here, image));
  return { ...p, title: meta(html, 'og:title'), description: meta(html, 'og:description'), image };
});

const bubble = p => `
  <div class="msg">
    <a class="card" href="#"><img src="${p.image}" alt=""><span class="card-text"><strong>${escape(p.title)}</strong><span>${escape(p.description)}</span><small>endereço a definir${p.path}</small></span></a>
    <p>${escape(p.note)} <a href="#">endereço a definir${p.path}</a></p>
    <span class="time">21:40 ✓✓</span>
  </div>`;

writeFileSync(join(here, 'index.html'), `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Simulação de link compartilhado</title>
<style>
  body{ margin:0; font:15px/1.35 system-ui, sans-serif; background:#efeae2; color:#111b21 }
  header{ background:#008069; color:#fff; padding:14px 16px; font-weight:600 }
  header small{ display:block; font-weight:400; opacity:.85 }
  main{ padding:14px 10px 24px; display:grid; gap:12px }
  .sim{ font-size:12px; text-align:center; background:#fff8c5; border-radius:8px; padding:6px 10px; color:#54656f }
  .msg{ justify-self:end; max-width:88%; background:#d9fdd3; border-radius:10px 0 10px 10px; padding:5px 5px 6px; box-shadow:0 1px .5px rgba(11,20,26,.13) }
  .card{ display:block; background:#d1f4cc; border-radius:7px; overflow:hidden; color:inherit; text-decoration:none }
  .card img{ display:block; width:100%; aspect-ratio:1200/630; object-fit:cover }
  .card-text{ display:grid; gap:2px; padding:8px 10px 10px }
  .card-text strong{ font-size:14px }
  .card-text span{ font-size:13px; color:#3b4a54; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden }
  .card-text small{ font-size:12px; color:#667781 }
  .msg p{ margin:6px 6px 0; }
  .msg p a{ color:#027eb5 }
  .time{ display:block; text-align:right; font-size:11px; color:#667781; margin:2px 6px 0 }
</style></head>
<body><header>Conversa de exemplo<small>simulação do cartão do WhatsApp</small></header>
<main><p class="sim">Simulação. O cartão usa a imagem, o título e a descrição gerados no build.</p>${pages.map(bubble).join('')}</main></body></html>
`);
console.log(`simulação gerada com ${pages.length} links`);
