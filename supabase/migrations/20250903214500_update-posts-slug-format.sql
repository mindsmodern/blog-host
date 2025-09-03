-- Update posts slug format to allow slugs starting with '/'
-- This changes the constraint from requiring alphanumeric start to allowing leading slash

-- Drop the existing constraint
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_slug_format_chk;

-- Add new constraint that allows slugs to start with '/'
ALTER TABLE posts ADD CONSTRAINT posts_slug_format_chk
    CHECK (
        slug IS NULL
        OR slug ~ '^/?[A-Za-z0-9-]+(?:/[A-Za-z0-9-]+)*$'
    );

-- Update post_redirects constraint to match
ALTER TABLE post_redirects DROP CONSTRAINT IF EXISTS redirects_old_slug_format_chk;

ALTER TABLE post_redirects ADD CONSTRAINT redirects_old_slug_format_chk
    CHECK (old_slug ~ '^/?[A-Za-z0-9-]+(?:/[A-Za-z0-9-]+)*$');