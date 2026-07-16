"use client";

import { useEffect, useState } from "react";
import { fetchLearningHome, type LearningHome } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import FlashcardModal, { type FlashcardItem } from "./FlashcardModal";
import ReelSidePanel from "./ReelSidePanel";
import styles from "./home.module.css";

function formatRelativeTime(iso: string): string {
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "오늘";
  if (diffDays === 1) return "어제";
  return `${diffDays}일 전`;
}

export default function HomePage() {
  const [data, setData] = useState<LearningHome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashcardStart, setFlashcardStart] = useState<number | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("로그인이 필요합니다.");
      return;
    }
    fetchLearningHome(accessToken)
      .then((home) => {
        setData(home);
        setSelectedField(home.frequentExpressions[0]?.fieldName ?? null);
      })
      .catch(() => setError("학습 홈 정보를 불러오지 못했습니다."));
  }, []);

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <p className={styles.statsRow}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <p className={styles.statsRow}>불러오는 중...</p>
        </div>
      </div>
    );
  }

  const flashcardItems: FlashcardItem[] = data.frequentExpressions.map((item) => ({
    field: item.fieldName,
    text: item.title,
    note: item.definition,
    sourceTitle: item.sourceTitle,
  }));

  const maxFieldDragCount = Math.max(1, ...data.fieldStats.map((f) => f.dragCount));

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.hero}>
          <h1 className={styles.heroTitle}>이번 주 자주 드래그한 표현이에요</h1>
          <p className={styles.heroSubtitle}>
            페이지에서 드래그한 단어와 문장을 모아 릴스와 플래시카드로 복습해보세요
          </p>
        </header>

        <p className={styles.statsRow}>
          저장한 표현 <span className={styles.statValue}>{data.summary.savedCount}</span> · 총 드래그{" "}
          <span className={styles.statValue}>{data.summary.totalDragCount}</span>회 · 관심 분야{" "}
          <span className={styles.statValue}>{data.summary.interestFieldCount}</span>개
        </p>

        <section className={styles.topCard}>
          <div className={styles.topCardLeft}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>많이 드래그한 표현</h2>
              {flashcardItems.length > 0 && (
                <button
                  type="button"
                  className={styles.flashcardStartButton}
                  onClick={() => setFlashcardStart(0)}
                >
                  플래시카드로 전체 복습
                </button>
              )}
            </div>

            <div className={styles.itemList}>
              {data.frequentExpressions.map((item, itemIndex) => (
                <div key={item.id} className={styles.itemCard}>
                  <div className={styles.itemBody}>
                    <p className={styles.itemText}>{item.title}</p>
                    <p className={styles.itemNote}>{item.definition}</p>
                    <div className={styles.itemMeta}>
                      <span className={styles.itemMetaRow}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        {item.dragCount}회 드래그
                      </span>
                      <span className={styles.itemMetaRow}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {item.sourceTitle}
                      </span>
                    </div>
                  </div>

                  <div className={styles.itemActions}>
                    <button
                      type="button"
                      className={styles.itemActionButton}
                      onClick={() => setFlashcardStart(itemIndex)}
                    >
                      플래시카드
                    </button>
                    <button
                      type="button"
                      className={`${styles.itemActionButton} ${styles.itemActionButtonPrimary}`}
                      onClick={() => setSelectedField(item.fieldName)}
                    >
                      관련 릴스
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedField && (
            <ReelSidePanel field={selectedField} shorts={data.relatedShorts} />
          )}
        </section>

        <section className={styles.bottomGrid}>
          <div className={styles.panelCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>최근에 저장한 표현</h2>
            </div>
            <div className={styles.recentList}>
              {data.recentExpressions.map((item) => {
                const flashcardIndex = data.frequentExpressions.findIndex(
                  (f) => f.id === item.id,
                );
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.recentRow}
                    disabled={flashcardIndex < 0}
                    onClick={() => flashcardIndex >= 0 && setFlashcardStart(flashcardIndex)}
                  >
                    <div className={styles.recentRowText}>
                      <span className={styles.recentRowWord}>{item.title}</span>
                      <span className={styles.recentRowMeta}>
                        {item.fieldName} · {item.sourceTitle}
                      </span>
                    </div>
                    <span className={styles.recentRowTime}>{formatRelativeTime(item.savedAt)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.panelCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>관심 분야 현황</h2>
            </div>
            <div className={styles.fieldStatsList}>
              {data.fieldStats.map((stat) => (
                <div key={stat.fieldId} className={styles.fieldStatRow}>
                  <div className={styles.fieldStatTop}>
                    <span className={styles.fieldStatName}>{stat.fieldName}</span>
                    <span className={styles.fieldStatCount}>
                      표현 {stat.expressionCount}개 · 드래그 {stat.dragCount}회
                    </span>
                  </div>
                  <div className={styles.fieldStatBarTrack}>
                    <div
                      className={styles.fieldStatBarFill}
                      style={{ width: `${(stat.dragCount / maxFieldDragCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {flashcardStart !== null && flashcardItems.length > 0 && (
        <FlashcardModal
          items={flashcardItems}
          startIndex={flashcardStart}
          onClose={() => setFlashcardStart(null)}
        />
      )}
    </div>
  );
}
