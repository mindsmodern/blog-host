-- Blog Host Database Schema (Supabase-ready)

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- =====================================
-- Tables
-- =====================================

-- Themes
CREATE TABLE themes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  config      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by  UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Domains (third-level label only, e.g. "myblog")
CREATE TABLE domains (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name  CITEXT UNIQUE NOT NULL,
  owner_id     UUID NOT NULL REFERENCES auth.users(id),
  title        TEXT,
  description  TEXT,
  favicon_url  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- lower-case letters, digits, dash; 1-63; no leading/trailing dash
  CONSTRAINT domains_domain_name_format_chk
    CHECK (domain_name ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$')
);

-- Normalize domain_name to lowercase on write (defensive)
CREATE OR REPLACE FUNCTION normalize_domain_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.domain_name IS NOT NULL THEN
    NEW.domain_name := lower(NEW.domain_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_domains_normalize ON domains;
CREATE TRIGGER trg_domains_normalize
BEFORE INSERT OR UPDATE ON domains
FOR EACH ROW EXECUTE FUNCTION normalize_domain_name();

-- Posts
CREATE TABLE posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id        UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  theme_id         UUID REFERENCES themes(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  slug             CITEXT,  -- non-null => public
  meta_description TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique per domain when present
  CONSTRAINT unique_domain_slug
    UNIQUE (domain_id, slug) DEFERRABLE INITIALLY DEFERRED,

  -- slug allows '/' between path segments of [A-Za-z0-9-]
  CONSTRAINT posts_slug_format_chk
    CHECK (
      slug IS NULL
      OR slug ~ '^[A-Za-z0-9-]+(?:/[A-Za-z0-9-]+)*$'
    )
);

-- Post redirects
CREATE TABLE post_redirects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id  UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  old_slug   CITEXT NOT NULL,
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_domain_old_slug UNIQUE (domain_id, old_slug),
  CONSTRAINT redirects_old_slug_format_chk
    CHECK (old_slug ~ '^[A-Za-z0-9-]+(?:/[A-Za-z0-9-]+)*$')
);

-- Documents (content blocks)
CREATE TABLE documents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content    JSONB NOT NULL,
  tag        TEXT,   -- e.g., 'mobile', 'desktop', 'amp'
  width      INT2,   -- optional pixel width target
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT documents_nonneg_checks CHECK (width IS NULL OR width >= 0)
);

-- =====================================
-- Indexes
-- =====================================

CREATE INDEX idx_domains_owner_id ON domains(owner_id);
CREATE INDEX idx_posts_domain_id ON posts(domain_id);

CREATE INDEX idx_post_redirects_domain_old_slug ON post_redirects(domain_id, old_slug);

CREATE INDEX idx_documents_post_id ON documents(post_id);
CREATE INDEX idx_documents_post_tag_width ON documents(post_id, tag, width);
CREATE INDEX idx_documents_tag ON documents(tag) WHERE tag IS NOT NULL;
CREATE INDEX idx_documents_width ON documents(width) WHERE width IS NOT NULL;

-- Compact & fast containment index for JSONB
CREATE INDEX idx_documents_content_gin
  ON documents USING GIN (content jsonb_path_ops);

CREATE INDEX idx_themes_created_by ON themes(created_by);

-- =====================================
-- updated_at & parent touch triggers
-- =====================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_themes_updated_at
BEFORE UPDATE ON themes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domains_updated_at
BEFORE UPDATE ON domains
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Touch parent post when any document changes
CREATE OR REPLACE FUNCTION touch_post_on_document_change()
RETURNS TRIGGER AS $$
DECLARE
  v_post_id UUID;
BEGIN
  v_post_id := COALESCE(NEW.post_id, OLD.post_id);
  IF v_post_id IS NOT NULL THEN
    UPDATE posts SET updated_at = now() WHERE id = v_post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_documents_touch_post ON documents;
CREATE TRIGGER trg_documents_touch_post
AFTER INSERT OR UPDATE OR DELETE ON documents
FOR EACH ROW EXECUTE FUNCTION touch_post_on_document_change();

-- =====================================
-- Routing integrity
-- =====================================

-- 1) Prevent redirect old_slug from colliding with an existing post slug
CREATE OR REPLACE FUNCTION forbid_redirect_collision()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM posts p
    WHERE p.domain_id = NEW.domain_id
      AND p.slug IS NOT NULL
      AND p.slug = NEW.old_slug
  ) THEN
    RAISE EXCEPTION
      'Redirect "%" conflicts with an existing post slug in domain %',
      NEW.old_slug, NEW.domain_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_post_redirects_collision ON post_redirects;
CREATE TRIGGER trg_post_redirects_collision
BEFORE INSERT OR UPDATE ON post_redirects
FOR EACH ROW EXECUTE FUNCTION forbid_redirect_collision();

-- 2) Enforce same-domain redirect target
CREATE OR REPLACE FUNCTION ensure_redirect_same_domain()
RETURNS TRIGGER AS $$
DECLARE
  v_post_domain UUID;
BEGIN
  SELECT domain_id INTO v_post_domain FROM posts WHERE id = NEW.post_id;
  IF v_post_domain IS NULL OR v_post_domain <> NEW.domain_id THEN
    RAISE EXCEPTION 'Redirect domain must match target post domain';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_post_redirects_same_domain ON post_redirects;
CREATE TRIGGER trg_post_redirects_same_domain
BEFORE INSERT OR UPDATE ON post_redirects
FOR EACH ROW EXECUTE FUNCTION ensure_redirect_same_domain();

-- =====================================
-- Row Level Security (Supabase roles)
-- =====================================

ALTER TABLE themes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains        ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents      ENABLE ROW LEVEL SECURITY;

-- ---------- THEMES ----------
DROP POLICY IF EXISTS "themes_select_all" ON themes;
CREATE POLICY "themes_select_all"
  ON themes FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "themes_insert_own" ON themes;
CREATE POLICY "themes_insert_own"
  ON themes FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = created_by);

DROP POLICY IF EXISTS "themes_update_own" ON themes;
CREATE POLICY "themes_update_own"
  ON themes FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = created_by)
  WITH CHECK ((SELECT auth.uid()) = created_by);

DROP POLICY IF EXISTS "themes_delete_own" ON themes;
CREATE POLICY "themes_delete_own"
  ON themes FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = created_by);

-- ---------- DOMAINS ----------
DROP POLICY IF EXISTS "domains_select_own" ON domains;
CREATE POLICY "domains_select_own"
  ON domains FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = owner_id);

-- ---------- POSTS (owner CRUD) ----------
DROP POLICY IF EXISTS "posts_select_owner" ON posts;
CREATE POLICY "posts_select_owner"
  ON posts FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM domains d
    WHERE d.id = posts.domain_id AND d.owner_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "posts_insert_owner" ON posts;
CREATE POLICY "posts_insert_owner"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM domains d
    WHERE d.id = posts.domain_id AND d.owner_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "posts_update_owner" ON posts;
CREATE POLICY "posts_update_owner"
  ON posts FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM domains d
    WHERE d.id = posts.domain_id AND d.owner_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM domains d
    WHERE d.id = posts.domain_id AND d.owner_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "posts_delete_owner" ON posts;
CREATE POLICY "posts_delete_owner"
  ON posts FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM domains d
    WHERE d.id = posts.domain_id AND d.owner_id = (SELECT auth.uid())
  ));

-- ---------- POST REDIRECTS (owner CRUD) ----------
DROP POLICY IF EXISTS "redirects_select_owner" ON post_redirects;
CREATE POLICY "redirects_select_owner"
  ON post_redirects FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM domains d
    WHERE d.id = post_redirects.domain_id AND d.owner_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "redirects_insert_owner" ON post_redirects;
CREATE POLICY "redirects_insert_owner"
  ON post_redirects FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM domains d
    WHERE d.id = post_redirects.domain_id AND d.owner_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "redirects_update_owner" ON post_redirects;
CREATE POLICY "redirects_update_owner"
  ON post_redirects FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM domains d
    WHERE d.id = post_redirects.domain_id AND d.owner_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM domains d
    WHERE d.id = post_redirects.domain_id AND d.owner_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "redirects_delete_owner" ON post_redirects;
CREATE POLICY "redirects_delete_owner"
  ON post_redirects FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM domains d
    WHERE d.id = post_redirects.domain_id AND d.owner_id = (SELECT auth.uid())
  ));

-- ---------- DOCUMENTS (owner CRUD) ----------
DROP POLICY IF EXISTS "docs_select_owner" ON documents;
CREATE POLICY "docs_select_owner"
  ON documents FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM posts p JOIN domains d ON d.id = p.domain_id
    WHERE p.id = documents.post_id AND d.owner_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "docs_insert_owner" ON documents;
CREATE POLICY "docs_insert_owner"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1
    FROM posts p JOIN domains d ON d.id = p.domain_id
    WHERE p.id = documents.post_id AND d.owner_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "docs_update_owner" ON documents;
CREATE POLICY "docs_update_owner"
  ON documents FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM posts p JOIN domains d ON d.id = p.domain_id
    WHERE p.id = documents.post_id AND d.owner_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1
    FROM posts p JOIN domains d ON d.id = p.domain_id
    WHERE p.id = documents.post_id AND d.owner_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "docs_delete_owner" ON documents;
CREATE POLICY "docs_delete_owner"
  ON documents FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM posts p JOIN domains d ON d.id = p.domain_id
    WHERE p.id = documents.post_id AND d.owner_id = (SELECT auth.uid())
  ));

-- ---------- Public read (slugged content) ----------
DROP POLICY IF EXISTS "public_posts_with_slug" ON posts;
CREATE POLICY "public_posts_with_slug"
  ON posts FOR SELECT
  TO authenticated, anon
  USING (slug IS NOT NULL);

DROP POLICY IF EXISTS "public_docs_of_slugged_posts" ON documents;
CREATE POLICY "public_docs_of_slugged_posts"
  ON documents FOR SELECT
  TO authenticated, anon
  USING (EXISTS (
    SELECT 1 FROM posts p
    WHERE p.id = documents.post_id AND p.slug IS NOT NULL
  ));

DROP POLICY IF EXISTS "public_domains_with_slugged_posts" ON domains;
CREATE POLICY "public_domains_with_slugged_posts"
  ON domains FOR SELECT
  TO authenticated, anon
  USING (EXISTS (
    SELECT 1 FROM posts p
    WHERE p.domain_id = domains.id AND p.slug IS NOT NULL
  ));

DROP POLICY IF EXISTS "public_redirects_for_slugged_posts" ON post_redirects;
CREATE POLICY "public_redirects_for_slugged_posts"
  ON post_redirects FOR SELECT
  TO authenticated, anon
  USING (EXISTS (
    SELECT 1 FROM posts p
    WHERE p.id = post_redirects.post_id AND p.slug IS NOT NULL
  ));