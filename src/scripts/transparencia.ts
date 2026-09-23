// /transparencia, first layer (F32): Conferir checks the real ledger in plain words.
// The list, the example and the tabs are on /transparencia/tecnico (scripts/ledger.ts).
import { mountVerify, readLedger } from './verify';

const panel = document.querySelector<HTMLElement>('#conferir [data-verify-panel]');
if (panel) {
  const ledger = readLedger('ledger-real');
  mountVerify(panel, () => ledger);
}
