-- 1. Create role enum and user_roles table for admin system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Create gamification tables
CREATE TABLE public.user_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    level INTEGER NOT NULL DEFAULT 1,
    experience_points INTEGER NOT NULL DEFAULT 0,
    total_trades INTEGER NOT NULL DEFAULT 0,
    total_likes_given INTEGER NOT NULL DEFAULT 0,
    total_likes_received INTEGER NOT NULL DEFAULT 0,
    total_products_listed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    requirement_type TEXT NOT NULL,
    requirement_value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, badge_id)
);

-- Enable RLS on gamification tables
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_levels
CREATE POLICY "Users can view all levels"
ON public.user_levels FOR SELECT
USING (true);

CREATE POLICY "Users can update their own level"
ON public.user_levels FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own level"
ON public.user_levels FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for badges (public read)
CREATE POLICY "Badges are viewable by everyone"
ON public.badges FOR SELECT
USING (true);

CREATE POLICY "Admins can manage badges"
ON public.badges FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for user_badges
CREATE POLICY "User badges are viewable by everyone"
ON public.user_badges FOR SELECT
USING (true);

CREATE POLICY "System can award badges"
ON public.user_badges FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update RLS for verification_requests (allow admins to view and update all)
CREATE POLICY "Admins can view all verification requests"
ON public.verification_requests FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update verification requests"
ON public.verification_requests FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS for reports (allow admins to view and update all)
CREATE POLICY "Admins can view all reports"
ON public.reports FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default badges
INSERT INTO public.badges (name, description, icon, requirement_type, requirement_value) VALUES
('Novato', 'Completa tu primer trueke', 'trophy', 'trades', 1),
('Truekero', 'Completa 5 truekes', 'award', 'trades', 5),
('Experto', 'Completa 25 truekes', 'star', 'trades', 25),
('Maestro', 'Completa 100 truekes', 'crown', 'trades', 100),
('Social', 'Da 50 likes a productos', 'heart', 'likes_given', 50),
('Popular', 'Recibe 50 likes en tus productos', 'sparkles', 'likes_received', 50),
('Vendedor Activo', 'Publica 10 productos', 'package', 'products', 10),
('Verificado', 'Completa la verificación de identidad', 'shield-check', 'verified', 1);

-- Trigger to update user_levels timestamps
CREATE TRIGGER update_user_levels_updated_at
BEFORE UPDATE ON public.user_levels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();