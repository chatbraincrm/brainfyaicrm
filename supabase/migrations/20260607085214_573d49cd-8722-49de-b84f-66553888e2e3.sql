
-- 1) Switch platform_branding_public view to SECURITY INVOKER (was DEFINER) and ensure anon read access
ALTER VIEW public.platform_branding_public SET (security_invoker = true);
GRANT SELECT ON public.platform_branding_public TO anon, authenticated;

-- 2) Harden storage policies: require organization_id as first folder for any write/update/delete

-- Helper: short alias to keep policies readable
-- Uses existing public.get_user_organization(uuid) returning uuid

-- ============ cadence-media ============
DROP POLICY IF EXISTS "Authenticated users can upload cadence media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update cadence media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete cadence media" ON storage.objects;

CREATE POLICY "cadence_media_org_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cadence-media'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

CREATE POLICY "cadence_media_org_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'cadence-media'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

CREATE POLICY "cadence_media_org_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'cadence-media'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

-- ============ materials ============
DROP POLICY IF EXISTS "Authenticated users can upload materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete materials" ON storage.objects;

CREATE POLICY "materials_org_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'materials'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

CREATE POLICY "materials_org_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'materials'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

CREATE POLICY "materials_org_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'materials'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

-- ============ catalog-media ============
DROP POLICY IF EXISTS "catalog_media_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "catalog_media_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "catalog_media_auth_delete" ON storage.objects;

CREATE POLICY "catalog_media_org_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'catalog-media'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

CREATE POLICY "catalog_media_org_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'catalog-media'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

CREATE POLICY "catalog_media_org_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'catalog-media'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

-- ============ chat-media ============
DROP POLICY IF EXISTS "chat-media authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "chat-media authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "chat-media authenticated delete" ON storage.objects;

CREATE POLICY "chat_media_org_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

CREATE POLICY "chat_media_org_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

CREATE POLICY "chat_media_org_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

-- ============ funnel-assets ============
DROP POLICY IF EXISTS "funnel_assets_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "funnel_assets_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "funnel_assets_auth_delete" ON storage.objects;

CREATE POLICY "funnel_assets_org_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'funnel-assets'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

CREATE POLICY "funnel_assets_org_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'funnel-assets'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

CREATE POLICY "funnel_assets_org_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'funnel-assets'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

-- ============ form-media ============
DROP POLICY IF EXISTS "form-media authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "form-media authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "form-media authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "form-media authenticated read" ON storage.objects;

CREATE POLICY "form_media_org_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'form-media'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

CREATE POLICY "form_media_org_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'form-media'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

CREATE POLICY "form_media_org_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'form-media'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

CREATE POLICY "form_media_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'form-media');

-- ============ product-documents ============
DROP POLICY IF EXISTS "Users can upload their org product documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their org product documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their org product documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their org product documents" ON storage.objects;

CREATE POLICY "product_documents_org_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-documents'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

CREATE POLICY "product_documents_org_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-documents'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

CREATE POLICY "product_documents_org_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-documents'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);

CREATE POLICY "product_documents_org_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'product-documents'
    AND (storage.foldername(name))[1] = public.get_user_organization(auth.uid())::text);
