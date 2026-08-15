import { z } from 'zod';

export const OAuthProviderSchema = z.enum(['google', 'github']);

export type OAuthProviderKey = z.infer<typeof OAuthProviderSchema>;
