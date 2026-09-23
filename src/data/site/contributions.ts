import { z } from 'zod';
import type { IconName } from '../../components/site/icon-names';
import catalog from '../../../docs/contribuicoes/contribuicoes.json';

// Format documented in docs/contribuicoes/README.md (F13). Validated at build so a bad entry
// fails the build instead of reaching the page.
export const contributionSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  summary: z.string().min(1),
  type: z.enum(['codigo', 'design', 'pesquisa', 'campo', 'juridico', 'conteudo']),
  module: z.string().regex(/^M[1-9]$/),
  goodFirst: z.boolean(),
  bottleneck: z.enum(['achar-a-pessoa-certa', 'conversar-com-quem-nao-le', 'receber-doacao-do-jeito-certo', 'escolha-justa', 'seguranca-no-encontro']).nullable(),
  issueNumber: z.number().int().positive(),
});
export type Contribution = z.infer<typeof contributionSchema>;

export const CONTRIBUTIONS: Contribution[] = z.array(contributionSchema).parse(catalog);

export const CONTRIBUTION_TYPES: Record<Contribution['type'], { label: string; icon: IconName }> = {
  codigo: { label: 'Código', icon: 'code' },
  design: { label: 'Design', icon: 'pen' },
  pesquisa: { label: 'Pesquisa', icon: 'search' },
  campo: { label: 'Campo', icon: 'pin' },
  juridico: { label: 'Jurídico', icon: 'scale' },
  conteudo: { label: 'Conteúdo', icon: 'doc' },
};

export const REPO_URL = 'https://github.com/LucasOl1337/pontape';
export const issueUrl = (n: number) => `${REPO_URL}/issues/${n}`;
// A new issue from the "Ideia para um gargalo" template (.github/ISSUE_TEMPLATE).
export const IDEA_URL = `${REPO_URL}/issues/new?template=ideia-para-gargalo.md`;
