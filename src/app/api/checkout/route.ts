import { and, eq } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"

import { db } from "@/lib/db"
import { orders, products, profiles } from "@/lib/db/schema"
import { createCheckoutSchema } from "@/lib/schemas/checkout"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

// プラットフォーム手数料(売上に対する割合)。今はテストのため無料。
// 導入する場合はここを変更する(例: 10 で 10%)。
const PLATFORM_FEE_PERCENT = 0

// ─── POST /api/checkout ───────────────────────────────────────────
// purchases に buyerId を記録するためログイン必須。公開済み商品の Stripe Checkout Session を作成する。
// Stripe Connect のデスティネーション支払いとして、売り手の Connect アカウントに送金する。

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "購入にはログインが必要です" }, { status: 401 })
  }

  const parsed = createCheckoutSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }
  const { productId } = parsed.data

  const [row] = await db
    .select({
      product: products,
      sellerConnectAccountId: profiles.stripeConnectAccountId,
      sellerChargesEnabled: profiles.stripeChargesEnabled,
    })
    .from(products)
    .innerJoin(profiles, eq(profiles.id, products.userId))
    .where(and(eq(products.id, productId), eq(products.isPublished, true)))
    .limit(1)

  if (!row) {
    return NextResponse.json({ error: "商品が見つかりません" }, { status: 404 })
  }
  const { product, sellerConnectAccountId, sellerChargesEnabled } = row

  if (!sellerConnectAccountId || !sellerChargesEnabled) {
    return NextResponse.json(
      { error: "この商品の売り手は決済を受け付ける準備が完了していません" },
      { status: 400 },
    )
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin
  const applicationFeeAmount = Math.round((product.price * PLATFORM_FEE_PERCENT) / 100)

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "jpy",
          product_data: { name: product.title },
          unit_amount: product.price,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: applicationFeeAmount,
      transfer_data: { destination: sellerConnectAccountId },
    },
    success_url: `${siteUrl}/products/${product.id}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/products/${product.id}?purchase=cancelled`,
    metadata: {
      productId: product.id,
      userId: user.id,
      ...(product.stripePriceId ? { stripePriceId: product.stripePriceId } : {}),
    },
  })

  if (!session.url) {
    return NextResponse.json({ error: "決済セッションの作成に失敗しました" }, { status: 500 })
  }

  await db.insert(orders).values({
    productId: product.id,
    amount: product.price,
    status: "pending",
    stripeSessionId: session.id,
  })

  return NextResponse.json({ data: { url: session.url } }, { status: 201 })
}
