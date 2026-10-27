-- Migration script to convert mediaCast from text[] to jsonb
-- This will preserve existing cast names and convert them to the new format
-- First, let's see what we have (uncomment to inspect)
-- SELECT id, title, "mediaCast" FROM "BlogPost" WHERE "mediaCast" IS NOT NULL LIMIT 5;
-- Convert text[] to jsonb with proper structure
-- Each name becomes {"name": "ActorName", "character": null, "profile_path": null}
ALTER TABLE "BlogPost"
ALTER COLUMN "mediaCast" TYPE jsonb USING CASE
    WHEN "mediaCast" IS NULL THEN NULL
    ELSE (
        SELECT
            jsonb_agg (
                jsonb_build_object (
                    'name',
                    elem,
                    'character',
                    null,
                    'profile_path',
                    null
                )
            )
        FROM
            unnest ("mediaCast") AS elem
    )
END;

-- Verify the migration (uncomment to check results)
-- SELECT id, title, "mediaCast" FROM "BlogPost" WHERE "mediaCast" IS NOT NULL LIMIT 5;