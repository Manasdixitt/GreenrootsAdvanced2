/*
# Storage policies for tree-photos bucket

1. Purpose
   - Allow the public (anon) to UPLOAD photos to the "tree-photos" bucket.
   - Allow the public to READ photos from the bucket (photos are public, displayed on the website).
   - No DELETE policy — uploaded photos should not be deletable by the public.

2. Policies
   - SELECT (read): public — anyone can view tree photos.
   - INSERT (upload): public — the registration and update forms upload photos.
   - No UPDATE or DELETE policies.

3. Notes
   - The bucket was created as public (public=true) so URLs are directly accessible.
   - These policies control API access; the public flag controls URL access.
*/

DROP POLICY IF EXISTS "anon_read_tree_photos" ON storage.objects;
CREATE POLICY "anon_read_tree_photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'tree-photos');

DROP POLICY IF EXISTS "anon_upload_tree_photos" ON storage.objects;
CREATE POLICY "anon_upload_tree_photos" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'tree-photos');
