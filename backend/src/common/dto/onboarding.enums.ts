import { z } from 'zod';

export const ToneSchema = z.enum(['CASUAL', 'POLITE', 'NEWS']);
export const DisplayFormatSchema = z.enum(['SENTENCE', 'KEYWORD_LIST', 'QNA']);
export const ShortsStyleSchema = z.enum(['FUN', 'INFO']);
export const DifficultySchema = z.enum(['EASY', 'MEDIUM', 'HARD']);

export type Tone = z.infer<typeof ToneSchema>;
export type DisplayFormat = z.infer<typeof DisplayFormatSchema>;
export type ShortsStyle = z.infer<typeof ShortsStyleSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
