import "server-only"

import Stripe from "stripe"

declare global {
  // ホットリロードで client が増殖しないようキャッシュ
  var __codenow_stripe_client: Stripe | undefined
}

const client =
  globalThis.__codenow_stripe_client ??
  new Stripe(process.env.STRIPE_SECRET_KEY!)

if (process.env.NODE_ENV !== "production") {
  globalThis.__codenow_stripe_client = client
}

export const stripe = client
