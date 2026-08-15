-- CreateTable
CREATE TABLE "short_likes" (
    "id" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "short_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "short_comments" (
    "id" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "short_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "short_likes_userId_idx" ON "short_likes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "short_likes_shortId_userId_key" ON "short_likes"("shortId", "userId");

-- CreateIndex
CREATE INDEX "short_comments_shortId_createdAt_idx" ON "short_comments"("shortId", "createdAt");

-- CreateIndex
CREATE INDEX "short_comments_userId_idx" ON "short_comments"("userId");

-- AddForeignKey
ALTER TABLE "short_likes" ADD CONSTRAINT "short_likes_shortId_fkey" FOREIGN KEY ("shortId") REFERENCES "shorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_likes" ADD CONSTRAINT "short_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_comments" ADD CONSTRAINT "short_comments_shortId_fkey" FOREIGN KEY ("shortId") REFERENCES "shorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_comments" ADD CONSTRAINT "short_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
