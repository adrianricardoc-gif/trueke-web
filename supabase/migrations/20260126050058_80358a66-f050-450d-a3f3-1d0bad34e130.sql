-- Create premium_plans table for admin-configurable plans
CREATE TABLE public.premium_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  target_user_type TEXT NOT NULL DEFAULT 'all', -- 'person', 'company', or 'all'
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  visibility_boost INTEGER NOT NULL DEFAULT 1,
  max_products INTEGER,
  max_featured_products INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_subscriptions table to track active subscriptions
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.premium_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_id)
);

-- Create company_analytics table for storing periodic metrics
CREATE TABLE public.company_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  inquiries_count INTEGER NOT NULL DEFAULT 0,
  conversions_count INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  response_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.premium_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for premium_plans
CREATE POLICY "Plans are viewable by everyone" 
ON public.premium_plans FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage plans" 
ON public.premium_plans FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.user_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" 
ON public.user_subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
ON public.user_subscriptions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" 
ON public.user_subscriptions FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for company_analytics
CREATE POLICY "Users can view their own analytics" 
ON public.company_analytics FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert analytics" 
ON public.company_analytics FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics" 
ON public.company_analytics FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_company_analytics_user_id ON public.company_analytics(user_id);
CREATE INDEX idx_company_analytics_period ON public.company_analytics(period_start, period_end);

-- Add trigger for updated_at columns
CREATE TRIGGER update_premium_plans_updated_at
BEFORE UPDATE ON public.premium_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default plans
INSERT INTO public.premium_plans (name, description, price, billing_period, target_user_type, features, visibility_boost, max_products, max_featured_products) VALUES
('Básico Persona', 'Plan gratuito para personas', 0, 'monthly', 'person', '["Publicar hasta 5 productos", "Chat básico", "Notificaciones por email"]'::jsonb, 1, 5, 0),
('Premium Persona', 'Plan premium para personas activas', 9.99, 'monthly', 'person', '["Productos ilimitados", "Mayor visibilidad", "Insignia Premium", "Soporte prioritario", "3 productos destacados"]'::jsonb, 2, NULL, 3),
('Básico Empresa', 'Plan gratuito para empresas', 0, 'monthly', 'company', '["Publicar hasta 10 servicios", "Dashboard básico", "Respuestas rápidas"]'::jsonb, 1, 10, 0),
('Premium Empresa', 'Plan premium para empresas', 29.99, 'monthly', 'company', '["Servicios ilimitados", "Máxima visibilidad", "Insignia Empresa Verificada", "Analytics avanzados", "10 servicios destacados", "Soporte VIP"]'::jsonb, 3, NULL, 10),
('Pro Empresa', 'Plan profesional para empresas grandes', 79.99, 'monthly', 'company', '["Todo de Premium", "API access", "Múltiples usuarios", "White label", "Servicios destacados ilimitados"]'::jsonb, 5, NULL, 999);