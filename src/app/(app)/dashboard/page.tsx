"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  ChevronRight,
  CreditCard,
  Database,
  LayoutGrid,
  Rocket,
  TrendingUp,
  User,
} from "lucide-react"

import { profileKeys } from "@/lib/query-keys"

type MeResponse = {
  data: {
    id: string
    email: string
    createdAt: string
  }
}

async function fetchMe(): Promise<MeResponse["data"]> {
  const res = await fetch("/api/me")
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: unknown }
    throw new Error(
      typeof body.error === "string"
        ? body.error
        : "プロフィールを取得できませんでした",
    )
  }
  const json = (await res.json()) as MeResponse
  return json.data
}

function formatJaDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: profileKeys.detail(),
    queryFn: fetchMe,
  })

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        ダッシュボード
      </h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* プロフィールカード */}
        <section className="relative overflow-hidden rounded-xl border border-border bg-surface p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)] md:col-span-4">
          <div
            aria-hidden="true"
            className="absolute -top-px right-0 size-32 rounded-bl-full bg-brand/5"
          />

          <div className="relative flex items-center gap-2">
            <User className="size-4 text-foreground" aria-hidden="true" />
            <h2 className="text-xl font-medium tracking-tight text-foreground">
              プロフィール
            </h2>
          </div>

          <dl className="relative mt-6 space-y-4 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.6px] text-[#454652]">
                メール
              </dt>
              <dd className="mt-0.5 break-all text-foreground">
                {isLoading ? (
                  <Skeleton className="h-5 w-40" />
                ) : error ? (
                  <span className="text-destructive">エラー</span>
                ) : (
                  data?.email
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.6px] text-[#454652]">
                ユーザーID
              </dt>
              <dd className="mt-1 inline-block">
                {isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : data ? (
                  <code className="inline-block rounded bg-brand-soft px-2 py-0.5 font-mono text-sm text-foreground">
                    {shortId(data.id)}
                  </code>
                ) : (
                  <span className="text-destructive">エラー</span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.6px] text-[#454652]">
                登録日
              </dt>
              <dd className="mt-0.5 text-foreground">
                {isLoading ? (
                  <Skeleton className="h-5 w-28" />
                ) : data ? (
                  formatJaDate(data.createdAt)
                ) : (
                  <span className="text-destructive">エラー</span>
                )}
              </dd>
            </div>
          </dl>

          {error && (
            <p className="relative mt-4 text-xs text-destructive">
              {(error as Error).message}
            </p>
          )}
        </section>

        {/* 次にやること */}
        <section className="md:col-span-8">
          <div className="flex items-center gap-2 px-1">
            <Rocket className="size-5 text-foreground" aria-hidden="true" />
            <h2 className="text-xl font-medium tracking-tight text-foreground">
              次にやること
            </h2>
          </div>

          <ul className="mt-4 space-y-4">
            <NextStepCard
              href="/dashboard/sales"
              icon={<TrendingUp className="size-[20px]" aria-hidden="true" />}
              title="売上ダッシュボードを見る"
              description="商品ごとの販売数・売上金額と、最近の販売履歴を確認できます"
            />
            <NextStepCard
              href="/seller/onboarding"
              icon={<CreditCard className="size-[20px]" aria-hidden="true" />}
              title="売り手登録する（Stripe Connect）"
              description="商品の売上を受け取るには本人確認・口座情報の登録が必要です"
            />
            <NextStepCard
              icon={<LayoutGrid className="size-[22px]" aria-hidden="true" />}
              title="最初の API ルートを作る"
              description="src/app/api/hello/route.ts を編集してみましょう"
            />
            <NextStepCard
              icon={<Database className="size-[18px]" aria-hidden="true" />}
              title="Drizzle で新テーブルを追加"
              description="スキーマを定義してデータベースを拡張します"
            />
            <NextStepCard
              icon={<LayoutGrid className="size-[19px]" aria-hidden="true" />}
              title="shadcn コンポーネントを追加"
              code="npx shadcn@latest add button"
            />
          </ul>
        </section>
      </div>
    </div>
  )
}

type NextStepCardProps = {
  icon: React.ReactNode
  title: string
  description?: string
  code?: string
  href?: string
}

function NextStepCard({ icon, title, description, code, href }: NextStepCardProps) {
  const content = (
    <>
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-medium tracking-tight text-foreground sm:text-xl">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-sm leading-relaxed text-[#454652]">
            {description}
          </p>
        )}
        {code && (
          <code className="mt-1 inline-block rounded border border-border/50 bg-brand-soft px-2 py-1 font-mono text-sm text-[#454652]">
            {code}
          </code>
        )}
      </div>

      <ChevronRight
        className="size-4 shrink-0 text-[#454652]"
        aria-hidden="true"
      />
    </>
  )

  const className =
    "relative flex items-center gap-4 rounded-xl border border-border bg-surface p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:bg-muted/40"

  return (
    <li>
      {href ? (
        <Link href={href} className={className}>
          {content}
        </Link>
      ) : (
        <div className={className}>{content}</div>
      )}
    </li>
  )
}

function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-pulse rounded bg-muted ${className ?? ""}`}
    />
  )
}
