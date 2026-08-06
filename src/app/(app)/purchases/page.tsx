"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Download, Package, ShoppingBag } from "lucide-react"

import { purchaseKeys } from "@/lib/query-keys"
import type { MyPurchase } from "@/app/api/purchases/route"

// ─── データ取得 ────────────────────────────────────────────────────
async function fetchMyPurchases(): Promise<MyPurchase[]> {
  const res = await fetch("/api/purchases")
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? "購入履歴の取得に失敗しました")
  }
  const json = (await res.json()) as { data: MyPurchase[] }
  return json.data
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

// ─── ページ ────────────────────────────────────────────────────────
export default function PurchasesPage() {
  const { data: purchases = [], isLoading, error } = useQuery<MyPurchase[]>({
    queryKey: purchaseKeys.lists(),
    queryFn: fetchMyPurchases,
  })

  return (
    <div>
      {/* ページヘッダー */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">マイページ</h1>
          <p className="mt-1 text-sm text-gray-500">購入した商品の一覧です</p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ShoppingBag className="size-4" aria-hidden="true" />
          商品一覧を見る
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

      {/* エラー */}
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {(error as Error).message}
        </div>
      )}

      {/* 空状態 */}
      {!isLoading && !error && purchases.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-20 text-center">
          <Package className="size-12 text-gray-300" aria-hidden="true" />
          <p className="mt-4 text-base font-medium text-gray-500">
            まだ購入した商品はありません
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <ShoppingBag className="size-4" aria-hidden="true" />
            商品を探す
          </Link>
        </div>
      )}

      {/* 購入済み商品グリッド */}
      {!isLoading && purchases.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {purchases.map((purchase) => (
            <PurchaseCard key={purchase.id} purchase={purchase} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── 購入商品カード ───────────────────────────────────────────────
function PurchaseCard({ purchase }: { purchase: MyPurchase }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* サムネイル */}
      <div className="relative aspect-video bg-indigo-50">
        {purchase.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={purchase.imageUrl}
            alt={purchase.title}
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
          {purchase.title}
        </p>
        <p className="text-sm text-gray-500">{formatDate(purchase.createdAt)}</p>
        <p className="text-lg font-bold text-gray-900">
          ¥{purchase.amount.toLocaleString("ja-JP")}
        </p>

        <a
          href={`/api/downloads/${purchase.productId}`}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <Download className="size-4" aria-hidden="true" />
          ダウンロード
        </a>
      </div>
    </div>
  )
}
