export interface CapturedItem {
  id: string;
  text: string;
  type: "word" | "sentence";
  field: string;
  note: string;
  sourceTitle: string;
  sourceUrl: string;
  dragCount: number;
  capturedAt: number;
}

const DAY = 1000 * 60 * 60 * 24;
const now = Date.now();

export const CAPTURED_ITEMS: CapturedItem[] = [
  {
    id: "c1",
    text: "기준금리 인상",
    type: "sentence",
    field: "경제/재테크",
    note: "중앙은행이 시중 유동성을 조절하기 위해 기준이 되는 금리를 올리는 것",
    sourceTitle: "한국은행, 기준금리 0.25%p 인상 발표",
    sourceUrl: "news.naver.com",
    dragCount: 8,
    capturedAt: now - 1 * DAY,
  },
  {
    id: "c2",
    text: "AI 추천 알고리즘",
    type: "sentence",
    field: "IT/테크",
    note: "사용자의 이용 기록을 분석해 맞춤형 콘텐츠를 추천해주는 방식",
    sourceTitle: "넷플릭스 추천 시스템은 어떻게 작동할까",
    sourceUrl: "techcrunch.com",
    dragCount: 12,
    capturedAt: now - 1 * DAY,
  },
  {
    id: "c3",
    text: "저출산 고령화",
    type: "sentence",
    field: "시사/사회",
    note: "출산율은 낮아지고 고령 인구 비중은 높아지는 인구 구조 변화",
    sourceTitle: "2026년 인구 전망 보고서",
    sourceUrl: "hankyung.com",
    dragCount: 6,
    capturedAt: now - 2 * DAY,
  },
  {
    id: "c4",
    text: "사건의 지평선",
    type: "sentence",
    field: "과학",
    note: "그 안으로 들어가면 빛조차 빠져나올 수 없는 블랙홀 주변의 경계면",
    sourceTitle: "블랙홀을 촬영한 최초의 사진",
    sourceUrl: "namu.wiki",
    dragCount: 3,
    capturedAt: now - 3 * DAY,
  },
  {
    id: "c5",
    text: "인터벌 트레이닝",
    type: "word",
    field: "스포츠",
    note: "고강도 운동과 휴식을 짧은 간격으로 반복하는 훈련 방식",
    sourceTitle: "20분 홈트로 살 빼는 법",
    sourceUrl: "youtube.com",
    dragCount: 5,
    capturedAt: now - 3 * DAY,
  },
  {
    id: "c6",
    text: "미니멀 라이프",
    type: "word",
    field: "라이프스타일",
    note: "불필요한 소유를 줄여 삶의 만족도를 높이는 생활 방식",
    sourceTitle: "물건을 줄였더니 생긴 변화",
    sourceUrl: "brunch.co.kr",
    dragCount: 4,
    capturedAt: now - 4 * DAY,
  },
  {
    id: "c7",
    text: "OTT 오리지널 콘텐츠",
    type: "sentence",
    field: "연예/문화",
    note: "스트리밍 플랫폼이 자체 제작해 독점 공개하는 영상 콘텐츠",
    sourceTitle: "올해 화제가 된 오리지널 시리즈 TOP5",
    sourceUrl: "news.naver.com",
    dragCount: 7,
    capturedAt: now - 5 * DAY,
  },
  {
    id: "c8",
    text: "항산화 폴리페놀",
    type: "word",
    field: "건강/의학",
    note: "세포 손상을 줄여 만성질환 위험을 낮추는 것으로 알려진 식물성 성분",
    sourceTitle: "커피 하루 세 잔, 정말 몸에 좋을까",
    sourceUrl: "health.chosun.com",
    dragCount: 2,
    capturedAt: now - 6 * DAY,
  },
];

export function getMostDraggedItems(limit = 4): CapturedItem[] {
  return [...CAPTURED_ITEMS].sort((a, b) => b.dragCount - a.dragCount).slice(0, limit);
}

export function getRecentItems(limit = 6): CapturedItem[] {
  return [...CAPTURED_ITEMS].sort((a, b) => b.capturedAt - a.capturedAt).slice(0, limit);
}

export function formatRelativeTime(timestamp: number): string {
  const diffDays = Math.floor((Date.now() - timestamp) / DAY);
  if (diffDays <= 0) return "오늘";
  if (diffDays === 1) return "어제";
  return `${diffDays}일 전`;
}
