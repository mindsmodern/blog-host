-- Allow root slug '/' in posts table
-- Update the slug format constraint to accept just '/' as a valid slug

-- Drop the existing constraint
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_slug_format_chk;

-- Add new constraint that allows '/' by itself or the existing pattern
ALTER TABLE posts ADD CONSTRAINT posts_slug_format_chk
    CHECK (
        slug IS NULL
        OR slug = '/'
        OR slug ~ '^/?[A-Za-z0-9-]+(?:/[A-Za-z0-9-]+)*$'
    );

-- Update post_redirects constraint to match
ALTER TABLE post_redirects DROP CONSTRAINT IF EXISTS redirects_old_slug_format_chk;

ALTER TABLE post_redirects ADD CONSTRAINT redirects_old_slug_format_chk
    CHECK (
        old_slug = '/'
        OR old_slug ~ '^/?[A-Za-z0-9-]+(?:/[A-Za-z0-9-]+)*$'
    );