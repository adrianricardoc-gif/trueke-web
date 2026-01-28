-- Create reports table for reporting products or users
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('product', 'user')),
  reported_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  reported_user_id UUID,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'fake', 'offensive', 'scam', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_report CHECK (
    (report_type = 'product' AND reported_product_id IS NOT NULL) OR 
    (report_type = 'user' AND reported_user_id IS NOT NULL)
  )
);

-- Enable RLS on reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
ON public.reports FOR SELECT
USING (auth.uid() = reporter_id);

-- Add is_verified to profiles
ALTER TABLE public.profiles 
ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT false;

-- Add verified_at timestamp
ALTER TABLE public.profiles 
ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;