import { and, eq } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"

import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { createClient } from "@/lib/supabase/server"
import type { PublicProduct } from "@/app/api/public/products/route"

// ─── GET /api/public/products/[id] ───────────────────────────────
// 認証不要。isPublished = true の商品 1 件を返す。
// filePath / userId はレスポンスに含めない。

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const [product] = await db
    .select({
      id: products.id,
      title: products.title,
      description: products.description,
      price: products.price,
      imagePath: products.imagePath,
      createdAt: products.createdAt,
    })
    .from(products)
    .where(and(eq(products.id, id), eq(products.isPublished, true)))
    .limit(1)

  if (!product) {
    return NextResponse.json({ error: "商品が見つかりません" }, { status: 404 })
  }

  const data: PublicProduct = {
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.price,
    imageUrl: product.imagePath
      ? supabase.storage.from("product-images").getPublicUrl(product.imagePath).data.publicUrl
      : null,
    createdAt: product.createdAt.toISOString(),
  }

  return NextResponse.json({ data })
}
