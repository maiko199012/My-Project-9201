import { eq } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"
import type Stripe from "stripe"

import { db } from "@/lib/db"
import { orders, purchases } from "@/lib/db/schema"
import { stripe } from "@/lib/stripe"

// ─── purchases への記録 ────────────────────────────────────────────
// metadata（userId / productId / stripePriceId）が揃っている場合のみ記録する。
// stripeCheckoutSessionId に UNIQUE 制約があるため、同じ session の再送は
// onConflictDoNothing で無視され、重複保存されない（Webhook の冪等性）。

async function recordPurchase(session: Stripe.Checkout.Session) {
  const { userId, productId, stripePriceId } = session.metadata ?? {}

  if (!userId || !productId || !stripePriceId) {
    console.error(
      `[POST /api/stripe/webhook] checkout session ${session.id} is missing required metadata`,
      { userId, productId, stripePriceId },
    )
    return
  }

  try {
    await db
      .insert(purchases)
      .values({
        buyerId: userId,
        productId,
        amount: session.amount_total ?? 0,
        stripeCheckoutSessionId: session.id,
        stripePriceId,
      })
      .onConflictDoNothing({ target: purchases.stripeCheckoutSessionId })
  } catch (err) {
    console.error(`[POST /api/stripe/webhook] failed to record purchase for session ${session.id}:`, err)
  }
}

// ─── POST /api/stripe/webhook ─────────────────────────────────────
// Stripe からの Webhook を受信する。署名検証のため raw body を使う。

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "署名がありません" }, { status: 400 })
  }

  const body = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    console.error("[POST /api/stripe/webhook] signature verification failed:", err)
    return NextResponse.json({ error: "署名検証に失敗しました" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object

    await db
      .update(orders)
      .set({
        status: "paid",
        buyerEmail: session.customer_details?.email ?? null,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        updatedAt: new Date(),
      })
      .where(eq(orders.stripeSessionId, session.id))

    await recordPurchase(session)
  }

  return NextResponse.json({ data: { received: true } })
}
