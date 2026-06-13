"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, Eye, EyeOff, Package, Loader2 } from "lucide-react"

import { productKeys } from "@/lib/query-keys"
import type { Product } from "@/lib/db/schema"

type ProductWithImageUrl = Product & { imageUrl: string | null }

// ─── データ取得 ────────────────────────────────────────────────────
async function fetchMyProducts(): Promise<ProductWithImageUrl[]> {
  const res = await fetch("/api/products")
  if (!res.ok) throw new Error("商品の取得に失敗しました")
  const json = (await res.json()) as { data: ProductWithImageUrl[] }
  return json.data
}

// ─── ページ ────────────────────────────────────────────────────────
export default function DashboardProductsPage() {
  const queryClient = useQueryClient()
  const [deleteError, setDeleteError] = React.useState<string | null>(null)
  const [toggleError, setToggleError] = React.useState<string | null>(null)

  const { data: products = [], isLoading, error } = useQuery<ProductWithImageUrl[]>({
    queryKey: productKeys.lists(),
    queryFn: fetchMyProducts,
  })

  // 公開/非公開の切り替え
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const res = await fetch(`/api/products/${id}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? "公開状態の更新に失敗しました")
      }
    },
    onSuccess: () => {
      setToggleError(null)
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
    onError: (err: Error) => setToggleError(err.message),
  })

  // 削除
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? "削除に失敗しました")
      }
    },
    onSuccess: () => {
      setDeleteError(null)
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
    onError: (err: Error) => setDeleteError(err.message),
  })

  function handleDelete(id: string) {
    const confirmed = window.confirm(
      "この商品を削除します。よろしいですか？この操作は取り消せません。",
    )
    if (!confirmed) return
    setDeleteError(null)
    deleteMutation.mutate(id)
  }

  function handleToggle(id: string, current: boolean) {
    setToggleError(null)
    toggleMutation.mutate({ id, isPublished: !current })
  }

  return (
    <div>
      {/* ページヘッダー */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">商品管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            登録した商品の公開・編集・削除ができます
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <Plus className="size-4" aria-hidden="true" />
          新規商品を登録する
        </Link>
      </div>

      {/* ローディング */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      )}

      {/* 取得エラー */}
      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {(error as Error).message}
        </div>
      )}

      {/* 公開切替エラー */}
      {toggleError && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {toggleError}
        </div>
      )}

      {/* 削除エラー */}
      {deleteError && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {deleteError}
        </div>
      )}

      {/* 空状態 */}
      {!isLoading && !error && products.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-20 text-center">
          <Package className="size-12 text-gray-300" aria-hidden="true" />
          <p className="mt-4 text-base font-medium text-gray-500">まだ商品がありません</p>
          <p className="mt-1 text-sm text-gray-400">
            最初の商品を登録して販売を始めましょう
          </p>
          <Link
            href="/dashboard/products/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <Plus className="size-4" aria-hidden="true" />
            商品を登録する
          </Link>
        </div>
      )}

      {/* 商品グリッド */}
      {!isLoading && products.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isToggling={toggleMutation.isPending && toggleMutation.variables?.id === product.id}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── 商品カード ───────────────────────────────────────────────────
function ProductCard({
  product,
  isToggling,
  onToggle,
  onDelete,
}: {
  product: ProductWithImageUrl
  isToggling: boolean
  onToggle: (id: string, current: boolean) => void
  onDelete: (id: string) => void
}) {
  const { imageUrl } = product

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* サムネイル */}
      <div className="relative aspect-video bg-indigo-50">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={product.title}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Package className="size-10 text-indigo-200" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* 本文 */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="line-clamp-2 text-base font-semibold text-gray-900">
          {product.title}
        </p>
        <p className="text-lg font-bold text-gray-900">
          ¥{product.price.toLocaleString()}
        </p>

        {/* 公開状態ラベル + トグルボタン */}
        <div className="flex items-center gap-2">
          <span
            className={[
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              product.isPublished
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500",
            ].join(" ")}
          >
            {product.isPublished ? "公開中" : "非公開"}
          </span>
          <button
            type="button"
            disabled={isToggling}
            onClick={() => onToggle(product.id, product.isPublished)}
            className={[
              "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-50",
              product.isPublished
                ? "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                : "text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700",
            ].join(" ")}
          >
            {isToggling ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : product.isPublished ? (
              <EyeOff className="size-3.5" aria-hidden="true" />
            ) : (
              <Eye className="size-3.5" aria-hidden="true" />
            )}
            {product.isPublished ? "非公開にする" : "公開する"}
          </button>
        </div>

        <div className="mt-auto flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
          {/* 編集 */}
          <Link
            href={`/dashboard/products/${product.id}/edit`}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            編集
          </Link>
          {/* 削除 */}
          <button
            type="button"
            onClick={() => onDelete(product.id)}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            削除
          </button>
        </div>
      </div>
    </div>
  )
}
