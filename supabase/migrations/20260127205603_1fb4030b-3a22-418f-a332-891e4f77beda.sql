-- =====================================================
-- SISTEMA PREMIUM ESTILO TINDER: Super Likes, Boosts, Ver Likes
-- =====================================================

-- 1. Tabla para Super Likes
CREATE TABLE public.super_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    seen_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(sender_id, receiver_id, product_id)
);

-- 2. Tabla para Boosts de usuario (visibilidad temporal aumentada)
CREATE TABLE public.user_boosts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    boost_type TEXT NOT NULL DEFAULT 'standard',
    multiplier INTEGER NOT NULL DEFAULT 10,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabla para tracking de límites diarios/mensuales
CREATE TABLE public.premium_usage (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    usage_type TEXT NOT NULL, -- 'super_like', 'boost', 'rewind'
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    count INTEGER NOT NULL DEFAULT 0,
    UNIQUE(user_id, usage_type, usage_date)
);

-- 4. Actualizar tabla swipes para marcar super likes
ALTER TABLE public.swipes ADD COLUMN IF NOT EXISTS is_super_like BOOLEAN DEFAULT false;

-- 5. Actualizar premium_plans con nuevos campos
ALTER TABLE public.premium_plans 
ADD COLUMN IF NOT EXISTS super_likes_per_day INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS boosts_per_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rewinds_per_day INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS can_see_likes BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority_in_hot BOOLEAN DEFAULT false;

-- Actualizar planes existentes con los nuevos beneficios
UPDATE public.premium_plans SET 
    super_likes_per_day = 1,
    boosts_per_month = 0,
    rewinds_per_day = 1,
    can_see_likes = false,
    priority_in_hot = false
WHERE price = 0;

UPDATE public.premium_plans SET 
    super_likes_per_day = 5,
    boosts_per_month = 1,
    rewinds_per_day = 10,
    can_see_likes = true,
    priority_in_hot = true
WHERE price > 0 AND price < 30;

UPDATE public.premium_plans SET 
    super_likes_per_day = 15,
    boosts_per_month = 3,
    rewinds_per_day = 50,
    can_see_likes = true,
    priority_in_hot = true
WHERE price >= 30 AND price < 80;

UPDATE public.premium_plans SET 
    super_likes_per_day = 999,
    boosts_per_month = 5,
    rewinds_per_day = 999,
    can_see_likes = true,
    priority_in_hot = true
WHERE price >= 80;

-- 6. Enable RLS
ALTER TABLE public.super_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_usage ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for super_likes
CREATE POLICY "Users can send super likes"
ON public.super_likes FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view super likes they sent or received"
ON public.super_likes FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Receivers can mark super likes as seen"
ON public.super_likes FOR UPDATE
USING (auth.uid() = receiver_id);

-- 8. RLS Policies for user_boosts
CREATE POLICY "Users can create their own boosts"
ON public.user_boosts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own boosts"
ON public.user_boosts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Active boosts are viewable for discovery"
ON public.user_boosts FOR SELECT
USING (ends_at > now());

-- 9. RLS Policies for premium_usage
CREATE POLICY "Users can manage their own usage"
ON public.premium_usage FOR ALL
USING (auth.uid() = user_id);

-- 10. Crear vista para productos HOT (más likes + premium + boosted)
CREATE OR REPLACE VIEW public.hot_products AS
SELECT 
    p.*,
    COALESCE(like_counts.total_likes, 0) as like_count,
    COALESCE(pp.visibility_boost, 1) as premium_boost,
    CASE WHEN ub.id IS NOT NULL THEN ub.multiplier ELSE 1 END as active_boost,
    CASE WHEN fp.id IS NOT NULL THEN 1.5 ELSE 1 END as featured_multiplier,
    (
        COALESCE(like_counts.total_likes, 0) * 
        COALESCE(pp.visibility_boost, 1) * 
        CASE WHEN ub.id IS NOT NULL THEN ub.multiplier ELSE 1 END *
        CASE WHEN fp.id IS NOT NULL THEN 1.5 ELSE 1 END
    ) as hot_score
FROM public.products p
LEFT JOIN (
    SELECT product_id, COUNT(*) as total_likes 
    FROM public.swipes 
    WHERE action = 'like' 
    GROUP BY product_id
) like_counts ON like_counts.product_id = p.id
LEFT JOIN public.user_subscriptions us ON us.user_id = p.user_id AND us.status = 'active'
LEFT JOIN public.premium_plans pp ON pp.id = us.plan_id
LEFT JOIN public.user_boosts ub ON ub.user_id = p.user_id AND ub.ends_at > now()
LEFT JOIN public.featured_products fp ON fp.product_id = p.id AND (fp.featured_until IS NULL OR fp.featured_until > now())
WHERE p.status = 'active'
ORDER BY hot_score DESC;

-- 11. Índices para performance
CREATE INDEX IF NOT EXISTS idx_super_likes_receiver ON public.super_likes(receiver_id);
CREATE INDEX IF NOT EXISTS idx_super_likes_sender ON public.super_likes(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_boosts_active ON public.user_boosts(user_id, ends_at);
CREATE INDEX IF NOT EXISTS idx_premium_usage_user_date ON public.premium_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_swipes_super_like ON public.swipes(is_super_like) WHERE is_super_like = true;