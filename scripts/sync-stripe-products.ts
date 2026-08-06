import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import Stripe from "stripe"

import { products } from "../src/lib/db/schema.ts"

// ─── Supabase の products を Stripe の Product / Price として同期する ──────
// すでに stripeProductId / stripePriceId が入っている商品はスキップ（二重登録防止）。
// 実行: node --env-file=.env.local scripts/sync-stripe-products.ts

const client = postgres(process.env.DATABASE_URL!, { prepare: false })
const db = drizzle(client, { schema: { products } })
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

async function main() {
  const rows = await db.select().from(products)
  console.log(`products: ${rows.length} 件`)

  for (const product of rows) {
    if (product.stripeProductId && product.stripePriceId) {
      console.log(`  skip: "${product.title}" (同期済み: ${product.stripeProductId})`)
      continue
    }

    const stripeProduct = await stripe.products.create({
      name: product.title,
      description: product.description ?? undefined,
      metadata: { supabaseProductId: product.id },
    })

    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      currency: "jpy",
      unit_amount: product.price,
      metadata: { supabaseProductId: product.id },
    })

    await db
      .update(products)
      .set({
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePrice.id,
        updatedAt: new Date(),
      })
      .where(eq(products.id, product.id))

    console.log(`  created: "${product.title}" -> product=${stripeProduct.id} price=${stripePrice.id}`)
  }

  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
