import { z } from "zod"

// ─── 定数 ────────────────────────────────────────────────────────
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
] as const

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024   // 5 MB
export const MAX_FILE_BYTES  = 50 * 1024 * 1024  // 50 MB

// ─── テキストフィールドのスキーマ ───────────────────────────────
// FormData から取得したテキスト部分を検証するために使う
export const createProductTextSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(100, "タイトルは 100 文字以内で入力してください"),
  description: z.string().max(2000, "説明は 2000 文字以内で入力してください").optional(),
  price: z.coerce
    .number()
    .int("価格は整数で入力してください")
    .min(0, "価格は 0 以上で入力してください"),
})

export type CreateProductTextInput = z.infer<typeof createProductTextSchema>
