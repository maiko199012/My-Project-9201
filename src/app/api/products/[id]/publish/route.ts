import { eq } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { createClient } from "@/lib/supabase/server"

const publishSchema = z.object({
  isPublished: z.boolean(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. 認証
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 })

  // 2. 商品取得
  const { id } = await params
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1)

  if (!product) return NextResponse.json({ error: "商品が見つかりません" }, { status: 404 })

  // 3. 所有者確認
  if (product.userId !== user.id)
    return NextResponse.json({ error: "この商品を編集する権限がありません" }, { status: 403 })

  // 4. 入力バリデーション
  const parsed = publishSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  // 5. isPublished を更新
  const [updated] = await db
    .update(products)
    .set({ isPublished: parsed.data.isPublished, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning()

  return NextResponse.json({ data: updated })
}
