-- AlterTable
ALTER TABLE "short_generation_requests" ALTER COLUMN "requestedSiteUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "short_series" ALTER COLUMN "requestedSiteUrl" DROP NOT NULL;
