
-- Feature flags table for enabling/disabling features
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text UNIQUE NOT NULL,
  feature_name text NOT NULL,
  description text,
  is_enabled boolean DEFAULT false,
  category text DEFAULT 'general',
  requires_api_key text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Feature flags are viewable by everyone" ON public.feature_flags
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage feature flags" ON public.feature_flags
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert all feature flags
INSERT INTO public.feature_flags (feature_key, feature_name, description, category, is_enabled, requires_api_key) VALUES
  -- Core features (already implemented)
  ('stripe_payments', 'Pagos Stripe', 'Procesar pagos reales de planes premium con suscripciones recurrentes', 'monetization', false, 'STRIPE_SECRET_KEY'),
  ('referral_system', 'Sistema de Referidos', 'Ganar créditos/descuentos por invitar amigos', 'social', true, NULL),
  ('ai_product_assistant', 'Asistente IA Productos', 'Ayudar a describir productos y sugerir precios', 'ai', false, NULL),
  ('trukoins_currency', 'Moneda TrueKoins', 'Acumular puntos por actividad y canjear por beneficios', 'gamification', true, NULL),
  ('ai_verification', 'Verificación IA Productos', 'Detectar fraudes o productos falsificados con análisis de fotos', 'ai', false, NULL),
  ('auction_mode', 'Modo Subasta', 'Múltiples usuarios ofertando por un producto con tiempo límite', 'trading', true, NULL),
  ('circular_trading', 'Trueke Circular', 'Intercambios en cadena entre 3+ usuarios', 'trading', true, NULL),
  
  -- UX features
  ('ai_chat_translator', 'Chat con Traductor IA', 'Traducción automática en conversaciones', 'ai', false, NULL),
  ('auto_dark_mode', 'Modo Oscuro Automático', 'Cambio según hora del día', 'ux', false, NULL),
  ('interactive_tutorials', 'Tutoriales Interactivos', 'Onboarding gamificado para nuevos usuarios', 'ux', false, NULL),
  ('product_comparator', 'Comparador de Productos', 'Ver 2-3 productos lado a lado antes de ofertar', 'ux', false, NULL),
  
  -- Social features
  ('follow_users', 'Seguir Usuarios', 'Feed personalizado de productos de usuarios favoritos', 'social', false, NULL),
  ('trueke_stories', 'Trueke Stories', 'Historias temporales de productos destacados (24h)', 'social', false, NULL),
  ('thematic_groups', 'Grupos Temáticos', 'Comunidades por categoría', 'social', false, NULL),
  ('public_ranking', 'Ranking Público', 'Leaderboard de mejores truekeros del mes', 'gamification', false, NULL),
  
  -- Monetization features
  ('visibility_boost', 'Boost de Visibilidad', 'Pagar TrueKoins para destacar producto 24h', 'monetization', false, NULL),
  ('authenticity_certification', 'Certificación de Autenticidad', 'Servicio premium para verificar productos de marca', 'monetization', false, NULL),
  ('trueke_insurance', 'Seguro de Trueke', 'Protección contra fraudes en intercambios de alto valor', 'monetization', false, NULL),
  
  -- Logistics features
  ('shipping_integration', 'Integración Envíos', 'Calcular costos de Servientrega/Correos del Ecuador', 'logistics', false, NULL),
  ('safe_meeting_points', 'Puntos de Encuentro Seguros', 'Mapa de lugares verificados para intercambios', 'logistics', false, NULL),
  ('availability_calendar', 'Calendario Disponibilidad', 'Agendar citas para hacer el trueke', 'logistics', false, NULL),
  
  -- Technical features
  ('barcode_scanner', 'Escaneo Código de Barras', 'Auto-completar info del producto escaneando', 'technical', false, NULL),
  ('offline_mode', 'Modo Offline', 'Navegar productos guardados sin conexión', 'technical', false, NULL),
  ('whatsapp_notifications', 'Notificaciones WhatsApp', 'Enviar matches y mensajes al celular', 'notifications', false, 'WHATSAPP_API_KEY');

-- Tables for new features

-- Follow users system
CREATE TABLE public.user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view follows" ON public.user_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON public.user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON public.user_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Trueke Stories
CREATE TABLE public.trueke_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text DEFAULT 'image',
  caption text,
  expires_at timestamp with time zone NOT NULL,
  views_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.trueke_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active stories are viewable by everyone" ON public.trueke_stories
  FOR SELECT USING (expires_at > now());

CREATE POLICY "Users can create their own stories" ON public.trueke_stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" ON public.trueke_stories
  FOR DELETE USING (auth.uid() = user_id);

-- Thematic groups
CREATE TABLE public.thematic_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  image_url text,
  creator_id uuid NOT NULL,
  is_public boolean DEFAULT true,
  member_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.thematic_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text DEFAULT 'member',
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.thematic_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public groups are viewable by everyone" ON public.thematic_groups
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create groups" ON public.thematic_groups
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their groups" ON public.thematic_groups
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Group members viewable by everyone" ON public.group_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join groups" ON public.group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" ON public.group_members
  FOR DELETE USING (auth.uid() = user_id);

-- Visibility boosts
CREATE TABLE public.product_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  trukoins_spent integer NOT NULL,
  boost_type text DEFAULT 'standard',
  starts_at timestamp with time zone DEFAULT now(),
  ends_at timestamp with time zone NOT NULL,
  impressions integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.product_boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active boosts are viewable" ON public.product_boosts
  FOR SELECT USING (ends_at > now());

CREATE POLICY "Users can boost their products" ON public.product_boosts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Safe meeting points
CREATE TABLE public.safe_meeting_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  place_type text DEFAULT 'public',
  is_verified boolean DEFAULT false,
  rating numeric DEFAULT 0,
  reviews_count integer DEFAULT 0,
  operating_hours jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.safe_meeting_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Meeting points are viewable by everyone" ON public.safe_meeting_points
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage meeting points" ON public.safe_meeting_points
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Meeting appointments
CREATE TABLE public.meeting_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE,
  meeting_point_id uuid REFERENCES public.safe_meeting_points(id),
  proposed_by uuid NOT NULL,
  proposed_date timestamp with time zone NOT NULL,
  status text DEFAULT 'pending',
  confirmed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.meeting_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their appointments" ON public.meeting_appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches m 
      WHERE m.id = match_id 
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can create appointments" ON public.meeting_appointments
  FOR INSERT WITH CHECK (auth.uid() = proposed_by);

CREATE POLICY "Users can update their appointments" ON public.meeting_appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM matches m 
      WHERE m.id = match_id 
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- Trueke insurance
CREATE TABLE public.trueke_insurance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  coverage_amount numeric NOT NULL,
  premium_paid numeric NOT NULL,
  status text DEFAULT 'active',
  claim_status text,
  claim_reason text,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.trueke_insurance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their insurance" ON public.trueke_insurance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can purchase insurance" ON public.trueke_insurance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Monthly rankings
CREATE TABLE public.monthly_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  trades_count integer DEFAULT 0,
  trukoins_earned integer DEFAULT 0,
  rating_avg numeric DEFAULT 0,
  rank_position integer,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, month, year)
);

ALTER TABLE public.monthly_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rankings are viewable by everyone" ON public.monthly_rankings
  FOR SELECT USING (true);

-- Trigger for updated_at on feature_flags
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
