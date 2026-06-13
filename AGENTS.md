<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# create-codenow-next-app — AI 実装規約

AI(Claude Code 等)がコードを書くときの**絶対ルール**。受講生はノンコーダーが多いため、勝手に技術スタックや構造を変えないこと。**応答は常に日本語**で行うこと。

---

## セットアップ / コマンド

clone 直後はルートで作業する。

```bash
pnpm install
cp .env.local.example .env.local  # 値を埋める
pnpm dev
pnpm build
pnpm lint
pnpm exec tsc --noEmit
```

DB 操作:

```bash
pnpm db:generate   # schema.ts の差分から SQL migration を生成
pnpm db:migrate    # 未適用 migration を流す。本番運用はこちら
pnpm db:push       # 開発の素振り用。履歴を残さず直接反映
pnpm db:studio     # Drizzle Studio
```

## 技術スタック(固定)

- Next.js 16 (App Router) / TypeScript / pnpm / `src/` 配置
- Supabase Auth (`@supabase/ssr` + `@supabase/supabase-js`) — **認証専用**(Google OAuth のみ)
- **Drizzle ORM** + `postgres` ドライバ — DB クエリ・スキーマ・マイグレーションすべて
- Tailwind CSS + shadcn/ui (`base-nova` プリセット / base-ui ベース)
  - 使用コンポーネント: Button, Card, Field, Input, Label, Separator
- TanStack Query v5
- React Hook Form + Zod

**入れてはいけないもの:** Zustand/Jotai 等の状態管理、Prisma 等の他 ORM、SWR、Zod 以外のバリデーション、指定外の shadcn コンポーネント (Dialog, Toast, Select, Dropdown 等)。

## アーキテクチャ鉄則

### 3層構造

```
Client Component (UI + useQuery/useMutation)
    ↓ fetch
API Handler (src/app/api/*/route.ts)
    ↓ Drizzle (DB) + Supabase Auth (認証)
Postgres (Supabase)
```

### 禁止事項

- ❌ **Server Actions 禁止** (`"use server"`、`<form action={fn}>` の Server Action 渡しも)
- ❌ **Client Component から Supabase 直接呼出禁止**
  - 例外: `(auth)/login`(`signInWithOAuth`)、`Header.tsx`(`signOut`)のみ
- ❌ **API handler から `supabase.from(...)` 禁止** — DB は Drizzle、Supabase SDK は `auth.*` のみ
- ❌ **Client から DB 直接アクセス禁止**
- ❌ **ユーザー所有データを扱うテーブル**の `owner_id`(または `user_id`)を body から受けない — 必ずサーバー側 `user.id` を使う(該当テーブルが未定義なら適用なし。命名は `owner_id` で統一)

このスターターは **RLS を使わない**。DB は `DATABASE_URL` でサーバー側から直接接続するため、認可の主責任は API Handler にある。すべてのユーザー所有データの SELECT/UPDATE/DELETE は、必ず `supabase.auth.getUser()` の `user.id` を Drizzle の `where(...)` 条件に含めること。

### anon / authenticated は PostgREST から `public` を触れない

マイグレーション `0001_lock_down_public.sql` で **`anon`/`authenticated` から `public` の USAGE/全権限を REVOKE**(新規テーブルもデフォルト非公開)。`/auth/v1/*` は anon キーで使えるが `/rest/v1/*` は完全に閉じている。RLS policy / GRANT を勝手に書き戻して anon を露出させないこと。

ESLint で `"use server"` と `@/lib/supabase/client` 直接 import は機械的に検出される。警告が出たら設計から見直す。

## 認証フロー

```
/login (Client) → signInWithOAuth({ provider: "google" })
   → Google 同意画面 → ?code=... で /api/auth/callback へ
   → exchangeCodeForSession(code) → profiles を upsert
   → /dashboard (Server Component layout が getUser() で認可)
```

- ログインは `(auth)/login/page.tsx` の **Google ボタン1個**のみ。フォーム/Zod/RHF は使わない
- profile 行は `/api/auth/callback` で必ず upsert する。**DB トリガーは使わない**
- ログアウトは `Header.tsx` の `signOut()` → `queryClient.clear()` → `/login` redirect

## API Handler の書き方

1. 最初に `supabase.auth.getUser()` で認証(未ログインなら 401)
2. 入力は **必ず Zod で検証**(GET はクエリ、POST/PATCH/PUT/DELETE はボディ)
3. バリデーション失敗 → 400 で `{ error: issues }`
4. その他エラー → 500 で `{ error: message }`
5. レスポンスは `{ data }` または `{ error }` で統一
6. (ユーザー所有データを扱う場合のみ)`owner_id` は body から受けず、サーバー側 `user.id` を使う

詳細な骨格は [`guides/implementation-patterns.md`](./guides/implementation-patterns.md) を参照。

## Client Component の書き方

- 取得は `useQuery({ queryKey, queryFn: fetch("/api/...") })`、変更は `useMutation` + `queryClient.invalidateQueries`
- フォームは base-nova 公式パターン: **`FieldGroup` → `Field` → `FieldLabel` + `Input` + `FieldError`**
  - `Form` / `FormField` は base-nova に存在しないので使わない
  - `Field` に `data-invalid`、コントロールに `aria-invalid` を付ける
  - RHF の `register` を `Input` にスプレッド、`errors` を `FieldError` の `errors` prop に渡す

詳細なフォーム骨格は [`guides/implementation-patterns.md`](./guides/implementation-patterns.md) を参照。
別のコントロールが必要な時は `pnpm dlx shadcn@latest add <name>` で追加し、同じ `Field` の中に入れる。

## Zod / Drizzle スキーマ規約

- **Zod**: コアスキーマは `src/lib/schemas/` に置き、フォームと API Handler の両方が import。フロント固有の検証は `.extend()` / `.refine()` で拡張
- **Drizzle**: `src/lib/db/schema.ts` に TypeScript で定義。**生 SQL を書かない**。`authUsers.id` を FK に使うときは `import { authUsers } from "drizzle-orm/supabase"`
- **テーブル設計の 2 パターン**:
  - **A) 1:1 関係**(現状の `profiles`): `id` を `authUsers.id` への FK にする。`owner_id` カラムは作らない
  - **B) ユーザー所有データ**(将来追加する `posts` / `tasks` 等): `owner_id` カラムを `authUsers.id` への FK にし、API Handler の `where(eq(table.ownerId, user.id))` で必ず認可
- **RLS policy は定義しない** — 認可は B パターンの API Handler の `where(...)` 条件で担保

### Migration

```bash
pnpm db:generate   # schema.ts から drizzle/000N_<name>.sql を自動生成
pnpm db:migrate    # DATABASE_URL に未適用の migration を流す
pnpm db:push       # 開発中だけ。履歴を残さず直接反映(本番では使わない)
```

トリガー関数・拡張機能等は `pnpm dlx drizzle-kit generate --custom --name <name>` で空 SQL を生成して手書き。トリガー関数は `security definer` + `set search_path = public` を必ず付ける。

## 触ってはいけないファイル

スターターの土台。バグ報告は受けるが勝手に書き換えない:

- `proxy.ts`, `drizzle.config.ts`, `eslint.config.mjs`
- `src/lib/supabase/{client,server,middleware}.ts`
- `src/lib/db/index.ts`
- `src/app/api/auth/callback/route.ts`(profile upsert 含む)
- `src/app/(auth)/login/page.tsx`(Google ボタンのみ。フォーム化しない)
- `src/components/layout/Providers.tsx`

## 新機能追加の手順

新リソース X を追加するときは必ずこの順序:

1. `src/lib/schemas/x.ts` に Zod スキーマ
2. `src/lib/db/schema.ts` に Drizzle テーブル
3. `pnpm db:generate` で migration 生成(トリガー等が必要なら間に `--custom` で手書き追加)
4. `pnpm db:migrate` で DATABASE_URL に反映(本番前にレビュー)
5. `src/app/api/x/route.ts`(認証は Supabase SDK、DB は Drizzle)
6. `src/app/(app)/x/page.tsx` で `useQuery` / `useMutation`

関連ガイド: [`guides/auth.md`](./guides/auth.md), [`guides/database.md`](./guides/database.md), [`guides/deploy-checklist.md`](./guides/deploy-checklist.md), [`guides/pr-workflow.md`](./guides/pr-workflow.md), [`guides/implementation-patterns.md`](./guides/implementation-patterns.md)。

## 受講生向け

- 専門用語は短く解説してから使う / エラーメッセージは日本語
- 「動かない」と言われたら、まず `.env.local` とブラウザのコンソールを確認
