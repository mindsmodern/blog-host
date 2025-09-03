-- Make domains publicly readable to break circular RLS dependencies
-- This prevents infinite recursion between domains and posts policies

-- Drop the problematic policy that checks for slugged posts
DROP POLICY IF EXISTS "public_domains_with_slugged_posts" ON domains;

-- Create a simple public read policy for all domains
CREATE POLICY "domains_public_read" ON domains
FOR SELECT TO authenticated, anon
USING (true);

-- Keep the owner-only policy for other operations (insert, update, delete)
-- The existing "domains_select_own" policy is more restrictive, so we need to update it
-- to work alongside the public read policy
DROP POLICY IF EXISTS "domains_select_own" ON domains;

-- Owner policies for CUD operations (Create, Update, Delete)
CREATE POLICY "domains_owner_all" ON domains
FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());