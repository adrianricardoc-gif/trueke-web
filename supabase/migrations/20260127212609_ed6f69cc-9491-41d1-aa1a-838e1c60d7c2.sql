-- Add feature enablement columns to premium_plans for per-plan feature control
ALTER TABLE public.premium_plans
ADD COLUMN IF NOT EXISTS enable_super_likes boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_boosts boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_rewinds boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_who_likes_me boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_hot_priority boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_missions boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_achievements boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_tournaments boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_auctions boolean DEFAULT true;

-- Insert default settings for free users
INSERT INTO public.admin_settings (key, value, description, is_secret)
VALUES 
  ('free_max_products', '5', 'Número máximo de productos para usuarios gratuitos', false),
  ('free_max_featured_products', '0', 'Número máximo de productos destacados para usuarios gratuitos', false),
  ('free_super_likes_per_day', '1', 'Super Likes por día para usuarios gratuitos', false),
  ('free_boosts_per_month', '0', 'Boosts por mes para usuarios gratuitos', false),
  ('free_rewinds_per_day', '1', 'Rewinds por día para usuarios gratuitos', false),
  ('free_can_see_likes', 'false', 'Usuarios gratuitos pueden ver quién les da like', false),
  ('free_can_participate_tournaments', 'true', 'Usuarios gratuitos pueden participar en torneos', false),
  ('free_can_participate_auctions', 'true', 'Usuarios gratuitos pueden participar en subastas', false)
ON CONFLICT (key) DO NOTHING;