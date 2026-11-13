-- AlterTable
ALTER TABLE "VideoProvider" ADD COLUMN "languages" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Known language-specific servers
UPDATE "VideoProvider" SET "languages" = ARRAY['fr'] WHERE "slug" = 'frembed-icu';
UPDATE "VideoProvider" SET "languages" = ARRAY['id'] WHERE "slug" = 'nontongo';
