-- 1) Keep the function in public, but pin search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''  -- secure: only pg_catalog is implicit
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_post_on_document_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_post_id uuid;
BEGIN
  v_post_id := COALESCE(NEW.post_id, OLD.post_id);
  IF v_post_id IS NOT NULL THEN
    UPDATE public.posts SET updated_at = now() WHERE id = v_post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.forbid_redirect_collision()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.domain_id = NEW.domain_id
      AND p.slug IS NOT NULL
      AND p.slug = NEW.old_slug
  ) THEN
    RAISE EXCEPTION 'Redirect % conflicts with an existing post slug in domain %',
      NEW.old_slug, NEW.domain_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_redirect_same_domain()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_post_domain uuid;
BEGIN
  SELECT domain_id INTO v_post_domain FROM public.posts WHERE id = NEW.post_id;
  IF v_post_domain IS NULL OR v_post_domain <> NEW.domain_id THEN
    RAISE EXCEPTION 'Redirect domain must match target post domain';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_domain_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.domain_name IS NOT NULL THEN
    NEW.domain_name := lower(NEW.domain_name);
  END IF;
  RETURN NEW;
END;
$$;