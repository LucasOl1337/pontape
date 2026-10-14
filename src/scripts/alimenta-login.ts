// E-mail and code login, shared by /alimenta/doar and /alimenta/minhas-doacoes. The API proxies
// Supabase: POST /auth/code sends the code, POST /auth/verify gives a short JWT (no refresh token).
import { $, ApiError, api, saveSession, say, session } from './alimenta-api';

export const wake = () => $('#al-wake');
export const msg = () => $('#al-msg');

export function startLogin(onReady: () => void) {
  if (session()) { onReady(); return; }
  const box = $('#al-login')!;
  const emailForm = $<HTMLFormElement>('#al-email-form')!;
  const codeForm = $<HTMLFormElement>('#al-code-form')!;
  const email = $<HTMLInputElement>('#al-email')!;
  const code = $<HTMLInputElement>('#al-code')!;
  box.hidden = false;

  emailForm.addEventListener('submit', async e => {
    e.preventDefault();
    const value = email.value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/.test(value)) { say(msg(), 'Confira o e-mail. Ele precisa ter @ e um ponto depois.', 'error'); email.focus(); return; }
    const button = emailForm.querySelector('button')!;
    button.disabled = true;
    say(msg(), '');
    try {
      await api('auth/code', { body: { email: value } }, wake());
      emailForm.hidden = true;
      codeForm.hidden = false;
      $('#al-code-sent')!.textContent = `Se o e-mail ${value} puder entrar, o código chega em alguns minutos. Olhe também o spam.`;
      code.focus();
    } catch (error) {
      say(msg(), error instanceof ApiError && error.status === 503
        ? 'O envio do código está fora do ar agora. Tente de novo mais tarde.'
        : (error as Error).message, 'error');
    } finally { button.disabled = false; }
  });

  codeForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!/^[0-9]{6}$/.test(code.value.trim())) { say(msg(), 'O código tem 6 números.', 'error'); code.focus(); return; }
    const button = codeForm.querySelector<HTMLButtonElement>('button[type=submit]')!;
    button.disabled = true;
    try {
      const out = await api<{ access_token?: string; expires_in?: number }>('auth/verify',
        { body: { email: email.value.trim().toLowerCase(), code: code.value.trim() } }, wake());
      if (!out?.access_token) throw new ApiError(502, 'O login não voltou como esperado. Tente de novo.');
      saveSession(out.access_token, Number(out.expires_in));
      say(msg(), '');
      box.hidden = true;
      onReady();
    } catch (error) {
      say(msg(), error instanceof ApiError && error.status === 401 ? 'Código errado ou vencido. Confira ou peça outro.' : (error as Error).message, 'error');
    } finally { button.disabled = false; }
  });

  $('#al-other-email')?.addEventListener('click', () => { codeForm.hidden = true; emailForm.hidden = false; code.value = ''; email.focus(); });
}
