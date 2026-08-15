/** CJK ideographs + Japanese kana (Hangul is outside this range). */
const NON_KOREAN_CJK = /[\u3040-\u30FF\u3400-\u9FFF\uF900-\uFAFF]/u;

export function assertSummaryMatchesDisplayFormat(summary: string, displayFormat: string) {
  const trimmed = summary.trim();

  assertKoreanScript(trimmed, 'content');

  if (displayFormat === 'QNA') {
    if (!/^Q:\s*\S[\s\S]*?(?:\n|\s)A:\s*\S[\s\S]*$/u.test(trimmed)) {
      throw new Error('content must use QNA format: "Q: ...\\nA: ..."');
    }
    return;
  }

  if (displayFormat === 'KEYWORD_LIST') {
    const lines = trimmed
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 3 || lines.length > 6 || !lines.every((line) => line.startsWith('- '))) {
      throw new Error('content must use KEYWORD_LIST format: 3~6 lines starting with "- "');
    }
  }
}

export function assertKoreanScript(text: string, field: string) {
  if (NON_KOREAN_CJK.test(text)) {
    throw new Error(
      `${field} must be Korean (Hangul); Chinese/Japanese characters are not allowed`,
    );
  }
}
