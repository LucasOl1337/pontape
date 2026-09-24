// /transparencia, first layer (F42): the seal checks the real ledger in plain words.
import { mountSeal, readLedger } from './seal';

const panel = document.querySelector<HTMLElement>('#conferir [data-verify-panel]');
if (panel) {
  const seal = mountSeal(panel, () => readLedger('ledger-real'));
  const until = new URLSearchParams(location.search).get('ate');
  if (until && /^[1-9][0-9]*$/.test(until)) void seal.run(until);
}
