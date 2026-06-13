# DB 設計の型

DB は Supabase Postgres + Drizzle ORM を前提にする。

## 原則

- スキーマ定義は `src/lib/db/schema.ts` に集約する
- 変更は migration として残す
- 本番相当の変更は `pnpm db:migrate` を使う
- 開発中の素振り以外で `db:push` に依存しない

テンプレート固有の手順は `README.md` を参照。
