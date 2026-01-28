-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Allow public read access
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated users to upload
CREATE POLICY "Users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

-- Allow users to delete their own product images
CREATE POLICY "Users can delete their product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);