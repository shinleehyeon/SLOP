"use client";

import { useState } from "react";
import { CURRENT_USER_ID, getReelsByTag, getUserById } from "@/lib/reels-data";
import { CAPTURED_ITEMS, formatRelativeTime, getMostDraggedItems, getRecentItems } from "@/lib/home-data";
import FlashcardModal from "./FlashcardModal";
import ReelSidePanel from "./ReelSidePanel";
import styles from "./home.module.css";

export default function HomePage() {
  const currentUser = getUserById(CURRENT_USER_ID)!;
  const topItems = getMostDraggedItems(4);
  const recentItems = getRecentItems(6);

  const [flashcardStart, setFlashcardStart] = useState<number | null>(null);
  const [selectedField, setSelectedField] = useState(topItems[0].field);

  const totalDragCount = CAPTURED_ITEMS.reduce((sum, item) => sum + item.dragCount, 0);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.pageGrid}>
          <div className={styles.mainCol}>
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
              <span className={styles.statValue}>{new Set(CAPTURED_ITEMS.map((i) => i.field)).size}</span>개
            </p>

            <section className={styles.section}>
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

              <div className={styles.itemGrid}>
                {topItems.map((item) => {
                  const relatedReels = getReelsByTag(item.field);
                  const itemIndex = CAPTURED_ITEMS.findIndex((c) => c.id === item.id);
                  const isSelected = selectedField === item.field;
                  return (
                    <div
                      key={item.id}
                      className={`${styles.itemCard} ${isSelected ? styles.itemCardSelected : ""}`}
                    >
                      <div className={styles.itemCardTop}>
                        <span className={styles.itemTag}>{item.field}</span>
                        <span className={styles.itemDragBadge}>{item.dragCount}회 드래그</span>
                      </div>
                      <p className={styles.itemText}>{item.text}</p>
                      <p className={styles.itemNote}>{item.note}</p>
                      <p className={styles.itemSource}>{item.sourceTitle}</p>

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
                            관련 릴스 보기
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>최근에 저장한 표현</h2>
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
            </section>
          </div>

          <ReelSidePanel field={selectedField} reels={getReelsByTag(selectedField)} />
        </div>
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
