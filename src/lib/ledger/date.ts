const publicDateFormatter = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', era: 'short',
});

/** Civil date of an instant in the project's time zone, including historical DST. */
export function dateInSaoPaulo(instant: string): string {
  const parts = publicDateFormatter.formatToParts(new Date(instant));
  const part = (name: Intl.DateTimeFormatPartTypes) => parts.find(value => value.type === name)!.value;
  const year = part('era') === 'BC' ? 1 - Number(part('year')) : Number(part('year'));
  const yearText = year < 0 ? `-${String(-year).padStart(6, '0')}` : String(year).padStart(4, '0');
  return `${yearText}-${part('month')}-${part('day')}`;
}
