import type { LearningHomeRelatedShort } from "@/lib/api";
import styles from "./home.module.css";

export default function ReelSidePanel({
  field,
  shorts,
}: {
  field: string;
  shorts: LearningHomeRelatedShort[];
}) {
  const primary =
    shorts.find((s) => s.tags.includes(field)) ?? shorts[0];

  return (
    <aside className={styles.sidePanel}>
      <p className={styles.sidePanelLabel}>{field} 관련 릴스</p>

      {!primary ? (
        <p className={styles.sidePanelEmpty}>관련 릴스가 없어요</p>
      ) : (
        <>
          <a
            href={primary.videoUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.sideReelSurface}
          >
            <div className={styles.sideReelPausedIcon} aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </a>

          <div className={styles.sideReelInfo}>
            <div className={styles.sideReelUserRow}>
              <span className={styles.sideReelUsername}>{primary.creatorName}</span>
            </div>
            <p className={styles.sideReelCaption}>{primary.title}</p>
          </div>
        </>
      )}
    </aside>
  );
}
