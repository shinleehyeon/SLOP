"use client";

import { useState } from "react";
import styles from "./home.module.css";

export interface FlashcardItem {
  field: string;
  text: string;
  note: string;
  sourceTitle: string;
}

export default function FlashcardModal({
  items,
  startIndex,
  onClose,
}: {
  items: FlashcardItem[];
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

        <div className={styles.flashcardScene} key={index}>
          <button
            type="button"
            className={`${styles.flashcard} ${flipped ? styles.flashcardFlipped : ""}`}
            onClick={() => setFlipped((prev) => !prev)}
          >
            <div className={styles.flashcardFace}>
              <span className={styles.flashcardTag}>{item.field}</span>
              <p className={styles.flashcardText}>{item.text}</p>
              <span className={styles.flashcardHint}>탭해서 뜻 보기</span>
            </div>
            <div className={`${styles.flashcardFace} ${styles.flashcardFaceBack}`}>
              <p className={styles.flashcardNote}>{item.note}</p>
              <span className={styles.flashcardSource}>{item.sourceTitle}</span>
            </div>
          </button>
        </div>

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
