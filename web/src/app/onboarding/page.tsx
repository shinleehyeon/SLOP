"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./onboarding.module.css";
import {
  saveOnboardingSettings,
  type OnboardingDifficulty,
  type OnboardingDisplayFormat,
  type OnboardingShortsStyle,
  type OnboardingTone,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type DifficultyLevel = "easy" | "normal" | "expert";

interface SimpleOption {
  id: string;
  label: string;
  example: string;
}

interface DifficultyOption {
  level: DifficultyLevel;
  label: string;
  example: string;
}

interface DifficultyQuestion {
  field: string;
  topic: string;
  options: [DifficultyOption, DifficultyOption, DifficultyOption];
}

const FIELD_OPTIONS = [
  "건강/의학",
  "경제/재테크",
  "IT/테크",
  "시사/사회",
  "연예/문화",
  "스포츠",
  "라이프스타일",
  "과학",
];

const TONE_OPTIONS: SimpleOption[] = [
  {
    id: "casual",
    label: "반말/친근",
    example: "야 이거 실화냐? 커피 세 잔이면 오래 산대!",
  },
  {
    id: "polite",
    label: "존댓말/정중",
    example: "커피를 매일 세 잔 마시면 수명이 늘어난다고 합니다.",
  },
  {
    id: "anchor",
    label: "뉴스/객관",
    example: "연구에 따르면 하루 세 잔의 커피 섭취가 수명 연장과 관련이 있습니다.",
  },
];

const FORMAT_OPTIONS: SimpleOption[] = [
  {
    id: "sentence",
    label: "완전한 문장형",
    example: "커피를 매일 세 잔 마시면 수명이 늘어난다는 연구 결과가 있습니다.",
  },
  {
    id: "keyword",
    label: "키워드 나열형",
    example: "☕ 하루 3잔 / 📊 20만 명 추적 / ⏳ 25년 연구 / 사망률 15%↓",
  },
  {
    id: "qna",
    label: "질문-답변형",
    example: "커피, 매일 마셔도 될까요? 연구 결과는 '그렇다'입니다.",
  },
];

const STYLE_OPTIONS: SimpleOption[] = [
  {
    id: "hook",
    label: "재미/훅 위주",
    example: "여러분, 커피 많이 마시면 몸에 안 좋다고 들으셨죠? 사실은 정반대였습니다.",
  },
  {
    id: "data",
    label: "정보/데이터 위주",
    example:
      "하버드 연구팀이 20만 명을 25년간 추적한 결과, 하루 3잔 섭취군의 사망률이 15% 낮았습니다.",
  },
  {
    id: "story",
    label: "스토리텔링 위주",
    example: "1995년, 한 연구팀이 궁금해했습니다. 커피가 정말 몸에 해로울까?",
  },
  {
    id: "impact",
    label: "임팩트 카피형",
    example: "커피 한 잔의 배신, 반전 있음.",
  },
];

const FIELD_DIFFICULTY_QUESTIONS: Record<string, DifficultyQuestion> = {
  "건강/의학": {
    field: "건강/의학",
    topic: "커피와 수명",
    options: [
      {
        level: "easy",
        label: "쉬움",
        example:
          "커피를 마시면 몸 안의 나쁜 물질이 줄어들어서 더 건강하게 오래 살 수 있대요.",
      },
      {
        level: "normal",
        label: "보통",
        example:
          "커피 속 항산화 성분이 세포 손상을 줄여 만성질환 위험을 낮추는 것으로 나타났습니다.",
      },
      {
        level: "expert",
        label: "전문",
        example:
          "커피에 포함된 폴리페놀 계열 항산화물질이 산화 스트레스를 억제하여 심혈관 질환 및 대사증후군 발병률을 유의하게 감소시켰습니다.",
      },
    ],
  },
  "경제/재테크": {
    field: "경제/재테크",
    topic: "금리 인상",
    options: [
      {
        level: "easy",
        label: "쉬움",
        example: "금리가 오르면 대출 이자가 늘어서 돈 쓰기가 더 부담스러워져요.",
      },
      {
        level: "normal",
        label: "보통",
        example:
          "기준금리 인상은 대출금리 상승으로 이어져 소비 심리를 위축시키는 경향이 있습니다.",
      },
      {
        level: "expert",
        label: "전문",
        example:
          "중앙은행의 기준금리 인상은 시중 유동성을 축소시켜 총수요를 억제하고 인플레이션 압력을 완화하는 통화정책 수단입니다.",
      },
    ],
  },
  "IT/테크": {
    field: "IT/테크",
    topic: "AI 추천 알고리즘",
    options: [
      {
        level: "easy",
        label: "쉬움",
        example: "내가 좋아할 만한 걸 컴퓨터가 알아서 골라서 보여주는 거예요.",
      },
      {
        level: "normal",
        label: "보통",
        example:
          "AI가 사용자의 이용 기록을 분석해 맞춤형 콘텐츠를 추천해주는 방식입니다.",
      },
      {
        level: "expert",
        label: "전문",
        example:
          "추천 알고리즘은 협업 필터링과 딥러닝 임베딩을 결합해 사용자-아이템 상호작용을 벡터 공간에서 모델링합니다.",
      },
    ],
  },
  "시사/사회": {
    field: "시사/사회",
    topic: "저출산",
    options: [
      {
        level: "easy",
        label: "쉬움",
        example: "아기를 낳는 사람이 점점 줄어들어서 나라 전체 인구가 줄어들고 있어요.",
      },
      {
        level: "normal",
        label: "보통",
        example:
          "출산율 감소로 인해 생산가능인구가 줄어드는 문제가 심화되고 있습니다.",
      },
      {
        level: "expert",
        label: "전문",
        example:
          "합계출산율의 지속적 하락은 생산가능인구 감소와 부양비 상승을 초래해 잠재성장률 저하로 이어지고 있습니다.",
      },
    ],
  },
  "연예/문화": {
    field: "연예/문화",
    topic: "스트리밍 서비스",
    options: [
      {
        level: "easy",
        label: "쉬움",
        example: "요즘은 TV 대신 인터넷으로 영화나 드라마를 골라서 봐요.",
      },
      {
        level: "normal",
        label: "보통",
        example:
          "OTT 서비스의 성장으로 콘텐츠 소비 방식이 실시간 방송에서 주문형으로 바뀌고 있습니다.",
      },
      {
        level: "expert",
        label: "전문",
        example:
          "OTT 플랫폼의 확산은 콘텐츠 유통 구조를 선형 편성에서 알고리즘 기반 개인화 소비로 전환시켰습니다.",
      },
    ],
  },
  스포츠: {
    field: "스포츠",
    topic: "인터벌 트레이닝",
    options: [
      {
        level: "easy",
        label: "쉬움",
        example: "빡세게 뛰었다 쉬었다를 반복하면 살이 더 잘 빠진대요.",
      },
      {
        level: "normal",
        label: "보통",
        example:
          "고강도와 휴식을 반복하는 인터벌 트레이닝은 짧은 시간에 체지방 감소 효과가 큽니다.",
      },
      {
        level: "expert",
        label: "전문",
        example:
          "고강도 인터벌 트레이닝은 운동 후 초과산소소비량(EPOC)을 증가시켜 안정 시 대사량을 일정 기간 높게 유지시킵니다.",
      },
    ],
  },
  라이프스타일: {
    field: "라이프스타일",
    topic: "미니멀 라이프",
    options: [
      {
        level: "easy",
        label: "쉬움",
        example: "필요 없는 물건을 줄이면 마음이 더 편해진대요.",
      },
      {
        level: "normal",
        label: "보통",
        example: "미니멀 라이프는 불필요한 소유를 줄여 삶의 만족도를 높이는 방식입니다.",
      },
      {
        level: "expert",
        label: "전문",
        example:
          "미니멀리즘은 소비주의에 대한 반작용으로, 자원 배분의 효율화를 통해 심리적 여유와 자기결정감을 회복하려는 생활양식입니다.",
      },
    ],
  },
  과학: {
    field: "과학",
    topic: "블랙홀",
    options: [
      {
        level: "easy",
        label: "쉬움",
        example: "너무 힘이 세서 빛도 빠져나오지 못하는 우주의 구멍이에요.",
      },
      {
        level: "normal",
        label: "보통",
        example: "블랙홀은 중력이 매우 강해 빛조차 빠져나올 수 없는 천체입니다.",
      },
      {
        level: "expert",
        label: "전문",
        example:
          "블랙홀은 사건의 지평선 내부에서 탈출 속도가 광속을 초과해 전자기 복사조차 방출되지 않는 시공간 영역입니다.",
      },
    ],
  },
};

function genericDifficultyQuestion(field: string): DifficultyQuestion {
  return {
    field,
    topic: `${field} 소식 설명 방식`,
    options: [
      {
        level: "easy",
        label: "쉬움",
        example: `${field}에서 있었던 일을 쉽고 편한 말로 풀어서 설명해드려요.`,
      },
      {
        level: "normal",
        label: "보통",
        example: `${field} 관련 주요 내용을 요점 중심으로 설명해드립니다.`,
      },
      {
        level: "expert",
        label: "전문",
        example: `${field} 분야의 전문 용어와 세부 맥락을 포함해 깊이 있게 설명해드립니다.`,
      },
    ],
  };
}

// Step order: 0 어투, 1 표시 형식, 2 쇼츠 스타일, 3 분야, 4 분야별 용어 난이도
const MAIN_STEP_COUNT = 5;
const STORAGE_KEY = "slop_onboarding_preferences";

const TONE_TO_API: Record<string, OnboardingTone> = {
  casual: "CASUAL",
  polite: "POLITE",
  anchor: "NEWS",
};

const FORMAT_TO_API: Record<string, OnboardingDisplayFormat> = {
  sentence: "SENTENCE",
  keyword: "KEYWORD_LIST",
  qna: "QNA",
};

// The API only has two shortsStyle buckets, so the four onboarding options
// collapse into them: hook/impact read as "fun", data/story read as "info".
const STYLE_TO_API: Record<string, OnboardingShortsStyle> = {
  hook: "FUN",
  impact: "FUN",
  data: "INFO",
  story: "INFO",
};

const DIFFICULTY_TO_API: Record<DifficultyLevel, OnboardingDifficulty> = {
  easy: "EASY",
  normal: "MEDIUM",
  expert: "HARD",
};

export default function OnboardingPage() {
  const router = useRouter();

  const [mainStep, setMainStep] = useState(0);

  const [tone, setTone] = useState<string | null>(null);
  const [format, setFormat] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);

  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [customFieldInput, setCustomFieldInput] = useState("");
  const [noFieldPreference, setNoFieldPreference] = useState(false);

  const [quizIndex, setQuizIndex] = useState(0);
  const [difficultyAnswers, setDifficultyAnswers] = useState<
    Record<number, DifficultyLevel>
  >({});

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const allFields = useMemo(
    () => [...selectedFields, ...customFields],
    [selectedFields, customFields],
  );

  const quizQuestions = useMemo(
    () =>
      allFields.map(
        (field) => FIELD_DIFFICULTY_QUESTIONS[field] ?? genericDifficultyQuestion(field),
      ),
    [allFields],
  );

  const toggleField = (field: string) => {
    setNoFieldPreference(false);
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  };

  const toggleNoFieldPreference = () => {
    setNoFieldPreference((prev) => {
      const next = !prev;
      if (next) {
        setSelectedFields([]);
        setCustomFields([]);
      }
      return next;
    });
  };

  const handleAddCustomField = () => {
    const name = customFieldInput.trim();
    if (!name) return;
    if (allFields.includes(name)) {
      setCustomFieldInput("");
      return;
    }
    setNoFieldPreference(false);
    setCustomFields((prev) => [...prev, name]);
    setCustomFieldInput("");
  };

  const handleRemoveCustomField = (name: string) => {
    setCustomFields((prev) => prev.filter((f) => f !== name));
  };

  const finish = async (finalAnswers: Record<number, DifficultyLevel>) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tone,
        format,
        style,
        fields: allFields,
        difficulty: quizQuestions.map((question, index) => ({
          field: question.field,
          topic: question.topic,
          level: finalAnswers[index],
        })),
      }),
    );

    const accessToken = getAccessToken();
    if (!accessToken) {
      // No token anywhere (localStorage or sessionStorage) — surface this
      // instead of silently bouncing to /login, since a quiet redirect
      // looks identical to "nothing happened" and hides why no request
      // was ever sent.
      setSaveError("로그인이 필요합니다. 잠시 후 로그인 화면으로 이동합니다.");
      setTimeout(() => router.replace("/login"), 1200);
      return;
    }

    setSaveError(null);
    setIsSaving(true);
    try {
      await saveOnboardingSettings(
        {
          tone: TONE_TO_API[tone as string],
          displayFormat: FORMAT_TO_API[format as string],
          shortsStyle: STYLE_TO_API[style as string],
          fieldChoices: quizQuestions.map((question, index) => ({
            fieldName: question.field,
            difficulty: DIFFICULTY_TO_API[finalAnswers[index]],
          })),
        },
        accessToken,
      );
      router.replace("/home");
    } catch {
      setSaveError("설정을 저장하지 못했습니다. 다시 시도해주세요.");
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (mainStep === 0) {
      router.back();
      return;
    }
    if (mainStep === 4 && quizIndex > 0) {
      setQuizIndex((prev) => prev - 1);
      return;
    }
    setMainStep((prev) => prev - 1);
  };

  const handleNext = () => {
    if (mainStep === 0) {
      if (!tone) return;
      setMainStep(1);
      return;
    }

    if (mainStep === 1) {
      if (!format) return;
      setMainStep(2);
      return;
    }

    if (mainStep === 2) {
      if (!style) return;
      setMainStep(3);
      return;
    }

    if (mainStep === 3) {
      if (allFields.length === 0 && !noFieldPreference) return;
      setQuizIndex(0);
      setDifficultyAnswers({});
      if (allFields.length === 0) {
        finish({});
        return;
      }
      setMainStep(4);
      return;
    }

    // mainStep === 4: difficulty quiz
    if (!difficultyAnswers[quizIndex]) return;

    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((prev) => prev + 1);
      return;
    }

    finish(difficultyAnswers);
  };

  const fillPercents = Array.from({ length: MAIN_STEP_COUNT }, (_, index) => {
    if (index < mainStep) return 100;
    if (index > mainStep) return 0;
    if (mainStep === 4) {
      return Math.round((quizIndex / Math.max(quizQuestions.length, 1)) * 100);
    }
    return 100;
  });

  const isNextDisabled =
    isSaving ||
    (mainStep === 0 && !tone) ||
    (mainStep === 1 && !format) ||
    (mainStep === 2 && !style) ||
    (mainStep === 3 && allFields.length === 0 && !noFieldPreference) ||
    (mainStep === 4 && !difficultyAnswers[quizIndex]);

  const currentQuestion = quizQuestions[quizIndex];

  return (
    <div className={styles.page}>
      <button
        type="button"
        onClick={handleBack}
        className={styles.backButton}
        aria-label="뒤로 가기"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <div className={styles.card}>
        <div className={styles.progress}>
          {fillPercents.map((fill, index) => (
            <div key={index} className={styles.progressSegment}>
              <div className={styles.progressSegmentFill} style={{ width: `${fill}%` }} />
            </div>
          ))}
        </div>

        {mainStep === 0 && (
          <>
            <p className={styles.step}>1 / 5</p>
            <h1 className={styles.title}>어떤 말투로 만들어드릴까요?</h1>
            <p className={styles.subtitle}>선택한 말투로 쇼츠 대본이 만들어져요</p>

            <div className={styles.options}>
              {TONE_OPTIONS.map((option) => {
                const isSelected = tone === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTone(option.id)}
                    className={`${styles.option} ${
                      isSelected ? styles.optionSelected : ""
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className={styles.optionHeader}>
                      <span className={styles.optionLabel}>{option.label}</span>
                      <span className={styles.optionRadio} aria-hidden="true" />
                    </div>
                    <p className={styles.optionExample}>{option.example}</p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {mainStep === 1 && (
          <>
            <p className={styles.step}>2 / 5</p>
            <h1 className={styles.title}>어떤 형식으로 보여드릴까요?</h1>
            <p className={styles.subtitle}>정보를 화면에 구성하는 방식을 선택해주세요</p>

            <div className={styles.options}>
              {FORMAT_OPTIONS.map((option) => {
                const isSelected = format === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFormat(option.id)}
                    className={`${styles.option} ${
                      isSelected ? styles.optionSelected : ""
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className={styles.optionHeader}>
                      <span className={styles.optionLabel}>{option.label}</span>
                      <span className={styles.optionRadio} aria-hidden="true" />
                    </div>
                    <p className={styles.optionExample}>{option.example}</p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {mainStep === 2 && (
          <>
            <p className={styles.step}>3 / 5</p>
            <h1 className={styles.title}>쇼츠는 어떤 스타일이 좋아요?</h1>
            <p className={styles.subtitle}>콘텐츠를 구성하는 방식을 선택해주세요</p>

            <div className={styles.options}>
              {STYLE_OPTIONS.map((option) => {
                const isSelected = style === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setStyle(option.id)}
                    className={`${styles.option} ${
                      isSelected ? styles.optionSelected : ""
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className={styles.optionHeader}>
                      <span className={styles.optionLabel}>{option.label}</span>
                      <span className={styles.optionRadio} aria-hidden="true" />
                    </div>
                    <p className={styles.optionExample}>{option.example}</p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {mainStep === 3 && (
          <>
            <p className={styles.step}>4 / 5</p>
            <h1 className={styles.title}>어떤 분야에 관심이 있으세요?</h1>
            <p className={styles.subtitle}>
              선택한 분야에 맞는 콘텐츠를 만들어드려요 (여러 개 선택 가능)
            </p>

            <div className={styles.fieldGrid}>
              {FIELD_OPTIONS.map((field) => {
                const isSelected = selectedFields.includes(field);
                return (
                  <button
                    key={field}
                    type="button"
                    onClick={() => toggleField(field)}
                    className={`${styles.fieldChip} ${
                      isSelected ? styles.fieldChipSelected : ""
                    }`}
                    aria-pressed={isSelected}
                  >
                    {field}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={toggleNoFieldPreference}
                className={`${styles.fieldChip} ${
                  noFieldPreference ? styles.fieldChipSelected : ""
                }`}
                aria-pressed={noFieldPreference}
              >
                없음
              </button>
            </div>

            <form
              className={styles.customFieldForm}
              onSubmit={(e) => {
                e.preventDefault();
                handleAddCustomField();
              }}
            >
              <input
                type="text"
                value={customFieldInput}
                onChange={(e) => setCustomFieldInput(e.target.value)}
                placeholder="관심 분야 직접 추가"
                className={styles.customFieldInput}
              />
              <button
                type="submit"
                disabled={!customFieldInput.trim()}
                className={styles.customFieldAdd}
              >
                추가
              </button>
            </form>

            {customFields.length > 0 && (
              <div className={styles.customChipList}>
                {customFields.map((field) => (
                  <span key={field} className={styles.customChip}>
                    {field}
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(field)}
                      className={styles.customChipRemove}
                      aria-label={`${field} 삭제`}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <path d="m18 6-12 12M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {mainStep === 4 && currentQuestion && (
          <>
            <div className={styles.stepRow}>
              <p className={styles.step}>
                5 / 5 · {quizIndex + 1} / {quizQuestions.length}
              </p>
              <span className={styles.quizTag}>{currentQuestion.field}</span>
            </div>
            <h1 className={styles.title}>용어는 어느 정도가 편하세요?</h1>
            <p className={styles.subtitle}>{currentQuestion.topic}</p>

            <div className={styles.duoOptions}>
              {currentQuestion.options.slice(0, 2).map((option) => {
                const isSelected = difficultyAnswers[quizIndex] === option.level;
                return (
                  <button
                    key={option.level}
                    type="button"
                    onClick={() =>
                      setDifficultyAnswers((prev) => ({
                        ...prev,
                        [quizIndex]: option.level,
                      }))
                    }
                    className={`${styles.duoOption} ${
                      isSelected ? styles.duoOptionSelected : ""
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span className={styles.duoOptionLabel}>{option.label}</span>
                    <p className={styles.duoOptionExample}>{option.example}</p>
                  </button>
                );
              })}
            </div>

            {currentQuestion.options[2] && (
              <button
                type="button"
                onClick={() =>
                  setDifficultyAnswers((prev) => ({
                    ...prev,
                    [quizIndex]: currentQuestion.options[2].level,
                  }))
                }
                className={`${styles.duoOption} ${styles.duoOptionWide} ${
                  difficultyAnswers[quizIndex] === currentQuestion.options[2].level
                    ? styles.duoOptionSelected
                    : ""
                }`}
                aria-pressed={difficultyAnswers[quizIndex] === currentQuestion.options[2].level}
              >
                <span className={styles.duoOptionLabel}>
                  {currentQuestion.options[2].label}
                </span>
                <p className={styles.duoOptionExample}>
                  {currentQuestion.options[2].example}
                </p>
              </button>
            )}
          </>
        )}

        {saveError && <p className={styles.errorText}>{saveError}</p>}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleNext}
            disabled={isNextDisabled}
            className={`${styles.button} ${styles.primary}`}
          >
            {isSaving
              ? "저장 중..."
              : mainStep === 3 && noFieldPreference
                ? "건너뛰기"
                : mainStep === 4 && quizIndex === quizQuestions.length - 1
                  ? "시작하기"
                  : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}
