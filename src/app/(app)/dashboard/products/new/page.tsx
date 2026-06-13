"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, UploadCloud, FileText, ArrowLeft, ImageIcon } from "lucide-react"
import { z } from "zod"

import { productKeys } from "@/lib/query-keys"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

// ─── クライアント側バリデーションスキーマ ─────────────────────────
const formSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(100, "タイトルは 100 文字以内で入力してください"),
  description: z
    .string()
    .max(2000, "説明は 2000 文字以内で入力してください")
    .optional(),
  // valueAsNumber で取得するので number 型で定義（coerce 不要）
  price: z
    .number({ message: "価格は数値で入力してください" })
    .int("価格は整数で入力してください")
    .min(0, "価格は 0 以上で入力してください"),
})

type FormValues = z.infer<typeof formSchema>

// ─── API の戻り値 ──────────────────────────────────────────────────
type ApiErrorResponse = { error: string | Array<{ message?: string }> }

function extractErrorMessage(body: ApiErrorResponse): string {
  if (typeof body.error === "string") return body.error
  if (Array.isArray(body.error)) {
    return body.error.map((e) => e?.message ?? "不明なエラー").join(" / ")
  }
  return "登録に失敗しました"
}

// ─── mutation 関数 ────────────────────────────────────────────────
async function createProduct(formData: FormData): Promise<void> {
  const res = await fetch("/api/products", {
    method: "POST",
    body: formData,
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: "登録に失敗しました" }))) as ApiErrorResponse
    throw new Error(extractErrorMessage(body))
  }
}

// ─── ファイルプレビュー用の小コンポーネント ─────────────────────
function FilePickerField({
  id,
  label,
  accept,
  hint,
  icon: Icon,
  file,
  onChange,
  error,
}: {
  id: string
  label: string
  accept: string
  hint: string
  icon: React.ElementType
  file: File | null
  onChange: (file: File | null) => void
  error?: string
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </FieldLabel>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={[
          "flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
          error
            ? "border-red-400 bg-red-50"
            : file
              ? "border-indigo-400 bg-indigo-50"
              : "border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50",
        ].join(" ")}
      >
        <Icon
          className={file ? "size-8 text-indigo-500" : "size-8 text-gray-400"}
          aria-hidden="true"
        />
        {file ? (
          <>
            <span className="text-sm font-medium text-indigo-700">{file.name}</span>
            <span className="text-xs text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB — クリックして変更
            </span>
          </>
        ) : (
          <>
            <span className="text-sm text-gray-600">
              クリックまたはドラッグ＆ドロップ
            </span>
            <span className="text-xs text-gray-400">{hint}</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}

// ─── ページ ────────────────────────────────────────────────────────
export default function NewProductPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [productFile, setProductFile] = React.useState<File | null>(null)
  const [fileErrors, setFileErrors] = React.useState<{ image?: string; file?: string }>({})
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", description: "", price: undefined },
  })

  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      router.push("/dashboard/products")
    },
    onError: (err: Error) => {
      setSubmitError(err.message)
    },
  })

  function validateFiles(): boolean {
    const errs: { image?: string; file?: string } = {}
    if (!imageFile) errs.image = "サムネイル画像は必須です"
    if (!productFile) errs.file = "販売ファイルは必須です"
    setFileErrors(errs)
    return Object.keys(errs).length === 0
  }

  function onSubmit(values: FormValues) {
    if (!validateFiles()) return
    setSubmitError(null)

    const fd = new FormData()
    fd.append("title", values.title)
    fd.append("description", values.description ?? "")
    fd.append("price", String(values.price))
    fd.append("image", imageFile!)
    fd.append("file", productFile!)

    mutation.mutate(fd)
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* ページヘッダー */}
      <div className="mb-8">
        <Link
          href="/dashboard/products"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          商品一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">商品を登録する</h1>
        <p className="mt-1 text-sm text-gray-500">
          販売する商品の情報を入力してください
        </p>
      </div>

      {/* フォームカード */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="gap-6">
            {/* タイトル */}
            <Field data-invalid={errors.title ? true : undefined}>
              <FieldLabel htmlFor="title" className="text-sm font-medium text-gray-700">
                商品タイトル <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                id="title"
                placeholder="例）Next.js 完全入門テンプレート"
                aria-invalid={errors.title ? true : undefined}
                {...register("title")}
              />
              <FieldError errors={errors.title ? [errors.title] : undefined} />
            </Field>

            {/* 説明 */}
            <Field data-invalid={errors.description ? true : undefined}>
              <FieldLabel htmlFor="description" className="text-sm font-medium text-gray-700">
                商品の説明
              </FieldLabel>
              <textarea
                id="description"
                rows={5}
                placeholder="商品の内容・対象者・含まれるファイルについて説明してください"
                aria-invalid={errors.description ? true : undefined}
                className={[
                  "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors",
                  "placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500",
                  errors.description
                    ? "border-red-400 focus:border-red-400"
                    : "border-gray-300 focus:border-indigo-500",
                ].join(" ")}
                {...register("description")}
              />
              <FieldError errors={errors.description ? [errors.description] : undefined} />
            </Field>

            {/* 価格 */}
            <Field data-invalid={errors.price ? true : undefined}>
              <FieldLabel htmlFor="price" className="text-sm font-medium text-gray-700">
                価格（円） <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                id="price"
                type="number"
                min={0}
                placeholder="例）1980"
                aria-invalid={errors.price ? true : undefined}
                {...register("price", { valueAsNumber: true })}
              />
              <p className="text-xs text-gray-400">
                ※ Stripe の仕様により整数のみ（¥0 以上）
              </p>
              <FieldError errors={errors.price ? [errors.price] : undefined} />
            </Field>

            {/* サムネイル画像 */}
            <FilePickerField
              id="image"
              label="サムネイル画像 *"
              accept="image/jpeg,image/png,image/webp"
              hint="JPEG / PNG / WebP — 最大 5 MB"
              icon={ImageIcon}
              file={imageFile}
              onChange={setImageFile}
              error={fileErrors.image}
            />

            {/* 販売ファイル */}
            <FilePickerField
              id="file"
              label="販売ファイル *"
              accept="application/pdf,application/zip,application/x-zip-compressed"
              hint="PDF / ZIP — 最大 50 MB"
              icon={FileText}
              file={productFile}
              onChange={setProductFile}
              error={fileErrors.file}
            />
          </FieldGroup>

          {/* API エラー */}
          {submitError && (
            <div
              role="alert"
              className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {submitError}
            </div>
          )}

          {/* ボタン */}
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/dashboard/products"
              className="flex h-10 items-center justify-center rounded-lg border border-gray-300 px-5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              キャンセル
            </Link>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  登録中...
                </>
              ) : (
                "登録する"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
