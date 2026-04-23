
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT,
  name TEXT NOT NULL,
  realm TEXT NOT NULL,
  slot TEXT NOT NULL,
  item_level INTEGER,
  bonus_level INTEGER,
  required_level INTEGER,
  quality INTEGER,
  level INTEGER,
  class_restriction TEXT,
  armor_type TEXT,
  armor_af INTEGER,
  weapon_type TEXT,
  weapon_damage_type TEXT,
  weapon_dps NUMERIC,
  weapon_speed NUMERIC,
  origin TEXT,
  source_type TEXT,
  online_url TEXT,
  effects JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_items_realm_slot ON public.items(realm, slot);
CREATE INDEX idx_items_class_restriction ON public.items(class_restriction);
CREATE INDEX idx_items_name_trgm ON public.items USING gin (name gin_trgm_ops);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Items are publicly readable"
ON public.items FOR SELECT USING (true);

CREATE TABLE public.saved_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  realm TEXT NOT NULL,
  class_name TEXT,
  slots JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are publicly readable"
ON public.saved_templates FOR SELECT USING (true);
CREATE POLICY "Anyone can create templates"
ON public.saved_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update templates"
ON public.saved_templates FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete templates"
ON public.saved_templates FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_saved_templates_updated_at
BEFORE UPDATE ON public.saved_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
