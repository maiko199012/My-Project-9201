"use client"

import { useQuery } from "@tanstack/react-query"
import { CircleDollarSign, Package, ReceiptText, TrendingUp } from "lucide-react"

import { salesKeys } from "@/lib/query-keys"

type SalesSummary = {
  totalAmount: number
  totalCount: number
  byProduct: Array<{
    productId: string
    title: string
    count: number
    amount: number
  }>
  recent: Array<{
    id: string
    productTitle: string
    amount: number
    createdAt: string
  }>
}

async function fetchSales(): Promise<SalesSummary> {
  const res = await fetch("/api/sales")
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? "売上データの取得に失敗しました")
  }
  const json = (await res.json()) as { data: SalesSummary }
  return json.data
}

function formatYen(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`
}

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export default function SalesDashboardPage() {
  const { data, isLoading, error } = useQuery<SalesSummary>({
    queryKey: salesKeys.summary(),
    queryFn: fetchSales,
  })

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        売上ダッシュボード
      </h1>

      {isLoading && <p className="text-sm text-muted-foreground">読み込み中...</p>}

      {!isLoading && error && (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      )}

      {!isLoading && data && (
        <>
          {/* 統計カード */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              icon={<CircleDollarSign className="size-5" aria-hidden="true" />}
              label="売上合計金額"
              value={formatYen(data.totalAmount)}
            />
            <StatCard
              icon={<ReceiptText className="size-5" aria-hidden="true" />}
              label="販売件数合計"
              value={`${data.totalCount.toLocaleString("ja-JP")} 件`}
            />
          </div>

          {/* 商品ごとの売上 */}
          <section>
            <div className="flex items-center gap-2 px-1">
              <Package className="size-5 text-foreground" aria-hidden="true" />
              <h2 className="text-xl font-medium tracking-tight text-foreground">
                商品ごとの売上
              </h2>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              {data.byProduct.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">まだ商品がありません</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-medium uppercase tracking-[0.6px] text-[#454652]">
                      <th className="px-6 py-3">商品名</th>
                      <th className="px-6 py-3 text-right">販売数</th>
                      <th className="px-6 py-3 text-right">売上金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byProduct.map((p) => (
                      <tr key={p.productId} className="border-b border-border last:border-0">
                        <td className="px-6 py-3 text-foreground">{p.title}</td>
                        <td className="px-6 py-3 text-right text-foreground">
                          {p.count.toLocaleString("ja-JP")} 件
                        </td>
                        <td className="px-6 py-3 text-right font-medium text-foreground">
                          {formatYen(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* 最近の販売 */}
          <section>
            <div className="flex items-center gap-2 px-1">
              <TrendingUp className="size-5 text-foreground" aria-hidden="true" />
              <h2 className="text-xl font-medium tracking-tight text-foreground">
                最近の販売
              </h2>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              {data.recent.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">まだ販売がありません</p>
              ) : (
                <ul>
                  {data.recent.map((sale) => (
                    <li
                      key={sale.id}
                      className="flex items-center justify-between gap-4 border-b border-border px-6 py-3 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {sale.productTitle}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDateTime(sale.createdAt)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-medium text-foreground">
                        {formatYen(sale.amount)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div
        aria-hidden="true"
        className="absolute -top-px right-0 size-24 rounded-bl-full bg-brand/5"
      />
      <div className="relative flex items-center gap-2 text-brand">{icon}</div>
      <p className="relative mt-3 text-xs font-medium uppercase tracking-[0.6px] text-[#454652]">
        {label}
      </p>
      <p className="relative mt-1 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  )
}
