"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createShortComment,
  deleteShortComment,
  fetchShortComments,
  fetchShortGenerations,
  fetchShortSeries,
  toggleShortLike,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import ReelCard, { type FeedReel } from "./ReelCard";
import CommentsSheet, { type UIComment } from "./CommentsSheet";
import styles from "./reels.module.css";

interface FeedItem {
  instanceId: string;
  reel: FeedReel;
}

function buildLoop(baseReels: FeedReel[], cycle: number): FeedItem[] {
  return baseReels.map((reel) => ({
    instanceId: `${reel.id}-c${cycle}`,
    reel,
  }));
}

export default function ReelsPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string; start?: string; seriesId?: string }>;
}) {
  const params = use(searchParams);
  const startReelId = params.start;
  const exploreSeriesId = params.seriesId;

  const [baseReels, setBaseReels] = useState<FeedReel[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setLoadError("로그인이 필요합니다.");
      return;
    }

    // Coming from 둘러보기/검색: load just the tapped series instead of the
    // signed-in user's own generation history.
    if (exploreSeriesId) {
      fetchShortSeries(exploreSeriesId, accessToken)
        .then((series) => {
          setBaseReels(
            series.shorts.map((short) => ({
              id: short.id,
              title: short.title,
              tags: short.tags,
              videoUrl: short.videoFileUrl,
              creatorName: series.title,
            })),
          );
        })
        .catch(() => setLoadError("숏폼을 불러오지 못했습니다."));
      return;
    }

    fetchShortGenerations(accessToken)
      .then(async (generations) => {
        const seriesIds = [
          ...new Set(
            generations
              .filter((g) => g.status === "COMPLETED" && g.seriesId)
              .map((g) => g.seriesId as string),
          ),
        ];

        const seriesList = await Promise.all(
          seriesIds.map((id) => fetchShortSeries(id, accessToken).catch(() => null)),
        );

        const reels: FeedReel[] = seriesList
          .filter((s) => s !== null)
          .flatMap((series) =>
            series!.shorts.map((short) => ({
              id: short.id,
              title: short.title,
              tags: short.tags,
              videoUrl: short.videoFileUrl,
              creatorName: series!.title,
            })),
          );

        setBaseReels(reels);
      })
      .catch(() => setLoadError("숏폼을 불러오지 못했습니다."));
  }, [exploreSeriesId]);

  const [items, setItems] = useState<FeedItem[]>([]);
  const cycleRef = useRef(1);

  useEffect(() => {
    if (!baseReels) return;
    if (baseReels.length === 0) {
      setItems([]);
      return;
    }
    cycleRef.current = 1;
    setItems([...buildLoop(baseReels, 0), ...buildLoop(baseReels, 1)]);
  }, [baseReels]);

  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [likeCountMap, setLikeCountMap] = useState<Record<string, number>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, UIComment[]>>({});
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    if (!startReelId || !containerRef.current) return;
    const el = containerRef.current.querySelector(
      `[data-reel-id="${startReelId}"]`,
    );
    el?.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
    const index = Array.from(containerRef.current.children).indexOf(
      el as Element,
    );
    if (index >= 0) currentIndexRef.current = index;
  }, [startReelId, items]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // A single trackpad/mouse-wheel swipe fires many "wheel" events in a
    // burst (plus momentum/inertia tail after the fingers lift). We only
    // want that whole burst to move exactly one reel, so: take the first
    // event as the trigger, then stay locked until the events go quiet for
    // a bit (not just for a fixed timeout, since inertia can outlast one).
    const MIN_LOCK_MS = 350;
    const QUIET_WINDOW_MS = 140;

    let locked = false;
    let stepStartedAt = 0;
    let quietTimer: number | undefined;

    const scrollToIndex = (index: number) => {
      const clamped = Math.max(
        0,
        Math.min(index, itemsRef.current.length - 1),
      );
      // Disable native scroll-snap while we drive the scroll ourselves,
      // otherwise the browser's snap fights the smooth scroll and it
      // slips/overshoots mid-animation.
      container.style.scrollSnapType = "none";
      container.scrollTo({ top: clamped * container.clientHeight, behavior: "smooth" });
      currentIndexRef.current = clamped;
    };

    const unlock = () => {
      locked = false;
      container.style.scrollSnapType = "y mandatory";
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) < 4) return;

      if (!locked) {
        locked = true;
        stepStartedAt = performance.now();
        scrollToIndex(currentIndexRef.current + (e.deltaY > 0 ? 1 : -1));
      }

      // Any further event (including inertia) pushes the unlock back out
      // until the gesture has actually gone quiet.
      window.clearTimeout(quietTimer);
      quietTimer = window.setTimeout(() => {
        const elapsed = performance.now() - stepStartedAt;
        const remaining = Math.max(0, MIN_LOCK_MS - elapsed);
        window.setTimeout(unlock, remaining);
      }, QUIET_WINDOW_MS);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      window.clearTimeout(quietTimer);
    };
  }, []);

  const loadMore = useCallback(() => {
    if (!baseReels || baseReels.length === 0) return;
    cycleRef.current += 1;
    setItems((prev) => [...prev, ...buildLoop(baseReels, cycleRef.current)]);
  }, [baseReels]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root: containerRef.current, rootMargin: "200% 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const toggleLike = (reelId: string) => {
    setLikedMap((prev) => {
      const nowLiked = !prev[reelId];
      setLikeCountMap((counts) => ({
        ...counts,
        [reelId]: (counts[reelId] ?? 0) + (nowLiked ? 1 : -1),
      }));
      return { ...prev, [reelId]: nowLiked };
    });

    const accessToken = getAccessToken();
    if (!accessToken) return;
    toggleShortLike(reelId, accessToken)
      .then((result) => {
        setLikedMap((prev) => ({ ...prev, [reelId]: result.liked }));
        setLikeCountMap((counts) => ({ ...counts, [reelId]: result.likeCount }));
      })
      .catch(() => {
        // Best-effort; keep the optimistic local toggle as-is.
      });
  };

  useEffect(() => {
    if (!openCommentsFor) return;
    const accessToken = getAccessToken();
    if (!accessToken) return;
    fetchShortComments(openCommentsFor, accessToken)
      .then((page) => {
        setCommentsMap((prev) => ({
          ...prev,
          [openCommentsFor]: page.items.map((c) => ({
            id: c.id,
            text: c.content,
            createdAt: new Date(c.createdAt).getTime(),
            authorName: c.author.name,
            authorAvatarUrl: c.author.profileImageUrl,
            canDelete: false,
          })),
        }));
      })
      .catch(() => {
        // Keep whatever local comments already exist for this reel.
      });
  }, [openCommentsFor]);

  const addComment = (reelId: string, text: string) => {
    const optimistic: UIComment = {
      id: `local-${reelId}-${Date.now()}`,
      text,
      createdAt: Date.now(),
      authorName: "나",
      authorAvatarUrl: null,
      canDelete: true,
    };
    setCommentsMap((prev) => ({
      ...prev,
      [reelId]: [...(prev[reelId] ?? []), optimistic],
    }));

    const accessToken = getAccessToken();
    if (!accessToken) return;
    createShortComment(reelId, text, accessToken)
      .then((created) => {
        setCommentsMap((prev) => ({
          ...prev,
          [reelId]: (prev[reelId] ?? []).map((c) =>
            c.id === optimistic.id
              ? {
                  id: created.id,
                  text: created.content,
                  createdAt: new Date(created.createdAt).getTime(),
                  authorName: created.author.name,
                  authorAvatarUrl: created.author.profileImageUrl,
                  canDelete: true,
                }
              : c,
          ),
        }));
      })
      .catch(() => {
        // Keep the optimistic local comment as-is.
      });
  };

  const deleteComment = (reelId: string, commentId: string) => {
    setCommentsMap((prev) => ({
      ...prev,
      [reelId]: (prev[reelId] ?? []).filter((c) => c.id !== commentId),
    }));

    const accessToken = getAccessToken();
    if (!accessToken || commentId.startsWith("local-")) return;
    deleteShortComment(reelId, commentId, accessToken).catch(() => {
      // Best-effort; comment already removed locally.
    });
  };

  const openReelId = openCommentsFor;
  const openReelComments = useMemo(
    () => (openReelId ? commentsMap[openReelId] ?? [] : []),
    [openReelId, commentsMap],
  );

  return (
    <div className={styles.page}>
      {loadError && (
        <div className={styles.reel}>
          <p className={styles.infoCaption}>{loadError}</p>
        </div>
      )}

      {!loadError && baseReels?.length === 0 && (
        <div className={styles.reel}>
          <p className={styles.infoCaption}>아직 생성된 숏폼이 없어요</p>
        </div>
      )}

      {!loadError && baseReels && baseReels.length > 0 && (
        <div className={styles.container} ref={containerRef}>
          {items.map((item) => (
            <div
              key={item.instanceId}
              data-reel-id={item.reel.id}
              className={styles.reelWrap}
            >
              <ReelCard
                reel={item.reel}
                liked={!!likedMap[item.reel.id]}
                likeCount={likeCountMap[item.reel.id] ?? 0}
                commentCount={
                  item.reel.id in commentsMap ? commentsMap[item.reel.id].length : 0
                }
                onToggleLike={() => toggleLike(item.reel.id)}
                onOpenComments={() => setOpenCommentsFor(item.reel.id)}
              />
            </div>
          ))}
          <div ref={sentinelRef} className={styles.sentinel} />
        </div>
      )}

      <CommentsSheet
        open={!!openReelId}
        onClose={() => setOpenCommentsFor(null)}
        comments={openReelComments}
        onSubmit={(text) => openReelId && addComment(openReelId, text)}
        onDelete={(commentId) => openReelId && deleteComment(openReelId, commentId)}
        currentUserAvatarGradient="linear-gradient(135deg, #70eaff, #4de0fa)"
      />
    </div>
  );
}
