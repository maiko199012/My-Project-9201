import "server-only"

import { createClient } from "@supabase/supabase-js"

// product-files は非公開バケットで、authenticated/anon 向けの SELECT ポリシーを
// あえて設定していない（0003_setup_storage_buckets.sql 参照）。
// 署名付き URL の発行には RLS を回避できるサービスロールキーが必要なため、
// このクライアントは購入確認済みのダウンロード API 内でのみ使用すること。
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
