import { and, eq } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"

import { db } from "@/lib/db"
import { orders, products } from "@/lib/db/schema"
import { createCheckoutSchema } from "@/lib/schemas/checkout"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

// ─── POST /api/checkout ───────────────────────────────────────────
// purchases に buyerId を記録するためログイン必須。公開済み商品の Stripe Checkout Session を作成する。

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

  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.isPublished, true)))
    .limit(1)

  if (!product) {
    return NextResponse.json({ error: "商品が見つかりません" }, { status: 404 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin

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
