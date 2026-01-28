-- Corregir vista hot_products con security_invoker
DROP VIEW IF EXISTS public.hot_products;

CREATE VIEW public.hot_products
WITH (security_invoker=on) AS
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