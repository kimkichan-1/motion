-- Fix infinite recursion in profiles policies

-- Drop problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate without recursion (remove admin check for now)
-- Users can only view their own profile
-- Admin functionality can be added later with a different approach

-- The existing policies are fine:
-- "Users can view own profile" - already exists
-- "Users can update own profile" - already exists

-- Optional: If you need admin access, use service role key in backend instead of RLS
