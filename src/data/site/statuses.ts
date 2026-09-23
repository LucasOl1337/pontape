import type { IconName } from '../../components/site/icon-names';

export type ModuleStatus = 'live' | 'building' | 'bottleneck' | 'planned';

// Public labels (D011: "Precisa de ajuda" for bottlenecks; the section is still "Gargalos").
export const STATUSES: Record<ModuleStatus, { label: string; icon: IconName; meaning: string }> = {
  live: { label: 'Funcionando', icon: 'check', meaning: 'Já está no ar e dá pra usar.' },
  building: { label: 'Em construção', icon: 'cone', meaning: 'A equipe está fazendo agora.' },
  bottleneck: { label: 'Precisa de ajuda', icon: 'alert', meaning: 'Ainda não sabemos resolver. Aqui sua ajuda vale mais.' },
  planned: { label: 'Planejado', icon: 'clock', meaning: 'Está no plano. Ainda não começou.' },
};
export const STATUS_ORDER: ModuleStatus[] = ['live', 'building', 'bottleneck', 'planned'];
