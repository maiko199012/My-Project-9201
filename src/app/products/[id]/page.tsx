"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ArrowLeft, Package, Loader2 } from "lucide-react"

import { publicProductKeys } from "@/lib/query-keys"
import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"
import type { PublicProduct } from "@/app/api/public/products/route"

// ─── データ取得 ────────────────────────────────────────────────────
async function fetchPublicProduct(id: string): Promise<PublicProduct> {
  const res = await fetch(`/api/public/products/${id}`)
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw Object.assign(new Error(body.error ?? "取得に失敗しました"), {
      status: res.status,
    })
  }
  const json = (await res.json()) as { data: PublicProduct }
  return json.data
}

async function createCheckoutSession(productId: string): Promise<string> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? "決済の開始に失敗しました")
  }
  const json = (await res.json()) as { data: { url: string } }
  return json.data.url
}

// ─── ページ ────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  return (
    <React.Suspense fallback={null}>
      <ProductDetailContent />
    </React.Suspense>
  )
}

function ProductDetailContent() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const purchaseStatus = searchParams.get("purchase")

  const { data: product, isLoading, error } = useQuery<PublicProduct>({
    queryKey: publicProductKeys.detail(id),
    queryFn: () => fetchPublicProduct(id),
    retry: false,
  })

  const checkoutMutation = useMutation({
    mutationFn: () => createCheckoutSession(id),
    onSuccess: (url) => {
      window.location.href = url
    },
  })

  const is404 = (error as (Error & { status?: number }) | null)?.status === 404

  return (
    <div className="flex min-h-full flex-col">
      <Header />

      <main className="flex-1 bg-white px-4 py-12">
        <div className="mx-auto max-w-5xl">
          {/* 一覧に戻るリンク */}
          <Link
            href="/products"
            className="mb-8 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 hover:underline underline-offset-4"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            一覧に戻る
          </Link>

          {/* ローディング */}
          {isLoading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="size-8 animate-spin text-indigo-400" aria-hidden="true" />
            </div>
          )}

          {/* 404 / エラー */}
          {!isLoading && error && (
            <div className="py-24 text-center">
              <Package className="mx-auto size-12 text-gray-300" aria-hidden="true" />
              <p className="mt-4 text-sm text-gray-500">
                {is404 ? "商品が見つかりません" : (error as Error).message}
              </p>
              <Link
                href="/products"
                className="mt-4 inline-block text-sm text-indigo-600 hover:underline underline-offset-4"
              >
                一覧に戻る
              </Link>
            </div>
          )}

          {/* 商品詳細 */}
          {!isLoading && product && (
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
              {/* 左: サムネイル */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-indigo-50">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center">
                    <Package className="size-20 text-indigo-200" aria-hidden="true" />
                  </div>
                )}
              </div>

              {/* 右: 商品情報 */}
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="text-2xl font-bold leading-snug text-gray-900">
                    {product.title}
                  </h1>
                </div>

                {/* 価格 */}
                <div className="border-t border-gray-100 pt-4">
                  <span className="text-3xl font-bold text-gray-900">
                    ¥{product.price.toLocaleString()}
                  </span>
                </div>

                {/* 購入ボタン */}
                <div className="flex flex-col gap-2">
                  {purchaseStatus === "cancelled" && (
                    <p className="rounded-md bg-gray-50 px-4 py-2 text-center text-sm text-gray-600">
                      決済がキャンセルされました
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => checkoutMutation.mutate()}
                    disabled={checkoutMutation.isPending}
                    className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {checkoutMutation.isPending ? "処理中..." : "購入する"}
                  </button>
                  {checkoutMutation.isError && (
                    <p className="text-center text-sm text-red-600">
                      {(checkoutMutation.error as Error).message}
                    </p>
                  )}
                  <p className="text-center text-xs text-gray-400">
                    購入後すぐにダウンロードできます
                  </p>
                </div>

                {/* 説明文 */}
                {product.description && (
                  <div className="border-t border-gray-100 pt-6">
                    <h2 className="mb-3 text-sm font-semibold text-gray-900">
                      商品の説明
                    </h2>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                      {product.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
