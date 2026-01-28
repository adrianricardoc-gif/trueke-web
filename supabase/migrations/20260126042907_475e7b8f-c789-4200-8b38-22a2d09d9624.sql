-- Add condition column to products table for product condition filtering
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS condition text DEFAULT 'used' CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'used'));