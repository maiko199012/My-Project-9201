import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { authUsers } from "drizzle-orm/supabase"

export const ORDER_STATUSES = ["pending", "paid", "failed"] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
)

export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  imagePath: text("image_path"),
  filePath: text("file_path"),
  isPublished: boolean("is_published").notNull().default(false),
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  buyerEmail: text("buyer_email"),
  amount: integer("amount").notNull(),
  status: text("status", { enum: ORDER_STATUSES }).notNull().default("pending"),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert

export const purchases = pgTable("purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  buyerId: uuid("buyer_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  amount: integer("amount").notNull(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").notNull().unique(),
  stripePriceId: text("stripe_price_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Purchase = typeof purchases.$inferSelect
export type NewPurchase = typeof purchases.$inferInsert
