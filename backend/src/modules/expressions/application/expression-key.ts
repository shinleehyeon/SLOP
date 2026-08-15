import { normalizeStoredText } from '@/common/text/normalize-text';

export function expressionNormalizedKey(text: string): string {
  return normalizeStoredText(text).toLowerCase().replace(/\s+/g, ' ');
}

export function expressionTitle(text: string, maxLength = 300): string {
  const trimmed = normalizeStoredText(text);
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1)}…`;
}
