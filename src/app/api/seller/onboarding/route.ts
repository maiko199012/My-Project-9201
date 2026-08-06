import { eq } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"
import Stripe from "stripe"

import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

function stripeErrorMessage(err: unknown): string {
  if (err instanceof Stripe.errors.StripeError) {
    return err.message
  }
  return "Stripe との通信に失敗しました"
}

// ─── GET /api/seller/onboarding ───────────────────────────────────
// Connect オンボーディングの現在の状態を返す。Stripe に account があれば
// 最新の details_submitted / charges_enabled を取得して DB に同期する。

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 })
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)

  if (!profile) {
    return NextResponse.json({ error: "プロフィールが見つかりません" }, { status: 404 })
  }

  if (!profile.stripeConnectAccountId) {
    return NextResponse.json({
      data: { hasAccount: false, onboardingCompleted: false, chargesEnabled: false },
    })
  }

  try {
    const account = await stripe.accounts.retrieve(profile.stripeConnectAccountId)
    const onboardingCompleted = !!account.details_submitted
    const chargesEnabled = !!account.charges_enabled

    await db
      .update(profiles)
      .set({
        stripeOnboardingCompleted: onboardingCompleted,
        stripeChargesEnabled: chargesEnabled,
      })
      .where(eq(profiles.id, user.id))

    return NextResponse.json({
      data: { hasAccount: true, onboardingCompleted, chargesEnabled },
    })
  } catch (err) {
    console.error("[GET /api/seller/onboarding] failed to sync account status:", err)
    return NextResponse.json({ error: stripeErrorMessage(err) }, { status: 500 })
  }
}

// ─── POST /api/seller/onboarding ──────────────────────────────────
// Connect Express アカウントを（未作成なら）作成し、Account Link を発行する。

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 })
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)

  if (!profile) {
    return NextResponse.json({ error: "プロフィールが見つかりません" }, { status: 404 })
  }

  let accountId = profile.stripeConnectAccountId

  try {
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })
      accountId = account.id

      await db
        .update(profiles)
        .set({ stripeConnectAccountId: accountId })
        .where(eq(profiles.id, user.id))
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${siteUrl}/seller/onboarding?refresh=true`,
      return_url: `${siteUrl}/seller/onboarding?return=true`,
      type: "account_onboarding",
    })

    return NextResponse.json({ data: { url: accountLink.url } })
  } catch (err) {
    console.error("[POST /api/seller/onboarding] failed to start onboarding:", err)
    return NextResponse.json({ error: stripeErrorMessage(err) }, { status: 500 })
  }
}
