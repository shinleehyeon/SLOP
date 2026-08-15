-- CreateEnum
CREATE TYPE "Tone" AS ENUM ('CASUAL', 'POLITE', 'NEWS');

-- CreateEnum
CREATE TYPE "DisplayFormat" AS ENUM ('SENTENCE', 'KEYWORD_LIST', 'QNA');

-- CreateEnum
CREATE TYPE "ShortsStyle" AS ENUM ('FUN', 'INFO');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "onboarding_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tone" "Tone" NOT NULL,
    "displayFormat" "DisplayFormat" NOT NULL,
    "shortsStyle" "ShortsStyle" NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fields" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_term_caches" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "tone" "Tone" NOT NULL,
    "terms" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "field_term_caches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_field_choices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_field_choices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_profiles_userId_key" ON "onboarding_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fields_name_key" ON "fields"("name");

-- CreateIndex
CREATE UNIQUE INDEX "field_term_caches_fieldId_tone_key" ON "field_term_caches"("fieldId", "tone");

-- CreateIndex
CREATE INDEX "user_field_choices_userId_idx" ON "user_field_choices"("userId");

-- CreateIndex
CREATE INDEX "user_field_choices_fieldId_idx" ON "user_field_choices"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "user_field_choices_userId_fieldId_key" ON "user_field_choices"("userId", "fieldId");

-- AddForeignKey
ALTER TABLE "onboarding_profiles" ADD CONSTRAINT "onboarding_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_term_caches" ADD CONSTRAINT "field_term_caches_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_field_choices" ADD CONSTRAINT "user_field_choices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_field_choices" ADD CONSTRAINT "user_field_choices_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
