-- Create trade_offers table for offer/counter-offer negotiation
CREATE TABLE public.trade_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  proposed_products UUID[] NOT NULL DEFAULT '{}',
  additional_value_offered NUMERIC DEFAULT 0,
  additional_value_requested NUMERIC DEFAULT 0,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  parent_offer_id UUID REFERENCES public.trade_offers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_offer_status CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'expired'))
);

-- Enable RLS
ALTER TABLE public.trade_offers ENABLE ROW LEVEL SECURITY;

-- Policies for trade_offers
CREATE POLICY "Users can view offers they are part of"
ON public.trade_offers
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create offers"
ON public.trade_offers
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can update offer status"
ON public.trade_offers
FOR UPDATE
USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- Enable realtime for trade_offers
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_offers;

-- Add index for faster queries
CREATE INDEX idx_trade_offers_match ON public.trade_offers(match_id);
CREATE INDEX idx_trade_offers_sender ON public.trade_offers(sender_id);
CREATE INDEX idx_trade_offers_receiver ON public.trade_offers(receiver_id);
CREATE INDEX idx_trade_offers_status ON public.trade_offers(status);

-- Add coordinates to products for map functionality
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;