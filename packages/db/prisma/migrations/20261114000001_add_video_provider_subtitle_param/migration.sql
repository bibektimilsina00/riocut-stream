-- AlterTable
ALTER TABLE "VideoProvider" ADD COLUMN "subtitleParam" TEXT;

-- VidSrc-family servers document ds_lang (ISO 639-1 default subtitle language)
UPDATE "VideoProvider" SET "subtitleParam" = 'ds_lang'
WHERE "slug" IN ('vidsrc-to', 'vidsrc-pm', 'vidsrc-embed', 'vidsrc-me', 'vidsrc-new');
