-- Create discount_codes table for premium plan discounts
CREATE TABLE public.discount_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value NUMERIC NOT NULL DEFAULT 0,
  applicable_plans UUID[] DEFAULT '{}', -- Empty means all plans
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  min_plan_price NUMERIC DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create discount_code_uses table to track who used which code
CREATE TABLE public.discount_code_uses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_id UUID NOT NULL REFERENCES public.discount_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.user_subscriptions(id),
  discount_applied NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(code_id, user_id) -- Each user can only use a code once
);

-- Create featured_products table for premium product highlighting
CREATE TABLE public.featured_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  featured_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

-- Add notification preferences and last notification sent to user_subscriptions
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS expiry_notified_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_code_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_products ENABLE ROW LEVEL SECURITY;

-- RLS for discount_codes
CREATE POLICY "Active codes are viewable by authenticated users" 
ON public.discount_codes FOR SELECT 
TO authenticated
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

CREATE POLICY "Admins can manage discount codes" 
ON public.discount_codes FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS for discount_code_uses
CREATE POLICY "Users can view their own code uses" 
ON public.discount_code_uses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own code uses" 
ON public.discount_code_uses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all code uses" 
ON public.discount_code_uses FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS for featured_products
CREATE POLICY "Featured products are viewable by everyone" 
ON public.featured_products FOR SELECT 
USING (featured_until IS NULL OR featured_until > now());

CREATE POLICY "Users can manage their own featured products" 
ON public.featured_products FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all featured products" 
ON public.featured_products FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes
CREATE INDEX idx_discount_codes_code ON public.discount_codes(code);
CREATE INDEX idx_discount_codes_active ON public.discount_codes(is_active, valid_until);
CREATE INDEX idx_featured_products_product ON public.featured_products(product_id);
CREATE INDEX idx_featured_products_priority ON public.featured_products(priority DESC);
CREATE INDEX idx_user_subscriptions_expires ON public.user_subscriptions(expires_at);