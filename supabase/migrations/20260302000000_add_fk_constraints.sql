-- Migration: Add missing FK constraints for PostgREST joins
-- These FKs are required so PostgREST can resolve embedded selects
-- (e.g. "user_accounts → professional_profiles", "reservations → professional_profiles")

-- 0. Clean orphaned seed/test data that would violate FK constraints
DELETE FROM reservations
  WHERE professional_id IS NOT NULL
    AND professional_id NOT IN (SELECT user_id FROM professional_profiles WHERE user_id IS NOT NULL);

DELETE FROM professional_profiles
  WHERE user_id NOT IN (SELECT auth_uid FROM user_accounts);

-- 1. professional_profiles.user_id must be UNIQUE for 1:1 relationship
--    (one profile per user) - use IF NOT EXISTS pattern
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'professional_profiles_user_id_unique'
  ) THEN
    ALTER TABLE professional_profiles
      ADD CONSTRAINT professional_profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- 2. professional_profiles.user_id → user_accounts.auth_uid
--    Needed for: conversations query embedding professional_profiles inside user_accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'professional_profiles_user_id_fkey'
  ) THEN
    ALTER TABLE professional_profiles
      ADD CONSTRAINT professional_profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES user_accounts(auth_uid);
  END IF;
END $$;

-- 3. reservations.professional_id → professional_profiles.user_id
--    Needed for: reservation queries that use !reservations_to_pro_profile_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reservations_to_pro_profile_fkey'
  ) THEN
    ALTER TABLE reservations
      ADD CONSTRAINT reservations_to_pro_profile_fkey
      FOREIGN KEY (professional_id) REFERENCES professional_profiles(user_id);
  END IF;
END $$;
