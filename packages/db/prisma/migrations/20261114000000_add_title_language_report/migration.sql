-- CreateTable
CREATE TABLE "TitleLanguageReport" (
    "id" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "lang" TEXT NOT NULL,
    "providerSlug" TEXT NOT NULL,
    "heard" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TitleLanguageReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TitleLanguageReport_mediaType_tmdbId_lang_idx" ON "TitleLanguageReport"("mediaType", "tmdbId", "lang");
