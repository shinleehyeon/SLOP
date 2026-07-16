"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CURRENT_USER_ID,
  REELS,
  getReelsByUserId,
  getUserById,
  getUserByUsername,
  type Comment,
  type Reel,
} from "@/lib/reels-data";
import ReelCard from "./ReelCard";
import CommentsSheet from "./CommentsSheet";
import styles from "./reels.module.css";

interface FeedItem {
  instanceId: string;
  reel: Reel;
}

function buildLoop(baseReels: Reel[], cycle: number): FeedItem[] {
  return baseReels.map((reel) => ({
    instanceId: `${reel.id}-c${cycle}`,
    reel,
  }));
}

export default function ReelsPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string; start?: string }>;
}) {
  const params = use(searchParams);
  const filterUsername = params.user;
  const startReelId = params.start;

  const filteredUser = filterUsername ? getUserByUsername(filterUsername) : undefined;
  const baseReels = filteredUser ? getReelsByUserId(filteredUser.id) : REELS;

  const currentUser = getUserById(CURRENT_USER_ID)!;

  const [items, setItems] = useState<FeedItem[]>(() => [
    ...buildLoop(baseReels, 0),
    ...(filteredUser ? [] : buildLoop(baseReels, 1)),
  ]);
  const cycleRef = useRef(filteredUser ? 0 : 1);

  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [likeCountMap, setLikeCountMap] = useState<Record<string, number>>(() =>
    Object.fromEntries(REELS.map((r) => [r.id, r.likes])),
  );
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
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
  }, [startReelId]);

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
    if (filteredUser) return;
    cycleRef.current += 1;
    setItems((prev) => [...prev, ...buildLoop(baseReels, cycleRef.current)]);
  }, [baseReels, filteredUser]);

  useEffect(() => {
    if (filteredUser) return;
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
  }, [loadMore, filteredUser]);

  const toggleLike = (reelId: string) => {
    setLikedMap((prev) => {
      const nowLiked = !prev[reelId];
      setLikeCountMap((counts) => ({
        ...counts,
        [reelId]: (counts[reelId] ?? 0) + (nowLiked ? 1 : -1),
      }));
      return { ...prev, [reelId]: nowLiked };
    });
  };

  const addComment = (reelId: string, text: string) => {
    setCommentsMap((prev) => ({
      ...prev,
      [reelId]: [
        ...(prev[reelId] ?? []),
        {
          id: `c-${reelId}-${Date.now()}`,
          userId: CURRENT_USER_ID,
          text,
          createdAt: Date.now(),
        },
      ],
    }));
  };

  const openReelId = openCommentsFor;
  const openReelComments = useMemo(
    () => (openReelId ? commentsMap[openReelId] ?? [] : []),
    [openReelId, commentsMap],
  );

  return (
    <div className={styles.page}>
      <div className={styles.container} ref={containerRef}>
        {items.map((item) => {
          const user = getUserById(item.reel.userId)!;
          return (
            <div
              key={item.instanceId}
              data-reel-id={item.reel.id}
              className={styles.reelWrap}
            >
              <ReelCard
                reel={item.reel}
                user={user}
                liked={!!likedMap[item.reel.id]}
                likeCount={likeCountMap[item.reel.id] ?? item.reel.likes}
                commentCount={
                  item.reel.id in commentsMap
                    ? commentsMap[item.reel.id].length
                    : 0
                }
                onToggleLike={() => toggleLike(item.reel.id)}
                onOpenComments={() => setOpenCommentsFor(item.reel.id)}
              />
            </div>
          );
        })}
        {!filteredUser && <div ref={sentinelRef} className={styles.sentinel} />}
      </div>

      <CommentsSheet
        open={!!openReelId}
        onClose={() => setOpenCommentsFor(null)}
        comments={openReelComments}
        onSubmit={(text) => openReelId && addComment(openReelId, text)}
        currentUser={currentUser}
      />
    </div>
  );
}
