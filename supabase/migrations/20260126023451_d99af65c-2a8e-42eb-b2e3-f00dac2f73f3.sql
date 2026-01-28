-- Create reviews table for user ratings after completing a trueke
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewed_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (match_id, reviewer_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Reviews are viewable by everyone"
ON public.reviews
FOR SELECT
USING (true);

CREATE POLICY "Users can insert reviews for their completed matches"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = reviewer_id
  AND EXISTS (
    SELECT 1 FROM public.matches
    WHERE matches.id = match_id
    AND matches.status = 'completed'
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
);

-- Create index for faster queries
CREATE INDEX idx_reviews_reviewed_id ON public.reviews(reviewed_id);
CREATE INDEX idx_reviews_match_id ON public.reviews(match_id);