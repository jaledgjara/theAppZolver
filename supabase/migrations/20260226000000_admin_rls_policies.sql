-- =============================================================
-- Migration: Admin RLS Policies
-- Date: 2026-02-26
--
-- Grants admin users (role = 'admin' in user_accounts) read and
-- write access to user_accounts and professional_profiles.
-- Uses the existing _has_role() helper from the base RLS migration.
-- =============================================================

-- Admin can read all user_accounts
CREATE POLICY "user_accounts_select_admin"
  ON user_accounts FOR SELECT
  USING (_has_role('admin'));

-- Admin can update any user_account (role changes, etc.)
-- WITH CHECK prevents an admin from demoting themselves
CREATE POLICY "user_accounts_update_admin"
  ON user_accounts FOR UPDATE
  USING (_has_role('admin'))
  WITH CHECK (auth_uid != _uid() OR role = 'admin');

-- Admin can read all professional_profiles
CREATE POLICY "professional_profiles_select_admin"
  ON professional_profiles FOR SELECT
  USING (_has_role('admin'));

-- Admin can update professional_profiles (approve/reject)
CREATE POLICY "professional_profiles_update_admin"
  ON professional_profiles FOR UPDATE
  USING (_has_role('admin'));
