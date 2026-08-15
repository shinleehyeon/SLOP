-- CreateTable
CREATE TABLE "expressions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "sourceTitle" TEXT,
    "sourceUrl" TEXT,
    "fieldId" TEXT,
    "normalizedKey" TEXT NOT NULL,
    "dragCount" INTEGER NOT NULL DEFAULT 1,
    "firstDraggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastDraggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expressions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expression_drags" (
    "id" TEXT NOT NULL,
    "expressionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expression_drags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expressions_userId_lastDraggedAt_idx" ON "expressions"("userId", "lastDraggedAt");

-- CreateIndex
CREATE INDEX "expressions_userId_dragCount_idx" ON "expressions"("userId", "dragCount");

-- CreateIndex
CREATE INDEX "expressions_fieldId_idx" ON "expressions"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "expressions_userId_normalizedKey_key" ON "expressions"("userId", "normalizedKey");

-- CreateIndex
CREATE INDEX "expression_drags_userId_createdAt_idx" ON "expression_drags"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "expression_drags_expressionId_createdAt_idx" ON "expression_drags"("expressionId", "createdAt");

-- AddForeignKey
ALTER TABLE "expressions" ADD CONSTRAINT "expressions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expressions" ADD CONSTRAINT "expressions_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expression_drags" ADD CONSTRAINT "expression_drags_expressionId_fkey" FOREIGN KEY ("expressionId") REFERENCES "expressions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expression_drags" ADD CONSTRAINT "expression_drags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
