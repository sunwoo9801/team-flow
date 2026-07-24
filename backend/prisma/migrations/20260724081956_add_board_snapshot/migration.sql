-- CreateTable
CREATE TABLE "board_snapshots" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "board_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "board_snapshots_boardId_createdAt_idx" ON "board_snapshots"("boardId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "board_snapshots" ADD CONSTRAINT "board_snapshots_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_snapshots" ADD CONSTRAINT "board_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
