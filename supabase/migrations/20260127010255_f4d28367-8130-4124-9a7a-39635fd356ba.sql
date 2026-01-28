-- Add expiry settings to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expiry_notified_3days BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS expiry_notified_1day BOOLEAN DEFAULT false;

-- Add default expiry days setting to admin_settings
INSERT INTO public.admin_settings (key, value, description, is_secret)
VALUES ('default_product_expiry_days', '30', 'Días por defecto antes de que expire una publicación', false)
ON CONFLICT (key) DO NOTHING;

-- Create index for efficient expiry queries
CREATE INDEX IF NOT EXISTS idx_products_expires_at ON public.products(expires_at) WHERE status = 'active';

-- Function to set default expiry on new products
CREATE OR REPLACE FUNCTION public.set_product_expiry()
RETURNS TRIGGER AS $$
DECLARE
  expiry_days INTEGER;
BEGIN
  -- Get default expiry days from admin settings
  SELECT COALESCE(value::integer, 30) INTO expiry_days
  FROM public.admin_settings
  WHERE key = 'default_product_expiry_days';
  
  -- Set expires_at if not already set
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + (expiry_days || ' days')::interval;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new products
DROP TRIGGER IF EXISTS trigger_set_product_expiry ON public.products;
CREATE TRIGGER trigger_set_product_expiry
BEFORE INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_product_expiry();

-- Function to renew product expiry (when user republishes)
CREATE OR REPLACE FUNCTION public.renew_product_expiry(product_id UUID)
RETURNS VOID AS $$
DECLARE
  expiry_days INTEGER;
BEGIN
  SELECT COALESCE(value::integer, 30) INTO expiry_days
  FROM public.admin_settings
  WHERE key = 'default_product_expiry_days';
  
  UPDATE public.products
  SET 
    expires_at = NOW() + (expiry_days || ' days')::interval,
    expiry_notified_3days = false,
    expiry_notified_1day = false,
    updated_at = NOW()
  WHERE id = product_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;