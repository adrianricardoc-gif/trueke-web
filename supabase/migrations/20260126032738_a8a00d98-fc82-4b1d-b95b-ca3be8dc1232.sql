-- Remove FK constraint on products.user_id to allow demo users
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_user_id_fkey;