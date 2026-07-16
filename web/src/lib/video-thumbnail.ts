import type { SyntheticEvent } from "react";

// The first frame of a short is usually a blank/transition frame, so seek
// muted thumbnail previews 1s in before they're shown to give a more
// representative poster image.
const THUMBNAIL_SEEK_SECONDS = 1;

export function seekToThumbnailFrame(event: SyntheticEvent<HTMLVideoElement>) {
  const video = event.currentTarget;
  if (Number.isFinite(video.duration) && video.duration > 0) {
    video.currentTime = Math.min(THUMBNAIL_SEEK_SECONDS, video.duration);
  }
}
