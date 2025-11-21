-- Create country_activity table for heatmap tracking
CREATE TABLE IF NOT EXISTS public.country_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  region TEXT,
  city TEXT,
  active_users INTEGER DEFAULT 0,
  total_xp BIGINT DEFAULT 0,
  recent_milestones JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_country_activity_code ON public.country_activity(country_code);
CREATE INDEX IF NOT EXISTS idx_country_activity_region ON public.country_activity(region);

-- Enable RLS
ALTER TABLE public.country_activity ENABLE ROW LEVEL SECURITY;

-- Everyone can view country activity (public heatmap data)
CREATE POLICY "Everyone can view country activity"
  ON public.country_activity
  FOR SELECT
  USING (true);

-- Only admins can manage activity data
CREATE POLICY "Admins can manage country activity"
  ON public.country_activity
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Auto-update timestamp trigger
CREATE TRIGGER update_country_activity_updated_at
  BEFORE UPDATE ON public.country_activity
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Update country_pricing to include minimum amounts
UPDATE public.country_pricing 
SET student_fee = 25000 
WHERE country_code = 'NG';

-- Add default activity data for Nigeria
INSERT INTO public.country_activity (country_code, country_name, region, active_users, total_xp)
VALUES 
  ('NG', 'Nigeria', 'Lagos', 0, 0),
  ('NG', 'Nigeria', 'Abuja', 0, 0),
  ('GH', 'Ghana', 'Accra', 0, 0),
  ('KE', 'Kenya', 'Nairobi', 0, 0),
  ('ZA', 'South Africa', 'Johannesburg', 0, 0),
  ('US', 'United States', 'New York', 0, 0),
  ('GB', 'United Kingdom', 'London', 0, 0)
ON CONFLICT DO NOTHING;