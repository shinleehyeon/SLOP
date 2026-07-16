import { formatCount, getUserById, type Reel } from "@/lib/reels-data";
import styles from "./home.module.css";

export default function ReelSidePanel({
  field,
  reels,
}: {
  field: string;
  reels: Reel[];
}) {
  const [primary, ...rest] = reels;

  return (
    <aside className={styles.sidePanel}>
      <p className={styles.sidePanelLabel}>{field} 관련 릴스</p>

      {!primary ? (
        <p className={styles.sidePanelEmpty}>관련 릴스가 없어요</p>
      ) : (
        <>
          <div className={styles.sideReelSurface} style={{ background: primary.gradient }}>
            <div className={styles.sideReelPausedIcon} aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>

          <div className={styles.sideReelInfo}>
            <div className={styles.sideReelUserRow}>
              <span
                className={styles.sideReelAvatar}
                style={{ background: getUserById(primary.userId)?.avatarGradient }}
              />
              <span className={styles.sideReelUsername}>
                {getUserById(primary.userId)?.username}
              </span>
            </div>
            <p className={styles.sideReelCaption}>{primary.caption}</p>
            <span className={styles.sideReelStats}>
              좋아요 {formatCount(primary.likes)} · 공유 {formatCount(primary.shares)}
            </span>
          </div>

          {rest.length > 0 && (
            <div className={styles.sideReelMore}>
              {rest.map((reel) => (
                <span
                  key={reel.id}
                  className={styles.sideReelMoreThumb}
                  style={{ background: reel.gradient }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </aside>
  );
}
