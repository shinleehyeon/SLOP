-- CreateTable
CREATE TABLE "short_series" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "style" "ShortsStyle" NOT NULL,
    "requestedSiteUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "short_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shorts" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "tags" TEXT[],
    "videoFileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shorts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "short_series_userId_idx" ON "short_series"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "shorts_videoFileId_key" ON "shorts"("videoFileId");

-- CreateIndex
CREATE INDEX "shorts_seriesId_idx" ON "shorts"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "shorts_seriesId_episodeNumber_key" ON "shorts"("seriesId", "episodeNumber");

-- AddForeignKey
ALTER TABLE "short_series" ADD CONSTRAINT "short_series_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shorts" ADD CONSTRAINT "shorts_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "short_series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shorts" ADD CONSTRAINT "shorts_videoFileId_fkey" FOREIGN KEY ("videoFileId") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
