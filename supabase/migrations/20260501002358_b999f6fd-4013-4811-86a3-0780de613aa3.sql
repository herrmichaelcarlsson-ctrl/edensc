-- ============================================
-- Eden Template Forge — Platform Expansion
-- ============================================

-- ===== USER ROLES (admin gate for formula config) =====
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "User roles are viewable by everyone"
  ON public.user_roles FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== PROFILES =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT TO public USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== PUBLIC TEMPLATES (extends saved_templates with publishing) =====
ALTER TABLE public.saved_templates
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS author_name TEXT,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS vote_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spellcraft JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS gear_score INTEGER,
  ADD COLUMN IF NOT EXISTS utility NUMERIC;

CREATE INDEX IF NOT EXISTS idx_saved_templates_public_votes
  ON public.saved_templates(is_public, vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_saved_templates_public_recent
  ON public.saved_templates(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_templates_share_code
  ON public.saved_templates(share_code) WHERE share_code IS NOT NULL;

-- Template votes (anonymous via voter_key, like feature_request_votes)
CREATE TABLE public.template_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.saved_templates(id) ON DELETE CASCADE,
  voter_key TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_id, voter_key)
);

ALTER TABLE public.template_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Template votes are publicly readable"
  ON public.template_votes FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can vote on templates"
  ON public.template_votes FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can withdraw their vote"
  ON public.template_votes FOR DELETE TO public USING (true);

-- Sync vote count
CREATE OR REPLACE FUNCTION public.sync_template_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.saved_templates
       SET vote_count = vote_count + 1, updated_at = now()
     WHERE id = NEW.template_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.saved_templates
       SET vote_count = GREATEST(vote_count - 1, 0), updated_at = now()
     WHERE id = OLD.template_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER sync_template_vote_count
  AFTER INSERT OR DELETE ON public.template_votes
  FOR EACH ROW EXECUTE FUNCTION public.sync_template_vote_count();

-- Existing saved_templates policies are public-write. Tighten so only public templates show in browse,
-- but keep existing CRUD permissive for backward compatibility (legacy local saves).
-- (Browse query will filter is_public=true client-side.)

-- ===== COMMUNITY ITEM SUBMISSIONS =====
-- Items contributed by users that aren't in the canonical `items` table.
CREATE TABLE public.community_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitter_name TEXT,
  name TEXT NOT NULL,
  realm TEXT NOT NULL,
  slot TEXT NOT NULL,
  class_restriction TEXT,
  level INTEGER DEFAULT 51,
  quality INTEGER DEFAULT 100,
  armor_type TEXT,
  weapon_type TEXT,
  source_type TEXT DEFAULT 'COMMUNITY',
  origin TEXT,
  effects JSONB NOT NULL DEFAULT '[]'::jsonb,
  charges JSONB DEFAULT '[]'::jsonb,
  procs JSONB DEFAULT '[]'::jsonb,
  utility NUMERIC,
  gear_score INTEGER,
  notes TEXT,
  upvote_count INTEGER NOT NULL DEFAULT 0,
  approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_items_realm_slot ON public.community_items(realm, slot);
CREATE INDEX idx_community_items_name ON public.community_items USING gin (name gin_trgm_ops);

ALTER TABLE public.community_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved community items are publicly readable"
  ON public.community_items FOR SELECT TO public USING (approved = true);

CREATE POLICY "Anyone can submit community items"
  ON public.community_items FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Owners and admins can update community items"
  ON public.community_items FOR UPDATE TO authenticated
  USING (auth.uid() = submitted_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete community items"
  ON public.community_items FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER community_items_updated_at
  BEFORE UPDATE ON public.community_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== FORMULA CONFIG (admin-tunable weights) =====
CREATE TABLE public.formula_config (
  id TEXT PRIMARY KEY,           -- e.g. 'utility', 'toa_score', 'risk_table'
  label TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL,         -- arbitrary shape per formula
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.formula_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Formula config is publicly readable"
  ON public.formula_config FOR SELECT TO public USING (true);

CREATE POLICY "Admins can upsert formula config"
  ON public.formula_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER formula_config_updated_at
  BEFORE UPDATE ON public.formula_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default formula config
INSERT INTO public.formula_config (id, label, description, config) VALUES
  ('utility', 'Utility weights',
   'Per-bonus-type multipliers for the DAoC utility score.',
   '{"stat":0.6667,"hits":0.25,"power":0.25,"resist":2,"skill":5}'),
  ('toa_score', 'ToA bonus weights',
   'Multipliers for ToA bonuses contributing to GearScore.',
   '{"melee_speed":8,"casting_speed":8,"melee_damage":7,"style_damage":7,"spell_damage":7,"resist_pierce":8,"spell_duration":2,"healing_bonus":2,"buff_bonus":2,"debuff_bonus":2,"power_pool":1.5,"af":0.25,"archery_speed":7,"fatigue":1}'),
  ('charge_score', 'Charge / proc / use weights',
   'GearScore bonus per charge/proc/use type.',
   '{"charge":15,"use":10,"proc":12,"reactive":12}'),
  ('waste_penalty', 'Waste penalty weights',
   'Penalty multipliers per overcap/dead-stat point.',
   '{"overcap_stat":0.5,"overcap_resist":1,"dead_stat":0.3,"useless_skill":1}'),
  ('risk_table', 'Overcharge risk table',
   'Fail % per overcharge point at 100% quality and max skill.',
   '[{"oc":0.0,"pct":0},{"oc":0.5,"pct":1},{"oc":1.0,"pct":2},{"oc":1.5,"pct":4},{"oc":2.0,"pct":7},{"oc":2.5,"pct":12},{"oc":3.0,"pct":20},{"oc":3.5,"pct":32},{"oc":4.0,"pct":50},{"oc":4.5,"pct":75},{"oc":5.0,"pct":99}]'),
  ('risk_modifiers', 'Risk modifiers',
   'Quality and skill multipliers applied to base risk.',
   '{"quality_100":1.0,"quality_99":1.15,"skill_max":1.0,"skill_low":1.5}');

-- ===== STATS COUNTER (total templates made) =====
CREATE TABLE public.platform_stats (
  id TEXT PRIMARY KEY,
  value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stats are publicly readable"
  ON public.platform_stats FOR SELECT TO public USING (true);

CREATE POLICY "Admins can update stats"
  ON public.platform_stats FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.platform_stats (id, value) VALUES ('total_templates', 0);

-- Auto-bump total templates on every saved_templates insert
CREATE OR REPLACE FUNCTION public.bump_template_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.platform_stats
     SET value = value + 1, updated_at = now()
   WHERE id = 'total_templates';
  RETURN NEW;
END;
$$;

CREATE TRIGGER bump_template_counter
  AFTER INSERT ON public.saved_templates
  FOR EACH ROW EXECUTE FUNCTION public.bump_template_counter();
