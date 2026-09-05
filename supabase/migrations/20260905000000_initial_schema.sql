-- Migration: initial schema, RLS, RPCs for Family Expense Manager
-- Author: finance_manager
-- Create date: 2026/09/05

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Roles enum as text check (OWNER | MEMBER)
-- profiles: sync from auth.users for email lookup without exposing auth schema to clients

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc', now())),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc', now()))
);

CREATE UNIQUE INDEX profiles_email_lower_idx ON public.profiles (lower(email));

CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc', now())),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc', now()))
);

CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(trim(display_name)) > 0),
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'MEMBER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc', now())),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc', now())),
  CONSTRAINT family_members_user_id_unique UNIQUE (user_id)
);

CREATE INDEX family_members_family_id_idx ON public.family_members (family_id);

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families (id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc', now())),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc', now())),
  CONSTRAINT categories_family_id_name_unique UNIQUE (family_id, name)
);

CREATE INDEX categories_family_id_idx ON public.categories (family_id);

CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families (id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members (id) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES public.categories (id) ON DELETE RESTRICT,
  amount BIGINT NOT NULL CHECK (amount > 0),
  description TEXT,
  expense_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc', now())),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc', now()))
);

CREATE INDEX expenses_family_id_expense_date_idx ON public.expenses (family_id, expense_date DESC);
CREATE INDEX expenses_family_id_category_id_idx ON public.expenses (family_id, category_id);
CREATE INDEX expenses_family_id_member_id_idx ON public.expenses (family_id, member_id);

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER families_set_updated_at
BEFORE UPDATE ON public.families
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER family_members_set_updated_at
BEFORE UPDATE ON public.family_members
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER categories_set_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER expenses_set_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sync profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Keep email in sync if auth email changes
CREATE OR REPLACE FUNCTION public.handle_user_email_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles
    SET email = NEW.email,
        updated_at = timezone('utc', now())
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_email_updated
AFTER UPDATE OF email ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_updated();

-- RLS helpers
CREATE OR REPLACE FUNCTION public.current_family_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id
  FROM public.family_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_family_member(p_family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE family_id = p_family_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_family_owner(p_family_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE user_id = auth.uid()
      AND role = 'OWNER'
      AND (p_family_id IS NULL OR family_id = p_family_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.current_member_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.family_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Default categories for a family
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_family_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.categories (family_id, name)
  VALUES
    (p_family_id, 'Ăn uống'),
    (p_family_id, 'Mua sắm'),
    (p_family_id, 'Điện nước'),
    (p_family_id, 'Nhà ở'),
    (p_family_id, 'Di chuyển'),
    (p_family_id, 'Y tế'),
    (p_family_id, 'Giáo dục'),
    (p_family_id, 'Giải trí'),
    (p_family_id, 'Khác')
  ON CONFLICT (family_id, name) DO NOTHING;
END;
$$;

-- Create family + owner membership + default categories
CREATE OR REPLACE FUNCTION public.create_family_with_defaults(
  p_name TEXT,
  p_display_name TEXT DEFAULT NULL
)
RETURNS public.families
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_family public.families;
  v_display_name TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM public.family_members WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'User already belongs to a family';
  END IF;

  IF p_name IS NULL OR char_length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Family name is required';
  END IF;

  SELECT COALESCE(
    NULLIF(trim(p_display_name), ''),
    NULLIF(trim(pr.display_name), ''),
    split_part(pr.email, '@', 1)
  )
  INTO v_display_name
  FROM public.profiles pr
  WHERE pr.id = v_user_id;

  INSERT INTO public.families (name)
  VALUES (trim(p_name))
  RETURNING * INTO v_family;

  INSERT INTO public.family_members (family_id, user_id, display_name, role)
  VALUES (v_family.id, v_user_id, v_display_name, 'OWNER');

  PERFORM public.seed_default_categories(v_family.id);

  RETURN v_family;
END;
$$;

-- Add existing registered user by email (OWNER only)
CREATE OR REPLACE FUNCTION public.add_family_member_by_email(
  p_email TEXT,
  p_display_name TEXT DEFAULT NULL
)
RETURNS public.family_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_family_id UUID;
  v_target public.profiles;
  v_member public.family_members;
  v_display TEXT;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT family_id
  INTO v_family_id
  FROM public.family_members
  WHERE user_id = v_caller
    AND role = 'OWNER';

  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'Only OWNER can add members';
  END IF;

  IF p_email IS NULL OR char_length(trim(p_email)) = 0 THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  SELECT *
  INTO v_target
  FROM public.profiles
  WHERE lower(email) = lower(trim(p_email));

  IF v_target.id IS NULL THEN
    RAISE EXCEPTION 'No registered user found with that email';
  END IF;

  IF v_target.id = v_caller THEN
    RAISE EXCEPTION 'Cannot add yourself';
  END IF;

  IF EXISTS (SELECT 1 FROM public.family_members WHERE user_id = v_target.id) THEN
    RAISE EXCEPTION 'User already belongs to a family';
  END IF;

  v_display := COALESCE(
    NULLIF(trim(p_display_name), ''),
    NULLIF(trim(v_target.display_name), ''),
    split_part(v_target.email, '@', 1)
  );

  INSERT INTO public.family_members (family_id, user_id, display_name, role)
  VALUES (v_family_id, v_target.id, v_display, 'MEMBER')
  RETURNING * INTO v_member;

  RETURN v_member;
END;
$$;

-- Remove member (OWNER only); cannot remove last OWNER / self if sole owner
CREATE OR REPLACE FUNCTION public.remove_family_member(p_member_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_family_id UUID;
  v_target public.family_members;
  v_owner_count INTEGER;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT family_id
  INTO v_family_id
  FROM public.family_members
  WHERE user_id = v_caller
    AND role = 'OWNER';

  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'Only OWNER can remove members';
  END IF;

  SELECT *
  INTO v_target
  FROM public.family_members
  WHERE id = p_member_id
    AND family_id = v_family_id;

  IF v_target.id IS NULL THEN
    RAISE EXCEPTION 'Member not found in your family';
  END IF;

  IF v_target.user_id = v_caller THEN
    RAISE EXCEPTION 'OWNER cannot remove themselves';
  END IF;

  IF v_target.role = 'OWNER' THEN
    SELECT count(*)
    INTO v_owner_count
    FROM public.family_members
    WHERE family_id = v_family_id
      AND role = 'OWNER';

    IF v_owner_count <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last OWNER';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM public.expenses WHERE member_id = p_member_id) THEN
    RAISE EXCEPTION 'Cannot remove member with existing expenses';
  END IF;

  DELETE FROM public.family_members
  WHERE id = p_member_id;
END;
$$;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- profiles: users can read/update only themselves (no public email search)
CREATE POLICY profiles_select_own
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY profiles_update_own
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- families
CREATE POLICY families_select_member
ON public.families
FOR SELECT
TO authenticated
USING (public.is_family_member(id));

CREATE POLICY families_update_owner
ON public.families
FOR UPDATE
TO authenticated
USING (public.is_family_owner(id))
WITH CHECK (public.is_family_owner(id));

-- No direct INSERT/DELETE on families from clients (use RPC)
-- family_members
CREATE POLICY family_members_select_same_family
ON public.family_members
FOR SELECT
TO authenticated
USING (public.is_family_member(family_id));

CREATE POLICY family_members_update_owner
ON public.family_members
FOR UPDATE
TO authenticated
USING (public.is_family_owner(family_id))
WITH CHECK (
  public.is_family_owner(family_id)
  AND role IN ('OWNER', 'MEMBER')
);

-- No direct INSERT/DELETE — use RPCs

-- categories
CREATE POLICY categories_select_member
ON public.categories
FOR SELECT
TO authenticated
USING (public.is_family_member(family_id));

CREATE POLICY categories_insert_owner
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (public.is_family_owner(family_id));

CREATE POLICY categories_update_owner
ON public.categories
FOR UPDATE
TO authenticated
USING (public.is_family_owner(family_id))
WITH CHECK (public.is_family_owner(family_id));

CREATE POLICY categories_delete_owner
ON public.categories
FOR DELETE
TO authenticated
USING (public.is_family_owner(family_id));

-- expenses
CREATE POLICY expenses_select_member
ON public.expenses
FOR SELECT
TO authenticated
USING (public.is_family_member(family_id));

CREATE POLICY expenses_insert_member
ON public.expenses
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_family_member(family_id)
  AND family_id = public.current_family_id()
  AND EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.id = member_id
      AND fm.family_id = family_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.categories c
    WHERE c.id = category_id
      AND c.family_id = family_id
  )
  AND amount > 0
);

CREATE POLICY expenses_update_member
ON public.expenses
FOR UPDATE
TO authenticated
USING (public.is_family_member(family_id))
WITH CHECK (
  public.is_family_member(family_id)
  AND family_id = public.current_family_id()
  AND EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.id = member_id
      AND fm.family_id = family_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.categories c
    WHERE c.id = category_id
      AND c.family_id = family_id
  )
  AND amount > 0
);

CREATE POLICY expenses_delete_member
ON public.expenses
FOR DELETE
TO authenticated
USING (public.is_family_member(family_id));

-- Grants for RPC execution
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.families TO authenticated;
GRANT SELECT, UPDATE ON public.family_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;

GRANT EXECUTE ON FUNCTION public.current_family_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_family_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_family_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_member_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_family_with_defaults(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_family_member_by_email(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_family_member(UUID) TO authenticated;
