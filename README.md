# create-codenow-next-app

CodeNow の Next.js スターターキット。
**Google OAuth 認証**とダッシュボードがすぐに動く状態で揃っています。

この private リポジトリは、購入者が clone したあとに自分のアプリとして独立させて使う前提です。
破壊的変更を避けるため、既存アプリへスターター更新を `git pull` で取り込む運用は想定していません。
配布は購入者向けの private GitHub リポジトリ経由です。

## 自分のアプリとして始める

AI に初期設定を任せる場合は、`$init-setup` を使ってアプリ名・package 名・GitHub remote を設定できます。実行後、この初期設定 skill は自動で削除されます。

手動で進める場合は、まずこのリポジトリを任意のアプリ名で clone します。

```bash
git clone git@github.com:<owner>/create-codenow-next-app.git my-app
cd my-app
```

次にスターター側の Git 履歴を切り、自分のアプリとして初期化します。

```bash
rm -rf .git
git init
git add .
git commit -m "Initial commit from CodeNow Next App"
git branch -M main
```

GitHub に自分のリポジトリを作ったら、そこへ push します。

```bash
git remote add origin git@github.com:<your-name>/<your-app>.git
git push -u origin main
```

## 技術スタック

- Next.js 16(App Router / Turbopack)/ TypeScript
- Supabase Auth(`@supabase/ssr`) — **認証専用 / Google OAuth のみ**
- Drizzle ORM(`drizzle-orm` + `postgres`)+ `drizzle-kit` — DB スキーマ・クエリ・migration
- Tailwind CSS v4 + shadcn/ui(`base-nova` / base-ui ベース、`Button` `Card` `Field` `Input` `Label` `Separator`)
- TanStack Query v5
- React Hook Form + Zod(将来のフォーム用に同梱、認証では未使用)

## セットアップ

### 1. 依存インストール

```bash
pnpm install
```

### 2. Supabase プロジェクト作成 + 接続情報の取得

[Supabase Dashboard](https://supabase.com/dashboard) で新規プロジェクトを作成し、以下3つを控える:

| 取得元 | 値 |
| --- | --- |
| Project Settings → **API** | `Project URL` |
| Project Settings → **API** | `Publishable key`(新方式の anon key) |
| Project Settings → **Database** → Connection string | `postgresql://postgres.xxxx:<PASSWORD>@...supabase.com:5432/postgres` |

`<PASSWORD>` 部分は Supabase プロジェクト作成時に設定した DB パスワードに置き換える(忘れた場合は同画面で reset 可能)。

### 3. `.env.local` を作成

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
DATABASE_URL=postgresql://postgres.xxxx:...@db.xxxx.supabase.co:5432/postgres
```

### 4. DB に migration を適用

```bash
pnpm db:migrate
```

`drizzle/` 配下の SQL migration が `DATABASE_URL` に対して順番に流れる。
適用後、Supabase Dashboard → Table Editor で `profiles` テーブルが見える。

`db:migrate` で接続エラーが出る場合は、Supabase Dashboard の connection string で Direct connection または Session pooler を使う。Transaction pooler は runtime では使えるが、DDL を含む migration では環境によって失敗することがある。

### 5. Google OAuth プロバイダを有効化

Supabase Dashboard → **Authentication** → **Providers** → **Google** で:

1. Google を有効化
2. Google Cloud Console([console.cloud.google.com](https://console.cloud.google.com))で OAuth 2.0 クライアント ID を作成
   - 種類: **Web application**
   - 承認済みリダイレクト URI: Supabase の表示通りの `https://<your-ref>.supabase.co/auth/v1/callback`
3. 取得した **Client ID** と **Client Secret** を Supabase に貼り付けて保存

開発時、ブラウザがログイン後に戻ってくる先(`Site URL`)も同じ Authentication 画面で `http://localhost:3000` を許可しておく。

### 6. 開発サーバ起動

```bash
pnpm dev
```

## 動作確認

1. http://localhost:3000 → 自動で `/dashboard` → 未ログインなら `/login` にリダイレクト
2. `/login` の「Google でログイン」ボタンから Google OAuth で認証
3. `/api/auth/callback` でセッションが作られ、`profiles` 行が upsert される
4. `/dashboard` で自分のメールと User ID が表示される
5. ヘッダの「ログアウト」で `/login` に戻る

## DB スクリプト

| コマンド | 用途 |
| --- | --- |
| `pnpm db:generate` | `src/lib/db/schema.ts` の差分から SQL migration を生成 |
| `pnpm db:migrate`  | 未適用の migration を順次実行(本番運用はこちら) |
| `pnpm db:push`     | migration 履歴を残さずスキーマ直接反映(開発中の素振り用) |
| `pnpm db:studio`   | ローカルで Drizzle Studio を起動 |

## アーキテクチャ

```
Client Component (UI + useQuery/useMutation)
    ↓ fetch
API Handler (src/app/api/*/route.ts)
    ↓ Drizzle (DB クエリ) + Supabase Auth (認証確認)
Postgres (Supabase)
```

DB はサーバー側の API Handler だけが Drizzle 経由で操作する。RLS は使わず、認可は `supabase.auth.getUser()` で取得した `user.id` を API Handler のクエリ条件に必ず含めて担保する。

防御策として、migration `0001_lock_down_public.sql` で **anon / authenticated ロールから `public` スキーマの権限を完全 REVOKE** している([Supabase: Securing your API](https://supabase.com/docs/guides/api/securing-your-api))。これにより anon キーが漏洩しても PostgREST 経由ではユーザーデータに到達できず、認証 (`/auth/v1`) のみが機能する。

ESLint で「Server Actions 禁止」「Client から Supabase 直接呼出禁止」を機械的に強制している。
詳細な規約は [`CLAUDE.md`](./CLAUDE.md) を参照。

## ライセンス

テンプレート本体はリポジトリルートの [LICENSE](./LICENSE) に従います。購入者本人のプロダクトへの利用は許可されますが、テンプレート本体の再配布・再販・公開リポジトリへの転載は禁止です。
