import { randomUUID } from "crypto"
import { desc, eq } from "drizzle-orm"
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

// ─── ファイルバリデーション ──────────────────────────────────────

type FileValidationError = { field: string; message: string }

function validateImageFile(file: File): FileValidationError | null {
  if (file.size > MAX_IMAGE_BYTES) {
    return { field: "image", message: "画像ファイルは 5 MB 以内にしてください" }
  }
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { field: "image", message: "画像は JPEG / PNG / WebP 形式のみ対応しています" }
  }
  return null
}

function validateProductFile(file: File): FileValidationError | null {
  if (file.size > MAX_FILE_BYTES) {
    return { field: "file", message: "販売ファイルは 50 MB 以内にしてください" }
  }
  if (!(ALLOWED_FILE_TYPES as readonly string[]).includes(file.type)) {
    return { field: "file", message: "販売ファイルは PDF / ZIP 形式のみ対応しています" }
  }
  return null
}

// ─── ファイル名生成 ──────────────────────────────────────────────

function buildStoragePath(userId: string, originalName: string): string {
  const ext = originalName.split(".").pop() ?? "bin"
  return `${userId}/${randomUUID()}.${ext}`
}

// ─── GET /api/products ───────────────────────────────────────────
// ログイン中ユーザーの商品一覧を返す（新着順）
// 各商品に imagePath から生成した imageUrl を付与する

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 })
  }

  const rows = await db
    .select()
    .from(products)
    .where(eq(products.userId, user.id))
    .orderBy(desc(products.createdAt))

  // product-images は公開バケットなので Storage の公開 URL を直接生成
  const data = rows.map((p) => ({
    ...p,
    imageUrl: p.imagePath
      ? supabase.storage.from("product-images").getPublicUrl(p.imagePath).data.publicUrl
      : null,
  }))

  return NextResponse.json({ data })
}

// ─── POST /api/products ──────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. 認証チェック
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 })
  }

  // 2. FormData を取得
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "リクエストの解析に失敗しました" }, { status: 400 })
  }

  // 3. テキストフィールドのバリデーション
  const textParsed = createProductTextSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    price: formData.get("price"),
  })
  if (!textParsed.success) {
    return NextResponse.json({ error: textParsed.error.issues }, { status: 400 })
  }

  // 4. ファイルの存在確認
  const imageFile = formData.get("image")
  const productFile = formData.get("file")

  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return NextResponse.json({ error: "画像ファイルは必須です" }, { status: 400 })
  }
  if (!(productFile instanceof File) || productFile.size === 0) {
    return NextResponse.json({ error: "販売ファイルは必須です" }, { status: 400 })
  }

  // 5. ファイルのバリデーション（サイズ・MIME type）
  const imageError = validateImageFile(imageFile)
  if (imageError) {
    return NextResponse.json({ error: imageError.message }, { status: 400 })
  }
  const fileError = validateProductFile(productFile)
  if (fileError) {
    return NextResponse.json({ error: fileError.message }, { status: 400 })
  }

  // 6. 画像を product-images バケットにアップロード
  const imagePath = buildStoragePath(user.id, imageFile.name)
  const { error: imageUploadError } = await supabase.storage
    .from("product-images")
    .upload(imagePath, imageFile, { contentType: imageFile.type, upsert: false })

  if (imageUploadError) {
    return NextResponse.json(
      { error: `画像のアップロードに失敗しました: ${imageUploadError.message}` },
      { status: 500 },
    )
  }

  // 7. 販売ファイルを product-files バケットにアップロード
  const filePath = buildStoragePath(user.id, productFile.name)
  const { error: fileUploadError } = await supabase.storage
    .from("product-files")
    .upload(filePath, productFile, { contentType: productFile.type, upsert: false })

  if (fileUploadError) {
    // 画像アップロード済みなので削除してロールバック
    await supabase.storage.from("product-images").remove([imagePath])
    return NextResponse.json(
      { error: `販売ファイルのアップロードに失敗しました: ${fileUploadError.message}` },
      { status: 500 },
    )
  }

  // 8. DB に INSERT
  let newProduct
  try {
    ;[newProduct] = await db
      .insert(products)
      .values({
        userId: user.id,
        title: textParsed.data.title,
        description: textParsed.data.description ?? null,
        price: textParsed.data.price,
        imagePath,
        filePath,
        isPublished: false,
      })
      .returning()
  } catch (err) {
    // DB 保存失敗 → アップロード済みファイルを削除してロールバック
    await supabase.storage.from("product-images").remove([imagePath])
    await supabase.storage.from("product-files").remove([filePath])
    console.error("[POST /api/products] DB insert failed:", err)
    return NextResponse.json({ error: "商品の保存に失敗しました" }, { status: 500 })
  }

  return NextResponse.json({ data: newProduct }, { status: 201 })
}
