-- Create price history table to track product value changes over time
CREATE TABLE public.price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  estimated_value NUMERIC NOT NULL,
  additional_value NUMERIC DEFAULT 0,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  changed_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Price history is viewable by everyone
CREATE POLICY "Price history is viewable by everyone"
ON public.price_history
FOR SELECT
USING (true);

-- Users can insert price history for their own products
CREATE POLICY "Users can insert price history for their own products"
ON public.price_history
FOR INSERT
WITH CHECK (
  auth.uid() = changed_by AND
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_id AND user_id = auth.uid()
  )
);

-- Create user favorite categories table
CREATE TABLE public.user_favorite_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Enable RLS
ALTER TABLE public.user_favorite_categories ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorite categories
CREATE POLICY "Users can view their own favorite categories"
ON public.user_favorite_categories
FOR SELECT
USING (auth.uid() = user_id);

-- Users can manage their own favorite categories
CREATE POLICY "Users can insert their own favorite categories"
ON public.user_favorite_categories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite categories"
ON public.user_favorite_categories
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite categories"
ON public.user_favorite_categories
FOR DELETE
USING (auth.uid() = user_id);

-- Add GPS coordinates to profiles for location verification
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_verified_at TIMESTAMP WITH TIME ZONE;

-- Create trigger function to record price history
CREATE OR REPLACE FUNCTION public.record_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estimated_value IS DISTINCT FROM NEW.estimated_value OR 
     OLD.additional_value IS DISTINCT FROM NEW.additional_value THEN
    INSERT INTO public.price_history (product_id, estimated_value, additional_value, changed_by)
    VALUES (NEW.id, NEW.estimated_value, COALESCE(NEW.additional_value, 0), NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for price changes
CREATE TRIGGER on_product_price_change
AFTER UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.record_price_change();

-- Also record initial price when product is created
CREATE OR REPLACE FUNCTION public.record_initial_price()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.price_history (product_id, estimated_value, additional_value, changed_by)
  VALUES (NEW.id, NEW.estimated_value, COALESCE(NEW.additional_value, 0), NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;