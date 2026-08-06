import { count, desc, eq, sql } from "drizzle-orm"
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { products, purchases } from "@/lib/db/schema"
import { createClient } from "@/lib/supabase/server"

// ─── GET /api/sales ────────────────────────────────────────────────
// ログイン中ユーザーが売り手の商品について、売上サマリーを返す。
// 買い手を特定できる情報（buyerId・メール等）は一切含めない。

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 })
  }

  // 商品ごとの件数・売上（売上 0 の商品も含めるため LEFT JOIN）
  const byProductRows = await db
    .select({
      productId: products.id,
      title: products.title,
      count: count(purchases.id),
      amount: sql<string>`coalesce(sum(${purchases.amount}), 0)`,
    })
    .from(products)
    .leftJoin(purchases, eq(purchases.productId, products.id))
    .where(eq(products.userId, user.id))
    .groupBy(products.id, products.title)
    .orderBy(desc(sql`coalesce(sum(${purchases.amount}), 0)`))

  const byProduct = byProductRows.map((row) => ({
    productId: row.productId,
    title: row.title,
    count: Number(row.count),
    amount: Number(row.amount),
  }))

  const totalAmount = byProduct.reduce((sum, p) => sum + p.amount, 0)
  const totalCount = byProduct.reduce((sum, p) => sum + p.count, 0)

  // 直近の販売（買い手情報は含めず、商品名・金額・日時のみ）
  const recentRows = await db
    .select({
      id: purchases.id,
      productTitle: products.title,
      amount: purchases.amount,
      createdAt: purchases.createdAt,
    })
    .from(purchases)
    .innerJoin(products, eq(products.id, purchases.productId))
    .where(eq(products.userId, user.id))
    .orderBy(desc(purchases.createdAt))
    .limit(20)

  const recent = recentRows.map((row) => ({
    id: row.id,
    productTitle: row.productTitle,
    amount: row.amount,
    createdAt: row.createdAt.toISOString(),
  }))

  return NextResponse.json({
    data: { totalAmount, totalCount, byProduct, recent },
  })
}
