import { describe, expect, test } from 'bun:test';
import { assertKoreanScript, assertSummaryMatchesDisplayFormat } from './text-summary-format';

describe('assertSummaryMatchesDisplayFormat', () => {
  test('accepts QNA', () => {
    expect(() =>
      assertSummaryMatchesDisplayFormat('Q: 뭐야?\nA: 쉽게 말하면 이렇게 동작해.', 'QNA'),
    ).not.toThrow();
  });

  test('accepts single-line QNA', () => {
    expect(() =>
      assertSummaryMatchesDisplayFormat('Q: 뭐야? A: 이렇게 동작해.', 'QNA'),
    ).not.toThrow();
  });

  test('rejects plain sentence for QNA', () => {
    expect(() => assertSummaryMatchesDisplayFormat('그냥 문장으로 설명했어.', 'QNA')).toThrow(
      /QNA/,
    );
  });

  test('rejects Chinese mixed into QNA', () => {
    expect(() =>
      assertSummaryMatchesDisplayFormat('Q: 뭐야?\nA: 자기주목机制로 동작해.', 'QNA'),
    ).toThrow(/Korean/);
  });

  test('accepts KEYWORD_LIST', () => {
    expect(() =>
      assertSummaryMatchesDisplayFormat('- 하나\n- 둘\n- 셋', 'KEYWORD_LIST'),
    ).not.toThrow();
  });

  test('rejects KEYWORD_LIST without bullets', () => {
    expect(() => assertSummaryMatchesDisplayFormat('하나\n둘\n셋', 'KEYWORD_LIST')).toThrow(
      /KEYWORD_LIST/,
    );
  });
});

describe('assertKoreanScript', () => {
  test('allows Hangul and Latin', () => {
    expect(() => assertKoreanScript('셀프 어텐션 self-attention', 'content')).not.toThrow();
  });

  test('rejects Chinese', () => {
    expect(() => assertKoreanScript('机制', 'content')).toThrow(/Korean/);
  });
});
