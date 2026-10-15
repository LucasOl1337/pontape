// /alimenta/painel: the REAL numbers, live from the API (/kpis). Honest zero until the first real
// donation. Every value from the server goes in as text, never as HTML.
const live = document.querySelector<HTMLElement>('#pn-live');
const note = document.querySelector<HTMLElement>('#pn-live-note');
const citiesBox = document.querySelector<HTMLElement>('#pn-cities');
const citiesList = document.querySelector<HTMLOListElement>('#pn-cities-list');
const fmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

interface Kpis {
  donations: number; deliveries: number; kg_delivered: number; meals_estimated: number; generated_at?: string;
  match?: { count: number; avg_minutes: number | null };
  by_city?: { city: string; deliveries: number; kg: number; meals_estimated: number }[];
}

const set = (key: string, text: string) => { const el = live?.querySelector<HTMLElement>(`[data-k="${key}"]`); if (el) el.textContent = text; };

function minutes(m: number | null | undefined): string {
  if (m === null || m === undefined) return 'sem dados';
  if (m < 60) return `${fmt.format(Math.round(m))} min`;
  if (m < 48 * 60) return `${fmt.format(m / 60)} h`;
  return `${fmt.format(m / 1440)} dias`;
}

async function load() {
  try {
    const res = await fetch('/api/alimenta/kpis', { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    const k = (await res.json()) as Kpis;
    set('kg_delivered', fmt.format(k.kg_delivered));
    set('meals_estimated', fmt.format(k.meals_estimated));
    set('donations', fmt.format(k.donations));
    set('match', minutes(k.match?.avg_minutes));
    const when = k.generated_at ? new Date(k.generated_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
    if (note) note.textContent = k.donations === 0
      ? `Ao vivo${when ? ` em ${when}` : ''}. Ainda é zero: nenhuma doação real foi registrada. Zero aqui é verdade, não erro.`
      : `Ao vivo${when ? ` em ${when}` : ''}. ${fmt.format(k.deliveries)} ${k.deliveries === 1 ? 'entrega declarada' : 'entregas declaradas'} por quem doou.`;
    const cities = k.by_city ?? [];
    if (citiesBox && citiesList && cities.length) {
      const top = Math.max(...cities.map(c => c.kg), 1);
      citiesList.replaceChildren(...cities.map(c => {
        const li = document.createElement('li');
        const label = document.createElement('span'); label.className = 'pn-bar-label'; label.textContent = c.city;
        const bar = document.createElement('span'); bar.className = 'pn-bar';
        const fill = document.createElement('span'); fill.style.width = `${(100 * c.kg / top).toFixed(1)}%`; bar.append(fill);
        const value = document.createElement('span'); value.className = 'pn-bar-value'; value.textContent = `${fmt.format(c.kg)} kg`;
        li.append(label, bar, value);
        return li;
      }));
      citiesBox.hidden = false;
    }
  } catch {
    for (const key of ['kg_delivered', 'meals_estimated', 'donations', 'match']) set(key, '–');
    if (note) note.textContent = 'O servidor da Rede Alimenta não respondeu agora. Ele dorme quando fica parado; recarregue em um minuto.';
  }
}

void load();
