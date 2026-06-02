-- CreateEnum
CREATE TYPE "CardActionType" AS ENUM ('CARD_CREATED', 'CARD_TITLE_UPDATED', 'CARD_DESCRIPTION_UPDATED', 'CARD_MOVED', 'CARD_ASSIGNEE_CHANGED', 'CARD_DUE_DATE_CHANGED', 'CARD_DELETED', 'COMMENT_ADDED', 'COMMENT_DELETED', 'ATTACHMENT_ADDED', 'ATTACHMENT_DELETED', 'LABEL_ADDED', 'LABEL_REMOVED');

-- CreateTable
CREATE TABLE "CardActivity" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" "CardActionType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CardActivity_cardId_createdAt_idx" ON "CardActivity"("cardId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "CardActivity" ADD CONSTRAINT "CardActivity_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardActivity" ADD CONSTRAINT "CardActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
