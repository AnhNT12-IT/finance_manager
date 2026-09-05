-- Seed data for local / staging development only.
-- Do NOT use real personal data.
--
-- This seed assumes auth users already exist (created via Auth or Supabase dashboard).
-- Prefer using the app Register flow + create_family_with_defaults in normal development.
--
-- Optional SQL-only seed for demos (replace UUIDs after creating users in Auth):

-- Example placeholders (replace before running):
-- OWNER_USER_ID  = '00000000-0000-0000-0000-000000000001'
-- MEMBER1_USER_ID = '00000000-0000-0000-0000-000000000002'
-- MEMBER2_USER_ID = '00000000-0000-0000-0000-000000000003'

/*
INSERT INTO public.profiles (id, email, display_name)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'owner@example.com', 'Owner'),
  ('00000000-0000-0000-0000-000000000002', 'member1@example.com', 'Member 1'),
  ('00000000-0000-0000-0000-000000000003', 'member2@example.com', 'Member 2')
ON CONFLICT (id) DO NOTHING;

-- After logging in as owner and calling create_family_with_defaults('My Family', 'Owner'),
-- add members via add_family_member_by_email, then insert sample expenses for current
-- and previous month using Asia/Ho_Chi_Minh calendar dates.
*/

-- Helper note for developers:
-- Sample expense amounts (VND BIGINT): 500000, 1200000, 2500000
-- Categories: seeded automatically on family create (Ăn uống, Mua sắm, ...)
