import "server-only"

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "@/lib/db/schema"

declare global {
  // ホットリロードで接続が増殖しないようキャッシュ
  var __codenow_pg_client: ReturnType<typeof postgres> | undefined
}

const client =
  globalThis.__codenow_pg_client ??
  postgres(process.env.DATABASE_URL!, {
    prepare: false,
  })

if (process.env.NODE_ENV !== "production") {
  globalThis.__codenow_pg_client = client
}

export const db = drizzle(client, { schema })
export { schema }
