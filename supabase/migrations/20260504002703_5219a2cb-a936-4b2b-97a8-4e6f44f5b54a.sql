
-- Pending-by-default for community submissions (existing approved rows untouched)
ALTER TABLE public.community_items ALTER COLUMN approved SET DEFAULT false;

-- Allow admins to view non-approved items
DROP POLICY IF EXISTS "Admins can view all community items" ON public.community_items;
CREATE POLICY "Admins can view all community items"
  ON public.community_items
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed the counter row
INSERT INTO public.platform_stats (id, value)
VALUES ('total_templates', (SELECT COUNT(*) FROM public.saved_templates))
ON CONFLICT (id) DO NOTHING;

-- Trigger to bump counter on new templates
DROP TRIGGER IF EXISTS bump_total_templates ON public.saved_templates;
CREATE TRIGGER bump_total_templates
  AFTER INSERT ON public.saved_templates
  FOR EACH ROW EXECUTE FUNCTION public.bump_template_counter();
