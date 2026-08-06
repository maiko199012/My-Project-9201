import { and, eq } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"

import { db } from "@/lib/db"
import { products, purchases } from "@/lib/db/schema"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

// ─── GET /api/downloads/[productId] ───────────────────────────────
// 認証 → purchases で購入済みか確認 → サービスロールクライアントで
// product-files（非公開バケット）の署名付き URL（60 秒のみ有効）を発行し、
// そこへリダイレクトする。ファイルの実 URL はレスポンスにも画面にも出さない。

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 })
  }

  const [purchase] = await db
    .select({ id: purchases.id })
    .from(purchases)
    .where(and(eq(purchases.buyerId, user.id), eq(purchases.productId, productId)))
    .limit(1)

  if (!purchase) {
    return NextResponse.json({ error: "この商品を購入していません" }, { status: 403 })
  }

  const [product] = await db
    .select({ filePath: products.filePath })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)

  if (!product?.filePath) {
    return NextResponse.json({ error: "ファイルが見つかりません" }, { status: 404 })
  }

  const { data: signed, error } = await createServiceClient()
    .storage.from("product-files")
    .createSignedUrl(product.filePath, 60, { download: true })

  if (error || !signed) {
    console.error(`[GET /api/downloads/${productId}] failed to create signed url:`, error)
    return NextResponse.json({ error: "ダウンロードURLの発行に失敗しました" }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
