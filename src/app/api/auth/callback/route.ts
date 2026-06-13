import { NextResponse, type NextRequest } from "next/server"

import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const nextParam = searchParams.get("next")
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/dashboard"

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    )
  }

  // profile を必ず存在させる(初回 OAuth 時 / メールが変わった場合の更新)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user?.email) {
    await db
      .insert(profiles)
      .values({ id: user.id, email: user.email })
      .onConflictDoUpdate({
        target: profiles.id,
        set: { email: user.email },
      })
  }

  return NextResponse.redirect(`${origin}${next}`)
}
