"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, CheckCircle2, Download, Loader2 } from "lucide-react"

import { publicProductKeys, purchaseKeys } from "@/lib/query-keys"
import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"
import type { PublicProduct } from "@/app/api/public/products/route"

type PurchaseStatus = { purchased: boolean }

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

async function fetchPurchaseStatus(productId: string): Promise<PurchaseStatus> {
  const res = await fetch(`/api/purchases/${productId}`)
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw Object.assign(new Error(body.error ?? "購入状況の確認に失敗しました"), {
      status: res.status,
    })
  }
  const json = (await res.json()) as { data: PurchaseStatus }
  return json.data
}

// ─── ページ ────────────────────────────────────────────────────────
export default function PurchaseSuccessPage() {
  return (
    <React.Suspense fallback={null}>
      <PurchaseSuccessContent />
    </React.Suspense>
  )
}

function PurchaseSuccessContent() {
  const { id } = useParams<{ id: string }>()
  // Stripe の success_url からのクエリ（{CHECKOUT_SESSION_ID}）。
  // 認可には使わず、purchases テーブルの確認のみを正とする。
  useSearchParams()

  const { data: product } = useQuery<PublicProduct>({
    queryKey: publicProductKeys.detail(id),
    queryFn: () => fetchPublicProduct(id),
    retry: false,
  })

  const {
    data: status,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<PurchaseStatus>({
    queryKey: purchaseKeys.status(id),
    queryFn: () => fetchPurchaseStatus(id),
    retry: false,
    // Webhook 反映前は purchased: false が返るので、反映されるまで自動で再確認する。
    refetchInterval: (query) => (query.state.data?.purchased ? false : 3000),
  })

  const is401 = (error as (Error & { status?: number }) | null)?.status === 401

  return (
    <div className="flex min-h-full flex-col">
      <Header />

      <main className="flex-1 bg-white px-4 py-12">
        <div className="mx-auto max-w-lg text-center">
          <Link
            href={`/products/${id}`}
            className="mb-8 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 hover:underline underline-offset-4"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            商品ページに戻る
          </Link>

          {isLoading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="size-8 animate-spin text-indigo-400" aria-hidden="true" />
            </div>
          )}

          {!isLoading && is401 && (
            <div className="py-12">
              <p className="text-sm text-gray-600">購入状況の確認にはログインが必要です</p>
              <Link
                href="/login"
                className="mt-4 inline-block text-sm text-indigo-600 hover:underline underline-offset-4"
              >
                ログインする
              </Link>
            </div>
          )}

          {!isLoading && error && !is401 && (
            <p className="py-12 text-sm text-red-600">{(error as Error).message}</p>
          )}

          {!isLoading && status && !status.purchased && (
            <div className="py-12">
              <Loader2 className="mx-auto size-8 animate-spin text-indigo-400" aria-hidden="true" />
              <p className="mt-4 text-sm text-gray-600">
                決済確認中です。しばらくお待ちください…
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="mt-4 text-sm text-indigo-600 hover:underline underline-offset-4 disabled:opacity-60"
              >
                今すぐ確認する
              </button>
            </div>
          )}

          {!isLoading && status?.purchased && (
            <div className="py-12">
              <CheckCircle2 className="mx-auto size-12 text-green-500" aria-hidden="true" />
              <p className="mt-4 text-lg font-semibold text-gray-900">
                購入ありがとうございました
              </p>
              {product && <p className="mt-1 text-sm text-gray-600">{product.title}</p>}
              <a
                href={`/api/downloads/${id}`}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                <Download className="size-4" aria-hidden="true" />
                ダウンロード
              </a>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
