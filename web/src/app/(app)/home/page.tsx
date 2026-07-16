"use client";

import { useState } from "react";
import { CURRENT_USER_ID, getReelsByTag, getUserById } from "@/lib/reels-data";
import {
  CAPTURED_ITEMS,
  formatRelativeTime,
  getFieldStats,
  getMostDraggedItems,
  getRecentItems,
} from "@/lib/home-data";
import FlashcardModal from "./FlashcardModal";
import ReelSidePanel from "./ReelSidePanel";
import styles from "./home.module.css";

export default function HomePage() {
  const currentUser = getUserById(CURRENT_USER_ID)!;
  const topItems = getMostDraggedItems(4);
  const recentItems = getRecentItems(5);
  const fieldStats = getFieldStats();
  const maxFieldDragCount = Math.max(...fieldStats.map((f) => f.totalDragCount));

  const [flashcardStart, setFlashcardStart] = useState<number | null>(null);
  const [selectedField, setSelectedField] = useState(topItems[0].field);

  const totalDragCount = CAPTURED_ITEMS.reduce((sum, item) => sum + item.dragCount, 0);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.hero}>
          <p className={styles.heroEyebrow}>{currentUser.displayName}님</p>
          <h1 className={styles.heroTitle}>이번 주 자주 드래그한 표현이에요</h1>
          <p className={styles.heroSubtitle}>
            페이지에서 드래그한 단어와 문장을 모아 릴스와 플래시카드로 복습해보세요
          </p>
        </header>

        <p className={styles.statsRow}>
          저장한 표현 <span className={styles.statValue}>{CAPTURED_ITEMS.length}</span> · 총 드래그{" "}
          <span className={styles.statValue}>{totalDragCount}</span>회 · 관심 분야{" "}
          <span className={styles.statValue}>{fieldStats.length}</span>개
        </p>

        <section className={styles.topCard}>
          <div className={styles.topCardLeft}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>많이 드래그한 표현</h2>
              <button
                type="button"
                className={styles.flashcardStartButton}
                onClick={() => setFlashcardStart(0)}
              >
                플래시카드로 전체 복습
              </button>
            </div>

            <div className={styles.itemList}>
              {topItems.map((item) => {
                const relatedReels = getReelsByTag(item.field);
                const itemIndex = CAPTURED_ITEMS.findIndex((c) => c.id === item.id);

                return (
                  <div key={item.id} className={styles.itemCard}>
                    <div className={styles.itemBody}>
                      <p className={styles.itemText}>{item.text}</p>
                      <p className={styles.itemNote}>{item.note}</p>
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
                      {relatedReels.length > 0 && (
                        <button
                          type="button"
                          className={`${styles.itemActionButton} ${styles.itemActionButtonPrimary}`}
                          onClick={() => setSelectedField(item.field)}
                        >
                          관련 릴스
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <ReelSidePanel field={selectedField} reels={getReelsByTag(selectedField)} />
        </section>

        <section className={styles.bottomGrid}>
          <div className={styles.panelCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>최근에 저장한 표현</h2>
            </div>
            <div className={styles.recentList}>
              {recentItems.map((item) => {
                const itemIndex = CAPTURED_ITEMS.findIndex((c) => c.id === item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.recentRow}
                    onClick={() => setFlashcardStart(itemIndex)}
                  >
                    <div className={styles.recentRowText}>
                      <span className={styles.recentRowWord}>{item.text}</span>
                      <span className={styles.recentRowMeta}>
                        {item.field} · {item.sourceTitle}
                      </span>
                    </div>
                    <span className={styles.recentRowTime}>{formatRelativeTime(item.capturedAt)}</span>
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
              {fieldStats.map((stat) => (
                <div key={stat.field} className={styles.fieldStatRow}>
                  <div className={styles.fieldStatTop}>
                    <span className={styles.fieldStatName}>{stat.field}</span>
                    <span className={styles.fieldStatCount}>
                      표현 {stat.count}개 · 드래그 {stat.totalDragCount}회
                    </span>
                  </div>
                  <div className={styles.fieldStatBarTrack}>
                    <div
                      className={styles.fieldStatBarFill}
                      style={{ width: `${(stat.totalDragCount / maxFieldDragCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {flashcardStart !== null && (
        <FlashcardModal
          items={CAPTURED_ITEMS}
          startIndex={flashcardStart}
          onClose={() => setFlashcardStart(null)}
        />
      )}
    </div>
  );
}
