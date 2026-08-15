type FieldChoicePrompt = {
  fieldName: string;
  difficulty: string;
};

type ProfilePrompt = {
  tone: string;
  displayFormat: string;
  shortsStyle: string;
  fieldChoices: FieldChoicePrompt[];
};

export const TEXT_SUMMARY_SYSTEM_PROMPT = `
# 시스템 지침
Shortlens의 온보딩 보조 AI로써 아래 지시사항에 따라 작업하세요.

## 역할
사용자가 웹/앱에서 지정한 텍스트를 이해도에 맞게 표현을 대체합니다.

## 응답
응답 본문에는 변환된 텍스트만 출력해야합니다.
`.trim();

export function buildTextSummaryUserPrompt(input: {
  text: string;
  context?: string | null;
  profile: ProfilePrompt;
}): string {
  const toneGuide =
    {
      CASUAL: '반말·구어체. 친근하고 가벼운 말투',
      POLITE: '존댓말. 정중하고 읽기 쉬운 말투',
      NEWS: '뉴스 앵커/기사체. 객관적이고 간결한 보도체',
    }[input.profile.tone] ?? input.profile.tone;

  const formatGuide =
    {
      SENTENCE: '완결된 문장 1~3개만. 불릿/번호/Q:/A: 금지',
      KEYWORD_LIST: '불릿 목록만. 각 줄은 "- "로 시작, 3~6개. 긴 문장·Q&A 금지',
      QNA: '반드시 "Q: ..." 한 줄과 "A: ..." 한두 줄만. 그 외 형식 금지',
    }[input.profile.displayFormat] ?? input.profile.displayFormat;

  const formatExample =
    {
      SENTENCE: '예: 문장만 이어 쓴 짧은 설명.',
      KEYWORD_LIST: '예:\n- 핵심1\n- 핵심2\n- 핵심3',
      QNA: '예:\nQ: 이건 뭐야?\nA: 쉽게 말하면 이렇게 동작해.',
    }[input.profile.displayFormat] ?? '';

  const styleGuide =
    {
      FUN: '숏폼에 어울리게 흥미·훅을 살리고 딱딱하지 않게',
      INFO: '정보 전달 우선. 과장·드립 없이 명확하게',
    }[input.profile.shortsStyle] ?? input.profile.shortsStyle;

  const difficultyGuide = {
    EASY:
      '초등학생 눈높이. 전문어·한자어·영어 금지, 일상 사물이나 행동에 빗대어 설명. ' +
      '문장 구조: "~하는 것/거예요" 형태로 끝나는 한 문장. 원인·배경 설명 없이 무엇을 하는지만. ' +
      '25자 이내. 예: "질문에 답을 척척 해주는 똑똑한 컴퓨터예요."',
    MEDIUM:
      '일반 성인 눈높이. 핵심 용어 1개는 살리되 괄호나 쉼표로 바로 풀이. ' +
      '문장 구조: "[핵심 용어]로, [무엇을 하는지] [기술/도구]." 형태의 정의문 한 문장. ' +
      '배경·원리 설명 생략, 결과·기능 중심. 35자 이내. ' +
      '예: "대량의 텍스트를 학습해 자연스러운 문장을 만드는 AI 모델이에요."',
    HARD:
      '전공자 눈높이. 핵심 기술 용어는 그대로 사용, 풀이는 생략하거나 최소화. ' +
      '문장 구조: "[구조/메커니즘] 기반의 [범주]로, [핵심 동작 원리]." 형태. ' +
      '비유·일상 언어 금지, 메커니즘·원리 중심. 40자 이내. ' +
      '예: "트랜스포머 기반 대규모 언어 모델로, 어텐션으로 문맥을 처리해요."',
  };

  const difficulties = input.profile.fieldChoices.map((choice) => choice.difficulty);
  const effectiveDifficulty = pickEffectiveDifficulty(difficulties);

  const fieldLines =
    input.profile.fieldChoices.length > 0
      ? input.profile.fieldChoices
          .map((choice) => {
            const guide =
              difficultyGuide[choice.difficulty as keyof typeof difficultyGuide] ??
              choice.difficulty;
            return `- ${choice.fieldName}: ${choice.difficulty} (${guide})`;
          })
          .join('\n')
      : '- (관심 분야 없음 — EASY에 가깝게 쉬운 말로 작성)';

  const contextBlock = input.context?.trim()
    ? `\n주변 문맥(참고용, 요약 대상은 아님):\n"""\n${input.context.trim()}\n"""\n`
    : '';

  return `
[온보딩 프로필 — 전부 필수 반영]
- tone: ${input.profile.tone} → ${toneGuide}
- displayFormat: ${input.profile.displayFormat} → ${formatGuide}
  ${formatExample}
- shortsStyle: ${input.profile.shortsStyle} → ${styleGuide}
- 적용 난이도: ${effectiveDifficulty} → ${difficultyGuide[effectiveDifficulty]}
- 관심 분야·난이도:
${fieldLines}

[드래그된 원문]
"""
${input.text.trim()}
"""
${contextBlock}
[작업]
1. 원문 의미를 유지한 채, 온보딩 규칙에 맞게 본문만 다시 쓰세요.
2. displayFormat=${input.profile.displayFormat} 형식을 반드시 지키세요.
3. EASY일 때: Transformer, self-attention 같은 전문어를 쉬운 말로 바꾸세요.
4. 메타 문장 금지. 출처·참고 링크·URL을 본문에 쓰지 마세요 (출처는 API citations로 따로 옵니다).
5. 한글(+ 필요 시 영어 용어)만. 중국어/일본어 글자 금지.
6. 이모지 장식 금지. KEYWORD_LIST의 줄머리 "- "만 허용.

[출력]
변환된 텍스트만 출력하세요. JSON 금지.
`.trim();
}

function pickEffectiveDifficulty(difficulties: string[]): 'EASY' | 'MEDIUM' | 'HARD' {
  if (difficulties.includes('EASY')) {
    return 'EASY';
  }
  if (difficulties.includes('MEDIUM')) {
    return 'MEDIUM';
  }
  if (difficulties.includes('HARD')) {
    return 'HARD';
  }
  return 'EASY';
}
