-- Create verification_requests table for identity verification
CREATE TABLE public.verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_url TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own verification requests
CREATE POLICY "Users can create their own verification requests"
ON public.verification_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own verification requests
CREATE POLICY "Users can view their own verification requests"
ON public.verification_requests FOR SELECT
USING (auth.uid() = user_id);

-- Create storage bucket for verification documents (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-docs', 'verification-docs', false);

-- Users can upload their own verification documents
CREATE POLICY "Users can upload their own verification documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'verification-docs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own verification documents  
CREATE POLICY "Users can view their own verification documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-docs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);