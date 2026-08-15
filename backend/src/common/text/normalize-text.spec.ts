import { describe, expect, it } from '@jest/globals';
import { normalizeStoredText, searchTextForms } from './normalize-text';

describe('normalize-text', () => {
  it('normalizes stored text to NFC', () => {
    const nfd = '뭉개_1.jpg';
    expect(normalizeStoredText(nfd)).toBe('뭉개_1.jpg');
  });

  it('returns both NFC and NFD search forms for composed hangul', () => {
    expect(searchTextForms('뭉개')).toEqual(['뭉개', '뭉개']);
  });

  it('returns a single form for ASCII text', () => {
    expect(searchTextForms('profile')).toEqual(['profile']);
  });
});
