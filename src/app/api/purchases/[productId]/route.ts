import { and, eq } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"

import { db } from "@/lib/db"
import { purchases } from "@/lib/db/schema"
import { createClient } from "@/lib/supabase/server"

// ─── GET /api/purchases/[productId] ───────────────────────────────
// ログイン中ユーザーがこの商品を購入済みかどうかを返す。
// 決済完了ページが Webhook 反映待ちのポーリングに使う。

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

  return NextResponse.json({ data: { purchased: !!purchase } })
}
