import type { IconName } from '../site/icon-names';

// The seven steps of the home: each one is a part of the site, in the order someone meets it.
// `id` is also the panel id, so old links (#modulos, #gargalos...) still land on the right step.
export type HomeStepId = 'inicio' | 'como-funciona' | 'modulos' | 'transparencia' | 'gargalos' | 'contribuicoes' | 'ajudar';

export interface HomeStep {
  id: HomeStepId;
  name: string;
  icon: IconName;
  stat: string;
}

export const stepTabId = (id: HomeStepId) => `degrau-${id}`;
