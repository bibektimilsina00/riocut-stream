-- CreateTable
CREATE TABLE "VideoProviderReport" (
    "id" TEXT NOT NULL,
    "providerSlug" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoProviderReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoProviderReport_mediaType_tmdbId_createdAt_idx" ON "VideoProviderReport"("mediaType", "tmdbId", "createdAt");

-- CreateIndex
CREATE INDEX "VideoProviderReport_providerSlug_mediaType_createdAt_idx" ON "VideoProviderReport"("providerSlug", "mediaType", "createdAt");
