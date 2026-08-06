import { desc, eq } from "drizzle-orm"
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { products, purchases } from "@/lib/db/schema"
import { createClient } from "@/lib/supabase/server"

// 買い手の購入履歴カード表示用の型。ダウンロードは productId を使って
// GET /api/downloads/[productId] を叩く。
export type MyPurchase = {
  id: string
  productId: string
  title: string
  imageUrl: string | null
  amount: number
  createdAt: string
}

// ─── GET /api/purchases ───────────────────────────────────────────
// ログイン中ユーザーが購入した商品の一覧を新着順で返す。

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 })
  }

  const rows = await db
    .select({
      id: purchases.id,
      productId: products.id,
      title: products.title,
      imagePath: products.imagePath,
      amount: purchases.amount,
      createdAt: purchases.createdAt,
    })
    .from(purchases)
    .innerJoin(products, eq(products.id, purchases.productId))
    .where(eq(purchases.buyerId, user.id))
    .orderBy(desc(purchases.createdAt))

  const data: MyPurchase[] = rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    title: row.title,
    imageUrl: row.imagePath
      ? supabase.storage.from("product-images").getPublicUrl(row.imagePath).data.publicUrl
      : null,
    amount: row.amount,
    createdAt: row.createdAt.toISOString(),
  }))

  return NextResponse.json({ data })
}
