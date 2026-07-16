"use client";

import { useState } from "react";
import type { CapturedItem } from "@/lib/home-data";
import styles from "./home.module.css";

export default function FlashcardModal({
  items,
  startIndex,
  onClose,
}: {
  items: CapturedItem[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [flipped, setFlipped] = useState(false);

  const item = items[index];
  const isFirst = index === 0;
  const isLast = index === items.length - 1;

  const goTo = (next: number) => {
    setFlipped(false);
    setIndex(next);
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalCount}>
            {index + 1} / {items.length}
          </span>
          <button
            type="button"
            className={styles.modalClose}
            onClick={onClose}
            aria-label="닫기"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="m18 6-12 12M6 6l12 12" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          className={`${styles.flashcard} ${flipped ? styles.flashcardFlipped : ""}`}
          onClick={() => setFlipped((prev) => !prev)}
        >
          {!flipped ? (
            <div className={styles.flashcardFace}>
              <span className={styles.flashcardTag}>{item.field}</span>
              <p className={styles.flashcardText}>{item.text}</p>
              <span className={styles.flashcardHint}>탭해서 뜻 보기</span>
            </div>
          ) : (
            <div className={styles.flashcardFace}>
              <p className={styles.flashcardNote}>{item.note}</p>
              <span className={styles.flashcardSource}>{item.sourceTitle}</span>
            </div>
          )}
        </button>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.modalNavButton}
            onClick={() => goTo(index - 1)}
            disabled={isFirst}
          >
            이전
          </button>
          <button
            type="button"
            className={`${styles.modalNavButton} ${styles.modalNavButtonPrimary}`}
            onClick={() => (isLast ? onClose() : goTo(index + 1))}
          >
            {isLast ? "완료" : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}
