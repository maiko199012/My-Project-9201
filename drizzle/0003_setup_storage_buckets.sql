-- ───────────────────────────────────────────────────────────────
-- バケット作成
-- ───────────────────────────────────────────────────────────────

-- product-images: サムネイル用（公開バケット）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- product-files: 販売ファイル用（非公開バケット）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-files',
  'product-files',
  false,
  524288000,
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────
-- product-images のポリシー
-- ファイルパス構造: {user_id}/{filename}
-- ───────────────────────────────────────────────────────────────

-- 未ログインを含む全員が閲覧できる
CREATE POLICY "product-images: public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- ログイン済みユーザーは自分のフォルダにアップロードできる
CREATE POLICY "product-images: auth upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ログイン済みユーザーは自分のフォルダを更新できる
CREATE POLICY "product-images: auth update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ログイン済みユーザーは自分のフォルダを削除できる
CREATE POLICY "product-images: auth delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ───────────────────────────────────────────────────────────────
-- product-files のポリシー
-- 非公開バケット。SELECT は Route Handler（サービスキー）経由のみ
-- ───────────────────────────────────────────────────────────────

-- ログイン済みユーザーは自分のフォルダにアップロードできる
CREATE POLICY "product-files: auth upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
