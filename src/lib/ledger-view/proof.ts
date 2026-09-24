import type { LedgerVerification, VerificationCode } from '../ledger/verify';

// What Conferir agora says, in plain words (F42 E1). The page only paints a step green
// when this report says so. A missing signature or public stamp stays "later": the
// published trust file is still not_configured / not_anchored, and we do not invent a registry entry.
// The stamp is a public registry without any coin (D038): Sigstore Rekor and an RFC 3161 authority.

export type StepMark = 'wait' | 'run' | 'ok' | 'bad' | 'later';
export type ProofSource = 'download' | 'page' | 'file' | 'example';

export interface ProofStep {
  id: 'book' | 'marks' | 'signature' | 'stamp';
  mark: StepMark;
  title: string;
  text: string;
  href?: string;
  hrefLabel?: string;
}

export interface PublicStamp {
  registry: string;
  id: string;
  seenAt: string;
  url: string;
}

export interface BookProof {
  signature: 'missing' | 'ok' | 'bad';
  signedThrough?: number;
  stamp: 'missing' | 'pending' | 'ok' | 'bad';
  witness?: PublicStamp;
}

export interface ProofReport {
  steps: ProofStep[];
  summary: { state: 'ok' | 'bad' | 'partial' | 'empty'; title: string; text: string };
}

export interface ProofInput {
  source: ProofSource;
  total: number;
  through: number;
  result: LedgerVerification | null;
  proof: BookProof;
}

const BROKEN: Record<VerificationCode, (n: string) => { title: string; text: string }> = {
  hash: n => ({ title: `A corrente quebrou na ação nº ${n}.`, text: 'Alguém mudou essa linha depois que ela foi registrada.' }),
  previous_hash: n => ({ title: `A ação nº ${n} não se prende à anterior.`, text: 'Alguma linha foi apagada ou trocada de lugar.' }),
  sequence: n => ({ title: `A numeração pula na ação nº ${n}.`, text: 'Alguma linha foi apagada.' }),
  time: n => ({ title: `A data da ação nº ${n} não bate.`, text: 'O fato aparece com data depois do dia em que foi registrado.' }),
  correction: n => ({ title: `A correção na ação nº ${n} não confere.`, text: 'Ela aponta pra uma linha que não pode corrigir.' }),
  duplicate_source: n => ({ title: `A ação nº ${n} repete outra.`, text: 'A mesma decisão ou mudança foi registrada duas vezes.' }),
  invalid_schema: () => ({ title: 'O livro saiu do formato.', text: 'Tem campo que não deveria estar ali, ou falta campo.' }),
  checkpoint: () => ({ title: 'O livro não bate com o lacre do fim.', text: 'O livro não confere com o lacre publicado junto com ele.' }),
  crypto_unavailable: () => ({ title: 'Não deu pra conferir aqui.', text: 'Este navegador não faz essa conta. Tente em outro.' }),
};

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function stampDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function safeHttps(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') return parsed.href;
  } catch { /* a stamp without a safe link is not shown as a link */ }
  return undefined;
}

export function proofFromTrust(input: unknown): BookProof {
  const trust = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const signature = trust.signature === 'ok' || trust.signature === 'configured' ? 'ok'
    : trust.signature === 'bad' ? 'bad' : 'missing';
  const stamp = trust.timestamp === 'anchored' || trust.timestamp === 'ok' ? 'ok'
    : trust.timestamp === 'pending' ? 'pending'
      : trust.timestamp === 'bad' ? 'bad' : 'missing';
  const signedThrough = typeof trust.signedThrough === 'string' && /^[1-9][0-9]*$/.test(trust.signedThrough)
    ? Number(trust.signedThrough) : typeof trust.signedThrough === 'number' && trust.signedThrough > 0
      ? trust.signedThrough : undefined;
  const raw = trust.witness && typeof trust.witness === 'object' ? trust.witness as Record<string, unknown> : undefined;
  const registry = typeof raw?.registry === 'string' && /^[\p{L}\p{N} .:-]{1,40}$/u.test(raw.registry) ? raw.registry : undefined;
  const id = typeof raw?.id === 'string' && /^[A-Za-z0-9._:-]{1,120}$/.test(raw.id) ? raw.id : undefined;
  const seenAt = typeof raw?.seenAt === 'string' ? raw.seenAt : '';
  const url = typeof raw?.url === 'string' ? safeHttps(raw.url) : undefined;
  const witness = registry && id && url && stampDay(seenAt) ? { registry, id, seenAt, url } : undefined;
  return { signature, stamp, signedThrough, witness };
}

function bookStep(input: ProofInput): ProofStep {
  const actions = count(input.total, 'ação', 'ações');
  if (input.source === 'example') return { id: 'book', mark: 'ok', title: 'Exemplo fictício.', text: `${actions}. Nada disto aconteceu.` };
  if (input.source === 'file') return { id: 'book', mark: 'ok', title: 'Abriu o arquivo.', text: `${actions}.` };
  if (input.source === 'page') return { id: 'book', mark: 'ok', title: 'Livro desta página.', text: `Não deu pra baixar agora. ${actions}.` };
  return { id: 'book', mark: 'ok', title: 'Baixou o livro.', text: `${actions}.` };
}

function marksStep(input: ProofInput, result: LedgerVerification): ProofStep {
  if (!result.valid) {
    const at = result.sequence ?? '';
    const said = BROKEN[result.code](at);
    const good = Number(at) - 1;
    const before = good > 1 ? ` As ${good} ações antes dela estão certas.` : good === 1 ? ' A ação antes dela está certa.' : '';
    return { id: 'marks', mark: 'bad', title: said.title, text: `${said.text}${before}` };
  }
  const n = result.eventCount;
  if (input.through < input.total) {
    return { id: 'marks', mark: 'ok', title: `Recalculou as marcas até a ação nº ${input.through}.`, text: 'Todas batem até ali.' };
  }
  return { id: 'marks', mark: 'ok', title: `Recalculou ${count(n, 'marca', 'marcas')}.`, text: 'Todas batem.' };
}

function heldBack(id: ProofStep['id'], title: string): ProofStep {
  return { id, mark: 'later', title, text: 'Não conferi. A corrente quebrou antes.' };
}

function signatureStep(proof: BookProof, through: number): ProofStep {
  if (proof.signature === 'missing') {
    return { id: 'signature', mark: 'later', title: 'Assinatura com a chave pública.', text: 'Ainda não está neste livro.' };
  }
  if (proof.signature === 'bad') {
    return { id: 'signature', mark: 'bad', title: 'A assinatura não confere.', text: 'A chave pública do projeto não reconhece este livro.' };
  }
  const covered = proof.signedThrough ?? through;
  if (through <= covered) {
    return { id: 'signature', mark: 'ok', title: 'A assinatura confere.', text: 'Bate com a chave pública do projeto.' };
  }
  return {
    id: 'signature', mark: 'later',
    title: `A assinatura confere até a ação nº ${covered}.`,
    text: `Até a nº ${through}, a corrente bate e o resto ainda não está assinado.`,
  };
}

function stampStep(proof: BookProof, through: number): ProofStep {
  const title = 'Carimbo no registro público.';
  if (proof.stamp === 'bad') return { id: 'stamp', mark: 'bad', title, text: 'O carimbo não confere com este livro.' };
  if (proof.stamp === 'pending') return { id: 'stamp', mark: 'later', title, text: 'O pedido já foi feito. O registro ainda não devolveu a data.' };
  if (proof.stamp !== 'ok' || !proof.witness) {
    return { id: 'stamp', mark: 'later', title, text: 'Ainda não está neste livro. Quando entrar, aparece o registro e a data.' };
  }
  const when = stampDay(proof.witness.seenAt);
  const href = safeHttps(proof.witness.url);
  const covered = proof.signedThrough ?? through;
  const base = `${proof.witness.registry}, em ${when}.`;
  if (through <= covered) {
    return { id: 'stamp', mark: 'ok', title: 'Carimbado no registro público.', text: base, href, hrefLabel: href ? 'Ver no registro' : undefined };
  }
  return {
    id: 'stamp', mark: 'later', title: `O carimbo cobre até a ação nº ${covered}.`,
    text: `${base} As ações depois dessa ainda não estão carimbadas.`, href, hrefLabel: href ? 'Ver no registro' : undefined,
  };
}

const NOT_A_BOOK: ProofStep = {
  id: 'book', mark: 'bad', title: 'Esse arquivo não é um livro.', text: 'Use o arquivo baixado nesta página, o livro inteiro.',
};

function summaryOf(steps: ProofStep[]): ProofReport['summary'] {
  const bad = steps.find(step => step.mark === 'bad');
  if (bad) return { state: 'bad', title: bad.title, text: bad.text };
  const marks = steps.find(step => step.id === 'marks');
  if (!marks) return { state: 'empty', title: 'Nada pra conferir ainda.', text: 'O livro ainda não tem nenhuma ação.' };
  if (marks.mark !== 'ok') return { state: 'partial', title: 'Conferência incompleta.', text: 'Não deu pra terminar a conta.' };
  const signature = steps.find(step => step.id === 'signature');
  const stamp = steps.find(step => step.id === 'stamp');
  if (signature?.mark === 'ok' && stamp?.mark === 'ok') {
    return { state: 'ok', title: 'Tudo certo.', text: 'A corrente, a assinatura e o carimbo no registro público batem.' };
  }
  const missingBoth = signature?.mark === 'later' && stamp?.mark === 'later'
    && signature.text.startsWith('Ainda não') && stamp.text.startsWith('Ainda não');
  return {
    state: 'partial', title: 'A corrente está certa.',
    text: missingBoth
      ? 'Ninguém mexeu no que está escrito. A assinatura e o carimbo no registro público ainda não estão neste livro.'
      : 'Ninguém mexeu no que está escrito.',
  };
}

export function proofReport(input: ProofInput): ProofReport {
  if (!input.result) return { steps: [NOT_A_BOOK], summary: { state: 'bad', title: NOT_A_BOOK.title, text: NOT_A_BOOK.text } };
  if (input.result.valid && input.result.eventCount === 0) {
    const book = bookStep(input);
    return { steps: [book], summary: { state: 'empty', title: 'Nada pra conferir ainda.', text: 'O livro ainda não tem nenhuma ação.' } };
  }
  const book = bookStep(input);
  const marks = marksStep(input, input.result);
  const steps = input.result.valid
    ? [book, marks, signatureStep(input.proof, input.through), stampStep(input.proof, input.through)]
    : [book, marks, heldBack('signature', 'Assinatura com a chave pública.'), heldBack('stamp', 'Carimbo no registro público.')];
  return { steps, summary: summaryOf(steps) };
}
