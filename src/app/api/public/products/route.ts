import { desc, eq } from "drizzle-orm"
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { createClient } from "@/lib/supabase/server"

// 公開ページ向けの安全なフィールドのみ返す型
export type PublicProduct = {
  id: string
  title: string
  description: string | null
  price: number
  imageUrl: string | null
  createdAt: string
}

// ─── GET /api/public/products ─────────────────────────────────────
// 認証不要。isPublished = true の全商品を新着順で返す。
// filePath / userId はレスポンスに含めない。

export async function GET() {
  const supabase = await createClient()

  const rows = await db
    .select({
      id: products.id,
      title: products.title,
      description: products.description,
      price: products.price,
      imagePath: products.imagePath,
      createdAt: products.createdAt,
    })
    .from(products)
    .where(eq(products.isPublished, true))
    .orderBy(desc(products.createdAt))

  const data: PublicProduct[] = rows.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price,
    imageUrl: p.imagePath
      ? supabase.storage.from("product-images").getPublicUrl(p.imagePath).data.publicUrl
      : null,
    createdAt: p.createdAt.toISOString(),
  }))

  return NextResponse.json({ data })
}
