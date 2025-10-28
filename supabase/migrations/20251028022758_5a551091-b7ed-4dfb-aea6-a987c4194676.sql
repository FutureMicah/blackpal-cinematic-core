-- Add INSERT policy to profiles table to prevent unauthorized profile creation
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);