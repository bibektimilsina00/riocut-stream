-- Yono TV: cricket schedule + streams (the only upstream carrying Nepal Premier League).
INSERT INTO "SportsProviderConfig" ("id", "kind", "name", "baseUrl", "isEnabled", "sortOrder", "createdAt", "updatedAt") VALUES
    ('spc_yono', 'yono', 'yono', 'https://yonotv-data.pages.dev', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
