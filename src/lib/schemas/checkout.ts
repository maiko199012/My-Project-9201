import { z } from "zod"

export const createCheckoutSchema = z.object({
  productId: z.string().uuid("商品IDが不正です"),
})

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>
