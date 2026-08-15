import { z } from 'zod';

export const FieldTermItemSchema = z.object({
  term: z.string().min(1),
  easy: z.string().min(1),
  medium: z.string().min(1),
  hard: z.string().min(1),
});

export const FieldTermsResponseSchema = z.object({
  field: z.string().min(1),
  terms: z.array(FieldTermItemSchema).length(2),
});

export type FieldTermItem = z.infer<typeof FieldTermItemSchema>;
export type FieldTermsResponse = z.infer<typeof FieldTermsResponseSchema>;

export function parseFieldTermsJson(raw: string): FieldTermsResponse {
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    : trimmed;

  return FieldTermsResponseSchema.parse(JSON.parse(jsonText));
}
