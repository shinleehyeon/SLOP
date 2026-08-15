import { describe, expect, test } from 'bun:test';
import { extractOpenRouterCitations, readAssistantContent } from './openrouter.citations';

describe('extractOpenRouterCitations', () => {
  test('reads OpenRouter url_citation annotations', () => {
    const citations = extractOpenRouterCitations({
      choices: [
        {
          message: {
            content: '본문',
            annotations: [
              {
                type: 'url_citation',
                url_citation: {
                  url: 'https://example.com/a',
                  title: '예제 A',
                  content: '스니펫 A',
                },
              },
            ],
          },
        },
      ],
    });

    expect(citations).toEqual([
      { url: 'https://example.com/a', title: '예제 A', snippet: '스니펫 A' },
    ]);
  });

  test('merges Perplexity citations and search_results', () => {
    const citations = extractOpenRouterCitations({
      choices: [{ message: { content: '본문', annotations: [] } }],
      citations: ['https://example.com/a', 'https://example.com/b'],
      search_results: [
        {
          title: '예제 A',
          url: 'https://example.com/a',
          snippet: '스니펫',
        },
      ],
    });

    expect(citations).toEqual([
      { url: 'https://example.com/a', title: '예제 A', snippet: '스니펫' },
      { url: 'https://example.com/b', title: null, snippet: null },
    ]);
  });
});

describe('readAssistantContent', () => {
  test('returns trimmed content', () => {
    expect(
      readAssistantContent({
        choices: [{ message: { content: '  변환된 텍스트  ' } }],
      }),
    ).toBe('변환된 텍스트');
  });
});
