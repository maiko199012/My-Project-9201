"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { CheckCircle2, CircleDashed, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { sellerOnboardingKeys } from "@/lib/query-keys"

type OnboardingStatus = {
  hasAccount: boolean
  onboardingCompleted: boolean
  chargesEnabled: boolean
}

async function fetchStatus(): Promise<OnboardingStatus> {
  const res = await fetch("/api/seller/onboarding")
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? "状態の取得に失敗しました")
  }
  const json = (await res.json()) as { data: OnboardingStatus }
  return json.data
}

async function startOnboarding(): Promise<string> {
  const res = await fetch("/api/seller/onboarding", { method: "POST" })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? "手続きの開始に失敗しました")
  }
  const json = (await res.json()) as { data: { url: string } }
  return json.data.url
}

export default function SellerOnboardingPage() {
  return (
    <React.Suspense fallback={null}>
      <SellerOnboardingContent />
    </React.Suspense>
  )
}

function SellerOnboardingContent() {
  const searchParams = useSearchParams()
  const isReturning = searchParams.get("return") === "true"

  const { data: status, isLoading, error } = useQuery<OnboardingStatus>({
    queryKey: sellerOnboardingKeys.status(),
    queryFn: fetchStatus,
    retry: false,
  })

  const mutation = useMutation({
    mutationFn: startOnboarding,
    onSuccess: (url) => {
      window.location.href = url
    },
  })

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        売り手登録（Stripe Connect）
      </h1>

      <div className="max-w-xl rounded-xl border border-border bg-surface p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            確認中...
          </div>
        )}

        {!isLoading && error && (
          <p className="text-sm text-destructive">{(error as Error).message}</p>
        )}

        {!isLoading && status && (
          <div className="space-y-6">
            {status.chargesEnabled ? (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-500" aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground">売り手登録が完了しています</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    このアカウントで販売した商品の売上は、Stripe Connect 経由で受け取れます。
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <CircleDashed className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground">
                    {status.hasAccount
                      ? "登録手続きが完了していません"
                      : "まだ売り手登録をしていません"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    商品の売上を受け取るには、Stripe による本人確認・口座情報の登録が必要です。
                  </p>
                  {isReturning && (
                    <p className="mt-2 text-sm text-amber-600">
                      Stripe から戻ってきましたが、まだ手続きが完了していないようです。続きから再開できます。
                    </p>
                  )}
                </div>
              </div>
            )}

            {!status.chargesEnabled && (
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
              >
                {mutation.isPending
                  ? "処理中..."
                  : status.hasAccount
                    ? "手続きを再開する"
                    : "売り手登録する"}
              </Button>
            )}

            {mutation.isError && (
              <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
