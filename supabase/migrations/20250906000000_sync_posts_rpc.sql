-- Migration: Add sync_posts RPC function for atomic post synchronization
-- Handles slug conflicts with deferred constraint support

CREATE OR REPLACE FUNCTION sync_posts(
  domain_name TEXT,
  updates JSONB,
  creates JSONB,
  deletes TEXT[]
) RETURNS JSONB AS $$
DECLARE
  domain_record RECORD;
  update_item JSONB;
  create_item JSONB;
  delete_id TEXT;
  conflict_slugs TEXT[] := '{}';
  result JSONB := '{"success": true, "conflicts": [], "errors": []}';
BEGIN
  -- Start transaction with deferred constraints
  SET CONSTRAINTS unique_domain_slug DEFERRED;
  
  -- Get domain ID and verify ownership
  SELECT d.id, d.owner_id 
  INTO domain_record
  FROM domains d 
  WHERE d.domain_name = sync_posts.domain_name;
  
  IF domain_record IS NULL THEN
    result := jsonb_set(result, '{success}', 'false');
    result := jsonb_set(result, '{errors}', result->'errors' || '["Domain not found"]');
    RETURN result;
  END IF;
  
  -- Verify user owns the domain (RLS should handle this, but double-check)
  IF NOT EXISTS (
    SELECT 1 FROM domains d 
    WHERE d.id = domain_record.id 
    AND d.owner_id = auth.uid()
  ) THEN
    result := jsonb_set(result, '{success}', 'false');
    result := jsonb_set(result, '{errors}', result->'errors' || '["Access denied"]');
    RETURN result;
  END IF;

  -- Process deletions first
  FOR delete_id IN SELECT unnest(deletes)
  LOOP
    DELETE FROM posts 
    WHERE id = delete_id::UUID 
    AND domain_id = domain_record.id;
  END LOOP;

  -- Process updates
  FOR update_item IN SELECT * FROM jsonb_array_elements(updates)
  LOOP
    DECLARE
      post_id UUID := (update_item->>'id')::UUID;
      new_slug TEXT := update_item->>'slug';
    BEGIN
      -- Check for slug conflicts before updating
      IF new_slug IS NOT NULL AND EXISTS (
        SELECT 1 FROM posts p 
        WHERE p.slug = new_slug 
        AND p.domain_id = domain_record.id 
        AND p.id != post_id
      ) THEN
        conflict_slugs := conflict_slugs || new_slug;
        CONTINUE;
      END IF;

      -- Perform update
      UPDATE posts SET
        title = COALESCE(update_item->>'title', title),
        slug = CASE 
          WHEN update_item ? 'slug' THEN (update_item->>'slug')
          ELSE slug 
        END,
        meta_description = CASE
          WHEN update_item ? 'meta_description' THEN (update_item->>'meta_description')
          ELSE meta_description
        END,
        theme_id = CASE
          WHEN update_item ? 'theme_id' THEN (update_item->>'theme_id')::UUID
          ELSE theme_id
        END,
        updated_at = NOW()
      WHERE id = post_id 
      AND domain_id = domain_record.id;

    EXCEPTION WHEN unique_violation THEN
      -- Handle unique constraint violations
      IF new_slug IS NOT NULL THEN
        conflict_slugs := conflict_slugs || new_slug;
      END IF;
    END;
  END LOOP;

  -- Process creates
  FOR create_item IN SELECT * FROM jsonb_array_elements(creates)
  LOOP
    DECLARE
      new_slug TEXT := create_item->>'slug';
    BEGIN
      -- Check for slug conflicts before creating
      IF new_slug IS NOT NULL AND EXISTS (
        SELECT 1 FROM posts p 
        WHERE p.slug = new_slug 
        AND p.domain_id = domain_record.id
      ) THEN
        conflict_slugs := conflict_slugs || new_slug;
        CONTINUE;
      END IF;

      -- Perform insert
      INSERT INTO posts (
        title,
        slug,
        meta_description,
        theme_id,
        domain_id,
        created_at,
        updated_at
      ) VALUES (
        create_item->>'title',
        CASE WHEN create_item->>'slug' = '' THEN NULL ELSE create_item->>'slug' END,
        CASE WHEN create_item->>'meta_description' = '' THEN NULL ELSE create_item->>'meta_description' END,
        CASE WHEN create_item->>'theme_id' = '' THEN NULL ELSE (create_item->>'theme_id')::UUID END,
        domain_record.id,
        NOW(),
        NOW()
      );

    EXCEPTION WHEN unique_violation THEN
      -- Handle unique constraint violations
      IF new_slug IS NOT NULL THEN
        conflict_slugs := conflict_slugs || new_slug;
      END IF;
    END;
  END LOOP;

  -- Set result
  IF array_length(conflict_slugs, 1) > 0 THEN
    result := jsonb_set(result, '{conflicts}', to_jsonb(conflict_slugs));
  END IF;

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  -- Handle any other errors
  result := jsonb_set(result, '{success}', 'false');
  result := jsonb_set(result, '{errors}', result->'errors' || jsonb_build_array(SQLERRM));
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;