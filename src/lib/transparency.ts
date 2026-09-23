import { z } from 'zod';

// Contrato do snapshot inicial da F1, não do futuro livro de eventos da F08.
// Campos e valores fixos impedem texto livre e movimentações antes da habilitação.
export const transparencySnapshotSchema = z.strictObject({
  schemaVersion: z.literal(1),
  asOf: z.iso.date(),
  currency: z.literal('BRL'),
  donationsEnabled: z.literal(false),
  status: z.literal('Doações ainda não habilitadas'),
  receivedCents: z.literal(0),
  spentCents: z.literal(0),
});

export type TransparencySnapshot = z.infer<typeof transparencySnapshotSchema>;
