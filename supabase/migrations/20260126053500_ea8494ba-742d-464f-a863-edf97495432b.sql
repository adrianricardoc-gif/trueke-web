
-- Admin settings table for API keys and configurations
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  description text,
  is_secret boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings" ON public.admin_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default API key placeholders
INSERT INTO public.admin_settings (key, value, description, is_secret) VALUES
  ('STRIPE_SECRET_KEY', NULL, 'Clave secreta de Stripe para procesar pagos', true),
  ('STRIPE_PUBLISHABLE_KEY', NULL, 'Clave pública de Stripe', false),
  ('WHATSAPP_API_KEY', NULL, 'API key de WhatsApp Business', true),
  ('OPENAI_API_KEY', NULL, 'API key de OpenAI para asistente IA', true);

-- Referral system
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text UNIQUE NOT NULL,
  uses_count integer DEFAULT 0,
  max_uses integer,
  reward_trukoins integer DEFAULT 100,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.referral_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL,
  referrer_user_id uuid NOT NULL,
  trukoins_earned integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(referred_user_id)
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referral codes" ON public.referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral codes" ON public.referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view referral uses they're part of" ON public.referral_uses
  FOR SELECT USING (auth.uid() = referred_user_id OR auth.uid() = referrer_user_id);

CREATE POLICY "System can insert referral uses" ON public.referral_uses
  FOR INSERT WITH CHECK (auth.uid() = referred_user_id);

-- TrueKoins virtual currency
CREATE TABLE public.trukoin_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  balance integer DEFAULT 0,
  lifetime_earned integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.trukoin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  transaction_type text NOT NULL, -- 'earn', 'spend', 'referral', 'trade', 'auction', 'bonus'
  description text,
  reference_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.trukoin_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trukoin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet" ON public.trukoin_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their wallet" ON public.trukoin_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their wallet" ON public.trukoin_wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON public.trukoin_wallets
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their transactions" ON public.trukoin_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert transactions" ON public.trukoin_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auctions system
CREATE TABLE public.auctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL,
  starting_price numeric DEFAULT 0,
  current_price numeric DEFAULT 0,
  min_increment numeric DEFAULT 1,
  ends_at timestamp with time zone NOT NULL,
  status text DEFAULT 'active', -- 'active', 'ended', 'cancelled', 'sold'
  winner_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.auction_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid REFERENCES public.auctions(id) ON DELETE CASCADE,
  bidder_id uuid NOT NULL,
  amount numeric NOT NULL,
  is_winning boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auctions are viewable by everyone" ON public.auctions
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own auctions" ON public.auctions
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own auctions" ON public.auctions
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Bids are viewable by everyone" ON public.auction_bids
  FOR SELECT USING (true);

CREATE POLICY "Users can place bids" ON public.auction_bids
  FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- Circular trades (multi-party)
CREATE TABLE public.circular_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id uuid NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  min_participants integer DEFAULT 3,
  max_participants integer DEFAULT 10,
  expires_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.circular_trade_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid REFERENCES public.circular_trades(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id),
  position integer, -- order in the chain
  receives_from_user_id uuid,
  gives_to_user_id uuid,
  status text DEFAULT 'pending', -- 'pending', 'confirmed', 'completed'
  confirmed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(trade_id, user_id)
);

ALTER TABLE public.circular_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circular_trade_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Circular trades are viewable by everyone" ON public.circular_trades
  FOR SELECT USING (true);

CREATE POLICY "Users can create circular trades" ON public.circular_trades
  FOR INSERT WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY "Initiators can update their trades" ON public.circular_trades
  FOR UPDATE USING (auth.uid() = initiator_id);

CREATE POLICY "Participants can view trade details" ON public.circular_trade_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join trades" ON public.circular_trade_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participation" ON public.circular_trade_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Product AI verification results
CREATE TABLE public.product_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  verification_score numeric, -- 0-100
  is_authentic boolean,
  analysis_result jsonb,
  verified_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.product_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verifications are viewable by everyone" ON public.product_verifications
  FOR SELECT USING (true);

CREATE POLICY "System can insert verifications" ON public.product_verifications
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM products WHERE id = product_id AND user_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trukoin_wallets_updated_at
  BEFORE UPDATE ON public.trukoin_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_auctions_updated_at
  BEFORE UPDATE ON public.auctions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
