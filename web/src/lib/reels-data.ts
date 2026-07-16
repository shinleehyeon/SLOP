export interface ReelUser {
  id: string;
  username: string;
  displayName: string;
  avatarGradient: string;
  bio: string;
  followers: number;
  following: number;
}

export interface Reel {
  id: string;
  userId: string;
  caption: string;
  music: string;
  gradient: string;
  likes: number;
  shares: number;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: number;
}

export const CURRENT_USER_ID = "me";

export const USERS: ReelUser[] = [
  {
    id: "me",
    username: "my_slop",
    displayName: "나의 슬랍",
    avatarGradient: "linear-gradient(135deg, #70eaff, #4de0fa)",
    bio: "숏폼으로 세상 소식을 정리해요 📰",
    followers: 128,
    following: 54,
  },
  {
    id: "u1",
    username: "haneul.news",
    displayName: "하늘 뉴스룸",
    avatarGradient: "linear-gradient(135deg, #ff9a9e, #fecfef)",
    bio: "매일 아침 5분 시사 브리핑 ☀️",
    followers: 84200,
    following: 312,
  },
  {
    id: "u2",
    username: "tech.doyeon",
    displayName: "도연의 테크노트",
    avatarGradient: "linear-gradient(135deg, #a1c4fd, #c2e9fb)",
    bio: "IT/테크 소식을 쉽게 풀어드립니다 💻",
    followers: 45900,
    following: 128,
  },
  {
    id: "u3",
    username: "jaemi.economy",
    displayName: "재미있는 경제",
    avatarGradient: "linear-gradient(135deg, #fbc2eb, #a6c1ee)",
    bio: "경제/재테크 뉴스, 재미있게 📈",
    followers: 231000,
    following: 76,
  },
  {
    id: "u4",
    username: "space.lab",
    displayName: "우주 연구소",
    avatarGradient: "linear-gradient(135deg, #84fab0, #8fd3f4)",
    bio: "과학 소식 전문 채널 🔭",
    followers: 15300,
    following: 21,
  },
];

const GRADIENTS = [
  "linear-gradient(160deg, #ff9a9e 0%, #fad0c4 100%)",
  "linear-gradient(160deg, #a1c4fd 0%, #c2e9fb 100%)",
  "linear-gradient(160deg, #fbc2eb 0%, #a6c1ee 100%)",
  "linear-gradient(160deg, #84fab0 0%, #8fd3f4 100%)",
  "linear-gradient(160deg, #f6d365 0%, #fda085 100%)",
  "linear-gradient(160deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(160deg, #30cfd0 0%, #330867 100%)",
  "linear-gradient(160deg, #ff6a88 0%, #ff99ac 100%)",
];

export const REELS: Reel[] = [
  {
    id: "r1",
    userId: "u1",
    caption: "오늘 아침 꼭 알아야 할 시사 이슈 3가지 📰 #시사 #브리핑",
    music: "원본 오디오 · 하늘 뉴스룸",
    gradient: GRADIENTS[0],
    likes: 12400,
    shares: 340,
  },
  {
    id: "r2",
    userId: "u2",
    caption: "AI 추천 알고리즘, 이렇게 작동합니다 🤖 #IT #테크",
    music: "잔잔한 로파이 · doyeon_beat",
    gradient: GRADIENTS[1],
    likes: 8900,
    shares: 210,
  },
  {
    id: "r3",
    userId: "u3",
    caption: "금리 인상이 내 지갑에 미치는 영향 💸 #경제 #재테크",
    music: "원본 오디오 · 재미있는 경제",
    gradient: GRADIENTS[2],
    likes: 45210,
    shares: 1290,
  },
  {
    id: "r4",
    userId: "u4",
    caption: "블랙홀은 정말 모든 걸 삼킬까? 🕳️ #과학 #우주",
    music: "Deep Space · space.lab",
    gradient: GRADIENTS[3],
    likes: 30112,
    shares: 890,
  },
  {
    id: "r5",
    userId: "u1",
    caption: "저출산 문제, 숫자로 보면 이렇습니다 📊 #시사",
    music: "원본 오디오 · 하늘 뉴스룸",
    gradient: GRADIENTS[4],
    likes: 19800,
    shares: 455,
  },
  {
    id: "r6",
    userId: "u2",
    caption: "스트리밍 서비스 전쟁, 승자는? 🎬 #IT #OTT",
    music: "Chill Vibes · doyeon_beat",
    gradient: GRADIENTS[5],
    likes: 6720,
    shares: 98,
  },
  {
    id: "r7",
    userId: "u3",
    caption: "미니멀 라이프로 돈 모으는 법 🏠 #재테크 #라이프스타일",
    music: "원본 오디오 · 재미있는 경제",
    gradient: GRADIENTS[6],
    likes: 27650,
    shares: 640,
  },
  {
    id: "r8",
    userId: "u4",
    caption: "인터벌 트레이닝, 과학적으로 효과 있을까? 🏃 #스포츠 #과학",
    music: "Workout Mix · space.lab",
    gradient: GRADIENTS[7],
    likes: 11020,
    shares: 176,
  },
];

export function getUserByUsername(username: string): ReelUser | undefined {
  return USERS.find((u) => u.username === username);
}

export function getUserById(id: string): ReelUser | undefined {
  return USERS.find((u) => u.id === id);
}

export function getReelsByUserId(userId: string): Reel[] {
  return REELS.filter((r) => r.userId === userId);
}

export function formatCount(count: number): string {
  if (count >= 100_000_000) return `${(count / 100_000_000).toFixed(1)}억`;
  if (count >= 10_000) return `${(count / 10_000).toFixed(1)}만`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}천`;
  return String(count);
}
