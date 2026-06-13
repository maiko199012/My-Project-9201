import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"

import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import {
  ALLOWED_FILE_TYPES,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_BYTES,
  MAX_IMAGE_BYTES,
  createProductTextSchema,
} from "@/lib/schemas/product"
import { createClient } from "@/lib/supabase/server"

// ─── 共通: 商品を取得して所有者チェック ─────────────────────────
async function getProductAndVerifyOwner(id: string, userId: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1)

  if (!product) return { error: "not_found" as const }
  if (product.userId !== userId) return { error: "forbidden" as const }
  return { product }
}

// ─── 共通: imagePath → 公開 URL ──────────────────────────────────
function toImageUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  imagePath: string | null,
): string | null {
  if (!imagePath) return null
  return supabase.storage.from("product-images").getPublicUrl(imagePath).data.publicUrl
}

// ─── 共通: ファイル名生成 ─────────────────────────────────────────
function buildStoragePath(userId: string, originalName: string): string {
  const ext = originalName.split(".").pop() ?? "bin"
  return `${userId}/${randomUUID()}.${ext}`
}

// ─── GET /api/products/[id] ───────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 })

  const { id } = await params
  const result = await getProductAndVerifyOwner(id, user.id)

  if (result.error === "not_found")
    return NextResponse.json({ error: "商品が見つかりません" }, { status: 404 })
  if (result.error === "forbidden")
    return NextResponse.json({ error: "この商品にアクセスする権限がありません" }, { status: 403 })

  const { product } = result
  return NextResponse.json({
    data: { ...product, imageUrl: toImageUrl(supabase, product.imagePath) },
  })
}

// ─── PATCH /api/products/[id] ────────────────────────────────────
// isPublished の変更は含めない（/api/products/[id]/publish で別途扱う）

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

  // 2. 商品取得 & 所有者確認
  const { id } = await params
  const result = await getProductAndVerifyOwner(id, user.id)

  if (result.error === "not_found")
    return NextResponse.json({ error: "商品が見つかりません" }, { status: 404 })
  if (result.error === "forbidden")
    return NextResponse.json({ error: "この商品にアクセスする権限がありません" }, { status: 403 })

  const { product } = result

  // 3. FormData を取得
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "リクエストの解析に失敗しました" }, { status: 400 })
  }

  // 4. テキストフィールドのバリデーション（送られた項目のみ部分更新）
  const rawTitle = formData.get("title")
  const rawDescription = formData.get("description")
  const rawPrice = formData.get("price")

  const textParsed = createProductTextSchema
    .pick({
      ...(rawTitle !== null ? { title: true as const } : {}),
      ...(rawDescription !== null ? { description: true as const } : {}),
      ...(rawPrice !== null ? { price: true as const } : {}),
    })
    .safeParse({
      ...(rawTitle !== null ? { title: rawTitle } : {}),
      ...(rawDescription !== null ? { description: rawDescription } : {}),
      ...(rawPrice !== null ? { price: rawPrice } : {}),
    })

  if (!textParsed.success)
    return NextResponse.json({ error: textParsed.error.issues }, { status: 400 })

  // 5. 画像ファイルがあれば差し替え
  const imageFile = formData.get("image")
  let newImagePath: string | undefined

  if (imageFile instanceof File && imageFile.size > 0) {
    if (imageFile.size > MAX_IMAGE_BYTES)
      return NextResponse.json({ error: "画像ファイルは 5 MB 以内にしてください" }, { status: 400 })
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(imageFile.type))
      return NextResponse.json({ error: "画像は JPEG / PNG / WebP 形式のみ対応しています" }, { status: 400 })

    newImagePath = buildStoragePath(user.id, imageFile.name)
    const { error: uploadErr } = await supabase.storage
      .from("product-images")
      .upload(newImagePath, imageFile, { contentType: imageFile.type, upsert: false })

    if (uploadErr)
      return NextResponse.json(
        { error: `画像のアップロードに失敗しました: ${uploadErr.message}` },
        { status: 500 },
      )
  }

  // 6. 販売ファイルがあれば差し替え
  const productFile = formData.get("file")
  let newFilePath: string | undefined

  if (productFile instanceof File && productFile.size > 0) {
    if (productFile.size > MAX_FILE_BYTES)
      return NextResponse.json({ error: "販売ファイルは 50 MB 以内にしてください" }, { status: 400 })
    if (!(ALLOWED_FILE_TYPES as readonly string[]).includes(productFile.type))
      return NextResponse.json({ error: "販売ファイルは PDF / ZIP 形式のみ対応しています" }, { status: 400 })

    newFilePath = buildStoragePath(user.id, productFile.name)
    const { error: uploadErr } = await supabase.storage
      .from("product-files")
      .upload(newFilePath, productFile, { contentType: productFile.type, upsert: false })

    if (uploadErr) {
      // 画像だけアップ済みならロールバック
      if (newImagePath) {
        await supabase.storage.from("product-images").remove([newImagePath])
      }
      return NextResponse.json(
        { error: `販売ファイルのアップロードに失敗しました: ${uploadErr.message}` },
        { status: 500 },
      )
    }
  }

  // 7. DB を更新
  const updateValues: Partial<typeof product> = {
    ...textParsed.data,
    ...(newImagePath !== undefined ? { imagePath: newImagePath } : {}),
    ...(newFilePath !== undefined ? { filePath: newFilePath } : {}),
    updatedAt: new Date(),
  }

  let updated
  try {
    ;[updated] = await db
      .update(products)
      .set(updateValues)
      .where(eq(products.id, id))
      .returning()
  } catch (err) {
    // DB 失敗 → 新しくアップしたファイルをロールバック
    if (newImagePath) await supabase.storage.from("product-images").remove([newImagePath])
    if (newFilePath) await supabase.storage.from("product-files").remove([newFilePath])
    console.error("[PATCH /api/products/[id]] DB update failed:", err)
    return NextResponse.json({ error: "商品の更新に失敗しました" }, { status: 500 })
  }

  // 8. 旧ファイルを削除（新ファイルへの差し替えが確定した後）
  if (newImagePath && product.imagePath) {
    await supabase.storage.from("product-images").remove([product.imagePath])
  }
  if (newFilePath && product.filePath) {
    await supabase.storage.from("product-files").remove([product.filePath])
  }

  return NextResponse.json({
    data: { ...updated, imageUrl: toImageUrl(supabase, updated.imagePath) },
  })
}

// ─── DELETE /api/products/[id] ────────────────────────────────────
// Storage ファイルは削除しない（DB 行のみ）

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 })

  const { id } = await params
  const result = await getProductAndVerifyOwner(id, user.id)

  if (result.error === "not_found")
    return NextResponse.json({ error: "商品が見つかりません" }, { status: 404 })
  if (result.error === "forbidden")
    return NextResponse.json({ error: "この商品を削除する権限がありません" }, { status: 403 })

  await db.delete(products).where(eq(products.id, id))

  return new NextResponse(null, { status: 204 })
}
