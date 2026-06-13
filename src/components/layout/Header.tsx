"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { LogOut } from "lucide-react"

import { CodeNowLogo } from "@/components/brand/CodeNowLogo"
import { createClient } from "@/lib/supabase/client"

type HeaderProps = {
  email?: string | null
}

export function Header({ email }: HeaderProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isPending, setIsPending] = React.useState(false)

  async function handleLogout() {
    setIsPending(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    queryClient.clear()
    router.push("/login")
    router.refresh()
  }

  const initial = email?.trim().charAt(0).toUpperCase() ?? "U"

  return (
    <header className="border-b border-border bg-surface shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4 sm:px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 sm:gap-4"
        >
          <CodeNowLogo size={32} className="rounded-md" />
          <span className="text-lg font-semibold tracking-tight text-brand sm:text-xl">
            CodeNow Next App
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          {email ? (
            <>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isPending}
                aria-label="ログアウト"
                className="inline-flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 sm:size-10"
              >
                <LogOut className="size-[18px]" aria-hidden="true" />
              </button>
              <div
                aria-hidden="true"
                className="flex size-8 items-center justify-center rounded-full border border-border bg-[#dce2f3] text-xs font-semibold text-[#24389c]"
              >
                {initial}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
