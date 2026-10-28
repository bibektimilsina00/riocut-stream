-- 24/7 cricket channels (MS Networks HLS, ppv.st) + NetTV NPL while ESPN shows it live,
-- so cricket doesn't depend on Yono alone.
INSERT INTO "SportsProviderConfig" ("id", "kind", "name", "baseUrl", "isEnabled", "sortOrder", "createdAt", "updatedAt") VALUES
    ('spc_channels', 'channels', 'channels', 'https://live.msnetworks.net', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
