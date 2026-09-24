import { readFileSync, writeFileSync } from 'node:fs';
/* global console */

const read = path => readFileSync(path, 'utf8');
const prd = read('docs/PRD.md');
const project = prd.slice(prd.indexOf('## 1. Em uma frase'), prd.indexOf('## 7. Site v1'));
const decisions = read('docs/DECISOES.md').split('\n')
  .filter(line => /^\| D\d{3} \|/.test(line))
  .map(line => {
    const columns = line.split('|').map(value => value.trim());
    return `${columns[1]}: ${columns[6]}`;
  }).join('\n');
const faqSource = read('src/data/site/perguntas.ts');
const faq = [...faqSource.matchAll(/\{ id: '[^']+', q: '([^']+)',\s*a: '([^']+)' \}/g)]
  .map(([, question, answer]) => `${question}\n${answer}`).join('\n\n');
const siteData = ['journey', 'modules', 'bottlenecks', 'livro'].map(name => {
  const source = read(`src/data/site/${name}.ts`);
  const lines = source.split('\n').filter(line => !line.trim().startsWith('//') && !line.includes('http'));
  const phrases = [...lines.join('\n').matchAll(/(?:'([^'\n]+)'|`([^`\n]+)`)/g)]
    .map(([, single, template]) => single ?? template)
    .filter(value => value.length > 24 && /\s/.test(value) && !/[{}$]/.test(value));
  return `${name.toUpperCase()}\n${phrases.join('\n')}`;
}).join('\n\n');
const reason = read('docs/frentes/F42-transparencia-que-recebe/BRIEF.md').split('## Por quê\n')[1].split('\n## ')[0]
  .replace(/^> ?/gm, '').trim();

const knowledge = `PONTAPÉ: ESTADO E PLANO\n${project}\n\nDECISÕES EM PALAVRAS SIMPLES\n${decisions}\n\nPERGUNTAS PUBLICADAS\n${faq}\n\nDADOS DO SITE\n${siteData}\n\nPOR QUE MELHORAR A TRANSPARÊNCIA\n${reason}`
  .replace(/\bIA\b/g, 'AI')
  .replace(/\bLucas(?: Oliveira)?\b/g, 'quem cuida do projeto')
  .replace(/Bitcoin/gi, 'moeda digital')
  .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[contato removido]')
  .replace(/\n{3,}/g, '\n\n');

writeFileSync('scripts/deploy/yumi-knowledge.js', `// Gerado por scripts/generate-yumi-knowledge.mjs. Não edite à mão.\nexport const YUMI_KNOWLEDGE = ${JSON.stringify(knowledge)};\n`);
console.log(`Contexto da Yume: ${knowledge.length} caracteres`);
