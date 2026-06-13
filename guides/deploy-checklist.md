# デプロイ前チェックリスト

本番デプロイ前に確認する項目。

- `.env.local.example` と本番環境変数の差分を確認する
- Supabase の URL と Publishable key が本番プロジェクトを指している
- `DATABASE_URL` が本番 DB を指している
- migration が本番 DB に適用済み
- OAuth のリダイレクト URL に本番 URL を追加済み
- `pnpm lint` が通る
- `pnpm exec tsc --noEmit` が通る
- `pnpm build` が通る
