import { normalizeStoredText } from './normalize-text';

export function normalizeFieldName(value: string): string {
  return normalizeStoredText(value).replace(/\s+/g, ' ');
}
