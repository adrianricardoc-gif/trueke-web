
-- Add new feature flags for all new features
INSERT INTO public.feature_flags (feature_key, feature_name, description, is_enabled, category) VALUES
('public_wishlist', 'Wishlist Pública', 'Lista de deseos visible para que otros ofrezcan productos', true, 'social'),
('daily_missions', 'Misiones Diarias', 'Sistema de misiones con recompensas en TrueKoins', true, 'gamification'),
('weekly_missions', 'Misiones Semanales', 'Misiones semanales con mayores recompensas', true, 'gamification'),
('personal_dashboard', 'Dashboard Personal', 'Estadísticas de actividad y valor intercambiado', true, 'analytics'),
('smart_matching', 'Smart Matching IA', 'Sugerencias de matches basadas en historial y preferencias', true, 'ai'),
('trukoin_escrow', 'Escrow TrueKoins', 'Retención de valor hasta confirmar recepción', true, 'trading'),
('video_verification', 'Verificación por Video', 'Videollamada para verificar estado del producto', true, 'security'),
('extended_warranty', 'Garantías Extendidas', 'Protección extendida para productos de alto valor', true, 'security'),
('ownership_history', 'Historial de Propiedad', 'Tracking de productos intercambiados', true, 'trading'),
('demand_prediction', 'Predicción de Demanda', 'IA predice qué productos serán populares', true, 'ai'),
('market_analytics', 'Análisis de Mercado', 'Tendencias de precios por categoría y ciudad', true, 'analytics'),
('exportable_reports', 'Reportes Exportables', 'PDF/Excel para empresas', true, 'analytics'),
('trueke_tournaments', 'Torneos de Trueke', 'Competencias mensuales con premios', true, 'gamification'),
('streak_system', 'Sistema de Racha', 'Bonificación por actividad consecutiva', true, 'gamification'),
('unlockable_achievements', 'Logros Desbloqueables', 'Achievements con recompensas exclusivas', true, 'gamification'),
('live_streaming', 'Live Streaming', 'Mostrar productos en vivo', true, 'social'),
('photo_reviews', 'Reseñas con Fotos', 'Adjuntar imágenes post-trueke', true, 'social'),
('smart_notifications', 'Notificaciones Inteligentes', 'Alertas personalizadas por IA', true, 'notifications'),
('scheduled_trades', 'Truekes Programados', 'Agendar intercambios futuros', true, 'trading'),
('partial_trades', 'Truekes Parciales', 'Intercambiar parte + TrueKoins', true, 'trading'),
('auto_republish', 'Auto-Republicar', 'Renovar productos automáticamente', true, 'automation')
ON CONFLICT (feature_key) DO NOTHING;

-- Wishlist table for public wishlists
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    min_value NUMERIC DEFAULT 0,
    max_value NUMERIC,
    is_public BOOLEAN DEFAULT true,
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    fulfilled_by_product_id UUID REFERENCES public.products(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public wishlists are viewable by everyone" ON public.wishlists
FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage their own wishlists" ON public.wishlists
FOR ALL USING (auth.uid() = user_id);

-- Missions table for daily/weekly missions
CREATE TABLE IF NOT EXISTS public.missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    mission_type TEXT NOT NULL DEFAULT 'daily', -- daily, weekly, special
    action_type TEXT NOT NULL, -- swipe, like, trade, review, list_product, etc.
    target_count INTEGER NOT NULL DEFAULT 1,
    reward_trukoins INTEGER NOT NULL DEFAULT 10,
    reward_xp INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Missions are viewable by everyone" ON public.missions
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage missions" ON public.missions
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User mission progress
CREATE TABLE IF NOT EXISTS public.user_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE,
    current_progress INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    reward_claimed_at TIMESTAMP WITH TIME ZONE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own missions" ON public.user_missions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own missions" ON public.user_missions
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert missions" ON public.user_missions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User activity stats for dashboard
CREATE TABLE IF NOT EXISTS public.user_activity_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    total_swipes INTEGER DEFAULT 0,
    total_likes_given INTEGER DEFAULT 0,
    total_likes_received INTEGER DEFAULT 0,
    total_trades_initiated INTEGER DEFAULT 0,
    total_trades_completed INTEGER DEFAULT 0,
    total_value_traded NUMERIC DEFAULT 0,
    total_products_listed INTEGER DEFAULT 0,
    total_messages_sent INTEGER DEFAULT 0,
    avg_response_time_minutes INTEGER,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_activity_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats" ON public.user_activity_stats
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON public.user_activity_stats
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON public.user_activity_stats
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- TrueKoin escrow for secure trades
CREATE TABLE IF NOT EXISTS public.trukoin_escrow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id),
    payer_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'held', -- held, released, refunded, disputed
    released_at TIMESTAMP WITH TIME ZONE,
    dispute_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.trukoin_escrow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their escrows" ON public.trukoin_escrow
FOR SELECT USING (auth.uid() = payer_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create escrows" ON public.trukoin_escrow
FOR INSERT WITH CHECK (auth.uid() = payer_id);

CREATE POLICY "Participants can update escrow" ON public.trukoin_escrow
FOR UPDATE USING (auth.uid() = payer_id OR auth.uid() = receiver_id);

-- Video verification sessions
CREATE TABLE IF NOT EXISTS public.video_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id),
    requester_id UUID NOT NULL,
    verifier_id UUID NOT NULL,
    product_id UUID REFERENCES public.products(id),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    verification_result TEXT, -- verified, issues_found, cancelled
    notes TEXT,
    status TEXT DEFAULT 'pending', -- pending, scheduled, in_progress, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.video_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their verifications" ON public.video_verifications
FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = verifier_id);

CREATE POLICY "Users can create verification requests" ON public.video_verifications
FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Participants can update verifications" ON public.video_verifications
FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = verifier_id);

-- Product ownership history
CREATE TABLE IF NOT EXISTS public.product_ownership_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    acquired_via TEXT, -- created, trade, purchase
    acquired_from_user_id UUID,
    match_id UUID REFERENCES public.matches(id),
    owned_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
    owned_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.product_ownership_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ownership history is viewable by everyone" ON public.product_ownership_history
FOR SELECT USING (true);

CREATE POLICY "System can insert ownership" ON public.product_ownership_history
FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Achievements/Logros system
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL,
    category TEXT DEFAULT 'general', -- trading, social, collector, streak
    requirement_type TEXT NOT NULL, -- trades_completed, trukoins_earned, streak_days, etc.
    requirement_value INTEGER NOT NULL,
    reward_trukoins INTEGER DEFAULT 0,
    reward_badge_id UUID REFERENCES public.badges(id),
    is_secret BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active achievements are viewable" ON public.achievements
FOR SELECT USING (is_active = true AND is_secret = false);

CREATE POLICY "Admins can manage achievements" ON public.achievements
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    progress INTEGER DEFAULT 0,
    UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User achievements are viewable by everyone" ON public.user_achievements
FOR SELECT USING (true);

CREATE POLICY "System can manage user achievements" ON public.user_achievements
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tournaments
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    tournament_type TEXT DEFAULT 'monthly', -- weekly, monthly, special
    category TEXT, -- specific category or null for all
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    prize_trukoins INTEGER DEFAULT 0,
    prize_description TEXT,
    min_participants INTEGER DEFAULT 10,
    max_participants INTEGER,
    status TEXT DEFAULT 'upcoming', -- upcoming, active, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournaments are viewable by everyone" ON public.tournaments
FOR SELECT USING (true);

CREATE POLICY "Admins can manage tournaments" ON public.tournaments
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Tournament participants
CREATE TABLE IF NOT EXISTS public.tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    score INTEGER DEFAULT 0,
    trades_count INTEGER DEFAULT 0,
    rank_position INTEGER,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(tournament_id, user_id)
);

ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants are viewable by everyone" ON public.tournament_participants
FOR SELECT USING (true);

CREATE POLICY "Users can join tournaments" ON public.tournament_participants
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update participants" ON public.tournament_participants
FOR UPDATE USING (auth.uid() = user_id);

-- User streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    streak_multiplier NUMERIC DEFAULT 1.0,
    total_streak_bonus_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their streaks" ON public.user_streaks
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their streaks" ON public.user_streaks
FOR ALL USING (auth.uid() = user_id);

-- Review photos
CREATE TABLE IF NOT EXISTS public.review_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Review photos are viewable by everyone" ON public.review_photos
FOR SELECT USING (true);

CREATE POLICY "Users can add photos to their reviews" ON public.review_photos
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.reviews 
        WHERE id = review_photos.review_id 
        AND reviewer_id = auth.uid()
    )
);

-- Scheduled trades
CREATE TABLE IF NOT EXISTS public.scheduled_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id),
    proposed_by UUID NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    meeting_point_id UUID REFERENCES public.safe_meeting_points(id),
    reminder_sent BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.scheduled_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their scheduled trades" ON public.scheduled_trades
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.matches m 
        WHERE m.id = scheduled_trades.match_id 
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
);

CREATE POLICY "Users can create scheduled trades" ON public.scheduled_trades
FOR INSERT WITH CHECK (auth.uid() = proposed_by);

CREATE POLICY "Participants can update scheduled trades" ON public.scheduled_trades
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.matches m 
        WHERE m.id = scheduled_trades.match_id 
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
);

-- Partial trades (product + trukoins)
CREATE TABLE IF NOT EXISTS public.partial_trade_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id),
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    product_id UUID REFERENCES public.products(id),
    trukoin_amount INTEGER NOT NULL DEFAULT 0,
    percentage_product NUMERIC DEFAULT 100, -- percentage of value covered by product
    message TEXT,
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected, countered
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.partial_trade_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their partial offers" ON public.partial_trade_offers
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create partial offers" ON public.partial_trade_offers
FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Participants can update partial offers" ON public.partial_trade_offers
FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Auto republish settings
CREATE TABLE IF NOT EXISTS public.auto_republish_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    republish_interval_days INTEGER DEFAULT 7,
    max_republishes INTEGER DEFAULT 4,
    current_republish_count INTEGER DEFAULT 0,
    last_republished_at TIMESTAMP WITH TIME ZONE,
    next_republish_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.auto_republish_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their auto republish settings" ON public.auto_republish_settings
FOR ALL USING (auth.uid() = user_id);

-- Market analytics data
CREATE TABLE IF NOT EXISTS public.market_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    city TEXT,
    avg_price NUMERIC,
    min_price NUMERIC,
    max_price NUMERIC,
    total_listings INTEGER DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    demand_score NUMERIC DEFAULT 0, -- 0-100
    trend TEXT DEFAULT 'stable', -- rising, falling, stable
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.market_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Market analytics are viewable by everyone" ON public.market_analytics
FOR SELECT USING (true);

CREATE POLICY "Admins can manage market analytics" ON public.market_analytics
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Smart notifications preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    wishlist_matches BOOLEAN DEFAULT true,
    price_drops BOOLEAN DEFAULT true,
    new_in_categories BOOLEAN DEFAULT true,
    streak_reminders BOOLEAN DEFAULT true,
    mission_reminders BOOLEAN DEFAULT true,
    tournament_updates BOOLEAN DEFAULT true,
    trade_reminders BOOLEAN DEFAULT true,
    weekly_digest BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their notification preferences" ON public.notification_preferences
FOR ALL USING (auth.uid() = user_id);

-- Insert default missions
INSERT INTO public.missions (title, description, mission_type, action_type, target_count, reward_trukoins, reward_xp) VALUES
('Explorador Diario', 'Desliza 10 productos hoy', 'daily', 'swipe', 10, 5, 10),
('Corazón Generoso', 'Dale like a 5 productos', 'daily', 'like', 5, 10, 15),
('Conversador', 'Envía 3 mensajes', 'daily', 'message', 3, 5, 10),
('Truekero Activo', 'Completa 1 trueke', 'daily', 'trade', 1, 50, 100),
('Publicador', 'Publica 1 producto nuevo', 'daily', 'list_product', 1, 20, 30),
('Crítico Constructivo', 'Deja 1 reseña', 'daily', 'review', 1, 15, 25),
('Explorador Semanal', 'Desliza 50 productos esta semana', 'weekly', 'swipe', 50, 30, 50),
('Comerciante Semanal', 'Completa 3 truekes esta semana', 'weekly', 'trade', 3, 150, 300),
('Coleccionista', 'Publica 5 productos esta semana', 'weekly', 'list_product', 5, 100, 150),
('Influencer', 'Recibe 10 likes en tus productos', 'weekly', 'likes_received', 10, 75, 100);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value, reward_trukoins) VALUES
('Primer Trueke', 'Completa tu primer intercambio', '🎉', 'trading', 'trades_completed', 1, 50),
('Truekero Novato', 'Completa 5 truekes', '🌟', 'trading', 'trades_completed', 5, 100),
('Truekero Experto', 'Completa 25 truekes', '💫', 'trading', 'trades_completed', 25, 250),
('Truekero Maestro', 'Completa 100 truekes', '👑', 'trading', 'trades_completed', 100, 1000),
('Racha de 7 días', 'Mantén actividad por 7 días seguidos', '🔥', 'streak', 'streak_days', 7, 75),
('Racha de 30 días', 'Mantén actividad por 30 días seguidos', '⚡', 'streak', 'streak_days', 30, 300),
('Coleccionista', 'Publica 10 productos', '📦', 'collector', 'products_listed', 10, 100),
('Mega Coleccionista', 'Publica 50 productos', '🏪', 'collector', 'products_listed', 50, 500),
('Popular', 'Recibe 50 likes en total', '❤️', 'social', 'likes_received', 50, 150),
('Celebridad', 'Recibe 500 likes en total', '🌟', 'social', 'likes_received', 500, 750),
('Millonario TrueKoin', 'Acumula 1000 TrueKoins', '💰', 'general', 'trukoins_earned', 1000, 0),
('Crítico Top', 'Deja 20 reseñas', '📝', 'social', 'reviews_given', 20, 200),
('5 Estrellas', 'Mantén rating promedio de 5', '⭐', 'trading', 'perfect_rating', 10, 300);
