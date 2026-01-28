-- Add column to track which product the user is offering when swiping
ALTER TABLE public.swipes 
ADD COLUMN offered_product_id uuid REFERENCES public.products(id);

-- Create index for faster lookups
CREATE INDEX idx_swipes_offered_product ON public.swipes(offered_product_id);

-- Update check_for_match function to use offered_product_id for more accurate matching
CREATE OR REPLACE FUNCTION public.check_for_match()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  product_owner_id UUID;
  reverse_swipe RECORD;
BEGIN
  IF NEW.action = 'like' THEN
    -- Get the owner of the product being liked
    SELECT user_id INTO product_owner_id FROM public.products WHERE id = NEW.product_id;
    
    -- Look for a reverse like where:
    -- 1. The product owner liked one of our products (preferably the one we're offering)
    -- 2. Or they liked any of our products if offered_product_id is null
    SELECT s.* INTO reverse_swipe
    FROM public.swipes s
    JOIN public.products p ON s.product_id = p.id
    WHERE s.user_id = product_owner_id
      AND p.user_id = NEW.user_id
      AND s.action = 'like'
      -- Prefer matching the specific offered product
      AND (
        NEW.offered_product_id IS NULL 
        OR s.product_id = NEW.offered_product_id 
        OR s.offered_product_id = NEW.product_id
      )
    ORDER BY 
      CASE WHEN s.product_id = NEW.offered_product_id THEN 0 ELSE 1 END
    LIMIT 1;
    
    IF FOUND THEN
      -- Use offered_product_id if available, otherwise fall back to the liked product
      INSERT INTO public.matches (user1_id, user2_id, product1_id, product2_id)
      VALUES (
        NEW.user_id, 
        product_owner_id, 
        COALESCE(NEW.offered_product_id, reverse_swipe.product_id), 
        NEW.product_id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;