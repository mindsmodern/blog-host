-- Create media storage bucket for blog post media files
-- This bucket will store images and videos used in blog posts

-- Create the media bucket (public for read access)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true);

-- Create a helper function to check domain ownership without RLS conflicts
CREATE OR REPLACE FUNCTION public.user_owns_domain(domain_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM domains 
    WHERE id = domain_uuid 
    AND owner_id = auth.uid()
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.user_owns_domain(UUID) TO authenticated;

-- RLS Policy: Allow authenticated users to upload to media bucket
-- We'll validate domain ownership in the application layer to avoid RLS recursion
CREATE POLICY "Authenticated users can upload media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media');

-- RLS Policy: Allow public read access to all media files
-- This enables serving media files to blog readers
CREATE POLICY "Public can read media" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

-- RLS Policy: Users can manage their own media files
-- Use path-based ownership (e.g., media/{user_id}/filename)
CREATE POLICY "Users can manage their own media" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);