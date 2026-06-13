import { defineConfig } from "drizzle-kit"
import { setServers } from "dns"

// この PC の DNS リゾルバが IPv6 専用レコードを Node.js で解決できないため
// Google DNS を明示的に設定する
setServers(["8.8.8.8", "1.1.1.1"])

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST ?? "",
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? "",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "postgres",
    ssl: "require",
  },
  // Supabase の auth, storage 等のスキーマには触らない
  schemaFilter: ["public"],
  entities: {
    roles: {
      provider: "supabase",
    },
  },
})
