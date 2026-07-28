-- CreateEnum
CREATE TYPE "CardPriority" AS ENUM ('none', 'low', 'medium', 'high', 'urgent');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CardActionType" ADD VALUE 'CARD_PRIORITY_CHANGED';
ALTER TYPE "CardActionType" ADD VALUE 'CHECKLIST_ITEM_ADDED';
ALTER TYPE "CardActionType" ADD VALUE 'CHECKLIST_ITEM_REMOVED';
ALTER TYPE "CardActionType" ADD VALUE 'CHECKLIST_ITEM_TOGGLED';
ALTER TYPE "CardActionType" ADD VALUE 'ASSIGNEE_ADDED';
ALTER TYPE "CardActionType" ADD VALUE 'ASSIGNEE_REMOVED';

-- DropForeignKey
ALTER TABLE "cards" DROP CONSTRAINT "cards_assigneeId_fkey";

-- DropIndex
DROP INDEX "cards_assigneeId_idx";

-- AlterTable
ALTER TABLE "cards" DROP COLUMN "assigneeId",
ADD COLUMN     "priority" "CardPriority" NOT NULL DEFAULT 'none';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarKey" TEXT;

-- CreateTable
CREATE TABLE "card_assignees" (
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_assignees_pkey" PRIMARY KEY ("cardId","userId")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "position" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "card_assignees_userId_idx" ON "card_assignees"("userId");

-- CreateIndex
CREATE INDEX "checklist_items_cardId_position_idx" ON "checklist_items"("cardId", "position");

-- AddForeignKey
ALTER TABLE "card_assignees" ADD CONSTRAINT "card_assignees_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_assignees" ADD CONSTRAINT "card_assignees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

