-- Securing your API (https://supabase.com/docs/guides/api/securing-your-api)
--
-- このスターターは PostgREST のデータ API(/rest/v1)を使わず、
-- API Handler から DATABASE_URL の postgres ロールで直接 Drizzle 経由で接続する。
-- そのため anon / authenticated ロールが public スキーマの何かに到達する経路は
-- 本来存在しないが、anon キーが漏洩したり、誤って supabase-js の `from(...)` が
-- 呼ばれた場合に備えて防御策として権限を完全に剥がしておく。
--
-- 認証 (signup / signInWithPassword / signOut 等) は GoTrue REST API
-- (/auth/v1) を経由するため、auth スキーマには触らない。

-- 既存オブジェクトの権限を剥がす
REVOKE USAGE ON SCHEMA public FROM anon, authenticated;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;
--> statement-breakpoint

-- 今後 public に作られる新規オブジェクトもデフォルトで anon / authenticated に
-- 付与されないように既定の権限も剥がす
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
