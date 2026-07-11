"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Package } from "lucide-react"

import { publicProductKeys } from "@/lib/query-keys"
import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"
import type { PublicProduct } from "@/app/api/public/products/route"

// ─── データ取得 ────────────────────────────────────────────────────
async function fetchPublicProducts(): Promise<PublicProduct[]> {
  const res = await fetch("/api/public/products")
  if (!res.ok) throw new Error("商品の取得に失敗しました")
  const json = (await res.json()) as { data: PublicProduct[] }
  return json.data
}

// ─── ページ ────────────────────────────────────────────────────────
export default function ProductsPage() {
  const { data: products = [], isLoading, error } = useQuery<PublicProduct[]>({
    queryKey: publicProductKeys.lists(),
    queryFn: fetchPublicProducts,
  })

  return (
    <div className="flex min-h-full flex-col">
      <Header />

      <main className="flex-1 bg-white px-4 py-12">
        <div className="mx-auto max-w-5xl">
          {/* ページヘッダー */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">商品一覧</h1>
            <p className="mt-1 text-sm text-gray-500">
              すべての公開商品を表示しています
            </p>
          </div>

          {/* ローディング */}
          {isLoading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          )}

          {/* エラー */}
          {error && (
            <p className="text-sm text-red-600">{(error as Error).message}</p>
          )}

          {/* 空状態 */}
          {!isLoading && !error && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Package className="size-12 text-gray-300" aria-hidden="true" />
              <p className="mt-4 text-sm text-gray-400">まだ商品がありません</p>
            </div>
          )}

          {/* 商品グリッド */}
          {!isLoading && products.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

// ─── 商品カード ────────────────────────────────────────────────────
function ProductCard({ product }: { product: PublicProduct }) {
  const excerpt = product.description
    ? product.description.length > 50
      ? product.description.slice(0, 50) + "…"
      : product.description
    : null

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* サムネイル */}
      <div className="relative aspect-video bg-indigo-50">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.title}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Package className="size-10 text-indigo-200" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* カード本文 */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="line-clamp-2 text-base font-semibold text-gray-900 transition-colors group-hover:text-indigo-600">
          {product.title}
        </p>

        {excerpt && (
          <p className="line-clamp-2 text-sm text-gray-500">{excerpt}</p>
        )}

        <div className="mt-auto pt-3">
          <span className="text-lg font-bold text-gray-900">
            ¥{product.price.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  )
}
