-- Create favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies for favorites
CREATE POLICY "Users can view their own favorites"
ON public.favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
ON public.favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON public.favorites FOR DELETE
USING (auth.uid() = user_id);

-- Add user_type to profiles (person or company)
ALTER TABLE public.profiles 
ADD COLUMN user_type TEXT NOT NULL DEFAULT 'person' 
CHECK (user_type IN ('person', 'company'));

-- Add product_type to products (product or service)
ALTER TABLE public.products 
ADD COLUMN product_type TEXT NOT NULL DEFAULT 'product' 
CHECK (product_type IN ('product', 'service'));