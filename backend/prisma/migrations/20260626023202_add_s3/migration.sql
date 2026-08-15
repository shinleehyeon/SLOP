/*
  Warnings:

  - A unique constraint covering the columns `[profileImageId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('PENDING', 'TEMPORARY', 'ATTACHED');

-- CreateEnum
CREATE TYPE "FilePurpose" AS ENUM ('PROFILE_IMAGE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profileImageId" TEXT;

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "status" "FileStatus" NOT NULL DEFAULT 'PENDING',
    "purpose" "FilePurpose" NOT NULL,
    "key" TEXT NOT NULL,
    "originalName" TEXT,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadTokenHash" TEXT,
    "ownerId" TEXT,
    "attachedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "files_key_key" ON "files"("key");

-- CreateIndex
CREATE INDEX "files_ownerId_idx" ON "files"("ownerId");

-- CreateIndex
CREATE INDEX "files_status_expiresAt_idx" ON "files"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_profileImageId_key" ON "users"("profileImageId");

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_profileImageId_fkey" FOREIGN KEY ("profileImageId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
