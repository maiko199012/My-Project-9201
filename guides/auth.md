# 認証の型

Next.js スターターの認証は Supabase Auth の Google OAuth を前提にする。

## 原則

- 認証状態の確認はサーバー側で行う
- DB 操作は API Handler 経由に寄せる
- ユーザー単位のデータ取得では必ず `user.id` を条件に含める
- クライアントから Supabase を直接 DB 用途で呼ばない

詳細な実装規約は `AGENTS.md` を参照。
