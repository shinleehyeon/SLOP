-- CreateEnum
CREATE TYPE "ShortGenerationStatus" AS ENUM ('GENERATING', 'COMPLETED', 'DISPATCH_FAILED', 'FAILED');

-- CreateTable
CREATE TABLE "short_generation_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedSiteUrl" TEXT NOT NULL,
    "content" TEXT,
    "links" TEXT[],
    "attachmentFileIds" TEXT[],
    "aiJobId" TEXT,
    "status" "ShortGenerationStatus" NOT NULL,
    "seriesId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "short_generation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "short_generation_requests_seriesId_key" ON "short_generation_requests"("seriesId");

-- CreateIndex
CREATE INDEX "short_generation_requests_userId_status_idx" ON "short_generation_requests"("userId", "status");

-- AddForeignKey
ALTER TABLE "short_generation_requests" ADD CONSTRAINT "short_generation_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_generation_requests" ADD CONSTRAINT "short_generation_requests_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "short_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
