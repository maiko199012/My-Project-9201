"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { CodeNowLogo } from "@/components/brand/CodeNowLogo"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [isPending, setIsPending] = React.useState(false)

  async function handleGoogleLogin() {
    setSubmitError(null)
    setIsPending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setIsPending(false)
      setSubmitError(error.message)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-8 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col items-center">
        <CodeNowLogo size={40} className="rounded-xl" />

        <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight text-foreground">
          CodeNow へようこそ
        </h1>

        <p className="mt-2 max-w-[280px] text-center text-sm leading-relaxed text-muted-foreground">
          プロ品質の Next.js スターターで、あなたのプロダクト開発を今すぐ始めましょう。
        </p>

        {submitError && (
          <div
            role="alert"
            className="mt-5 w-full rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"
          >
            {submitError}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isPending}
          className="mt-6 flex h-[54px] w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-6 text-sm font-medium tracking-[0.26px] text-foreground shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              リダイレクト中...
            </>
          ) : (
            <>
              <GoogleIcon />
              Google でログイン
            </>
          )}
        </button>

        <p className="mt-6 text-center text-xs leading-[1.4] tracking-[0.24px] text-muted-foreground">
          ログインすることで、利用規約とプライバシーポリシーに同意したものとみなされます。
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
    >
      <path
        fill="#4285F4"
        d="M22.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2-1.9 3.4-4.7 3.4-7.9z"
      />
      <path
        fill="#34A853"
        d="M12 23c3 0 5.5-1 7.3-2.8l-3.5-2.7c-1 .7-2.2 1-3.8 1a6.6 6.6 0 0 1-6.2-4.5H2.2v2.8A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.8 14a6.7 6.7 0 0 1 0-4.2V7H2.2a11 11 0 0 0 0 10l3.6-3z"
      />
      <path
        fill="#EA4335"
        d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A10.5 10.5 0 0 0 12 1 11 11 0 0 0 2.2 7.8l3.6 2.8A6.6 6.6 0 0 1 12 5.4z"
      />
    </svg>
  )
}
