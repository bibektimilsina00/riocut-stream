-- CreateTable
CREATE TABLE "LiveViewer" (
    "matchKey" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "cid" TEXT NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveViewer_pkey" PRIMARY KEY ("matchKey","cid")
);

-- CreateIndex
CREATE INDEX "LiveViewer_matchKey_lastSeen_idx" ON "LiveViewer"("matchKey", "lastSeen");
