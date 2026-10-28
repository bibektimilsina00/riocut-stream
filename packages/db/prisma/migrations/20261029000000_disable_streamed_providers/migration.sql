-- streamed.pk / streamed.st shut down (expired certs, closure page); every
-- match page paid their timeout. Re-enable from admin if a mirror revives.
UPDATE "SportsProviderConfig" SET "isEnabled" = false, "updatedAt" = CURRENT_TIMESTAMP WHERE "kind" = 'streamed';
