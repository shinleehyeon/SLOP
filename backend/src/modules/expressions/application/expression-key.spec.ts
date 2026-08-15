import { describe, expect, test } from 'bun:test';
import { expressionNormalizedKey, expressionTitle } from './expression-key';

describe('expressionNormalizedKey', () => {
  test('trims lowercases and collapses whitespace', () => {
    expect(expressionNormalizedKey('  AI  추천  ')).toBe('ai 추천');
  });
});

describe('expressionTitle', () => {
  test('truncates long titles', () => {
    const title = expressionTitle('a'.repeat(320), 10);
    expect(title.length).toBe(10);
    expect(title.endsWith('…')).toBe(true);
  });
});
