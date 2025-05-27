/*
  # Add users table insert policy
  
  1. Security Changes
    - Add INSERT policy for users table to allow anonymous users to create their own user record
    - Policy ensures users can only insert their own ID
  
  Note: This is critical for the authentication flow where new users are created
*/

CREATE POLICY "Users can create their own user record"
ON users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);