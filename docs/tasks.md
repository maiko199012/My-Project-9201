# 実装タスクリスト

> spec.md の機能リストをもとに、依存関係を考慮した実装順に並べています。
> 認証（`/login`）とダッシュボード（`/dashboard`）はスターター実装済みのため除外。

---

## Phase 1｜データ層の整備

- [x] **Drizzle スキーマ定義＋マイグレーション適用**
  `src/lib/db/schema.ts` に `products` テーブルを追加。`pnpm db:generate` でマイグレーションファイル（`0002_round_aqueduct.sql`）を生成し、`pnpm db:migrate` で Supabase に適用済み。

- [x] **Supabase Storage バケット作成＋ポリシー設定**
  カスタムマイグレーション（`0003_setup_storage_buckets.sql`）で `product-images`（公開）と `product-files`（非公開）を作成。Storage RLS ポリシーも設定済み。

---

## Phase 2｜売り手機能

- [ ] **Stripe Connect Express オンボーディング（`/seller/onboarding`）**
  「売り手登録する」ボタンを押すと Stripe の Account Link URL を生成してリダイレクトする。Stripe から戻ってきたら `seller_profiles.onboarding_completed` を `true` に更新し、完了メッセージを表示する。

- [x] **商品登録 API（`POST /api/products`）**
  `src/app/api/products/route.ts` を実装。multipart/form-data を受け取り、Zod でテキスト検証、MIME type・サイズ検証後に Supabase Storage へアップロード、Drizzle で DB へ INSERT。DB 失敗時はアップロード済みファイルを削除してロールバック。

- [x] **商品登録フォーム（`/dashboard/products/new`）**
  React Hook Form + Zod でバリデーション。`useMutation` で `POST /api/products`（multipart/form-data）を呼び出し、成功時に products クエリを invalidate して `/dashboard/products` にリダイレクト。ファイル選択 UI はドラッグ＆ドロップ風のカスタム実装。

- [x] **商品管理一覧（`/dashboard/products`）＋ GET `/api/products`**
  `GET /api/products` で userId 絞り込み・新着順取得・imageUrl 付与を実装。ページ側は `useQuery` でカードグリッド表示。ローディング（スケルトン）・エラー・空状態も対応。各カードにサムネイル・タイトル・価格・公開バッジ・編集リンク・公開切替・削除ボタン付き。

- [x] **`GET /api/products/[id]`・`PATCH /api/products/[id]`・`DELETE /api/products/[id]`**（削除 UI 含む）
  GET: 認証→取得→所有者確認→imageUrl付与して返す。PATCH: multipart/form-data を受け取り、テキスト部分更新・画像/ファイル差し替え（旧ファイル削除）・DB UPDATE。isPublished は対象外。DB失敗時はアップ済みファイルをロールバック。

- [x] **公開状態切替 API（`PATCH /api/products/[id]/publish`）＋ UI トグル**
  JSON `{ isPublished: boolean }` を受け取り、認証→商品取得→所有者確認→DB UPDATE（isPublished + updatedAt）→更新後の商品を返す。商品管理一覧の各カードに「公開中（緑）/非公開（グレー）」ラベルと「公開する/非公開にする」トグルボタンを追加。クリック中はスピナー表示・disabled。失敗時は一覧上部に赤字エラーメッセージを表示。

- [x] **商品編集フォーム（`/dashboard/products/[id]/edit`）**
  `useQuery` で商品を取得してフォーム初期値にセット。403/404 は赤字メッセージ表示。`useMutation` で `PATCH /api/products/[id]`（multipart/form-data）。成功時は lists・detail の両クエリを invalidate して一覧へ遷移。画像・ファイルは現在のものを表示し変更時のみ送信。

---

## Phase 3｜公開ページ（買い手向け）

- [x] **トップページ（`/`）**
  `published = true` の商品を新着順で数件取得してカード形式で表示する。

- [x] **商品一覧（`/products`）**
  認証不要の公開専用 API（`GET /api/public/products`）を新設。`is_published = true` の全商品を新着順で返す（filePath / userId はレスポンスに含めず）。ページは Client Component + `useQuery`、カードグリッド（デスクトップ3列/タブレット2列/スマホ1列）、空状態・ローディング・エラーのインライン表示対応。

- [x] **商品詳細（`/products/[id]`）**
  認証不要の公開専用 API（`GET /api/public/products/[id]`）を新設。`is_published = true` の商品のみ返し、非公開・存在しない場合は 404。ページは Client Component + `useQuery`、デスクトップ左右 2 カラム（画像左・情報右）/ スマホ縦並び。「購入する」ボタンは現在「決済機能は準備中です」メッセージを表示（STEP 5 で Stripe 連携）。説明文は `whitespace-pre-wrap` で改行反映。

---

## Phase 4｜決済

- [x] **Stripe 商品カタログ同期（`scripts/sync-stripe-products.ts`）**
  `products` テーブルに `stripe_product_id` / `stripe_price_id`（nullable text）を追加（`0005_elite_living_tribunal.sql`）。既存商品を全件読み取り、未同期（`stripeProductId` が null）のものだけ Stripe Product + Price（`currency: jpy`）を作成して DB に ID を保存する冪等スクリプト。実行済みで既存 3 商品を同期済み。再実行コマンド: `pnpm sync:stripe-products`。
  ※ 現在の Checkout（下記）は `price_data` で都度金額指定しており、この Price ID はまだ参照していない。将来 Checkout 側を事前作成済み Price 参照に切り替える場合はこの ID を使う。

- [x] **Stripe Checkout セッション作成（API route）**
  `POST /api/checkout` を実装（`src/app/api/checkout/route.ts`）。**ログイン必須**（`purchases.buyer_id` を記録するため。ゲスト購入は不可に変更）。公開済み商品を検証し、`price_data` で Checkout Session を作成、`orders` に `pending` レコードを INSERT。Session の `metadata` に `productId` / `userId` / `stripePriceId`（商品が Stripe 同期済みの場合のみ）を設定。Connect は未使用（このスターターにセラーオンボーディングがないため、プラットフォームの Stripe アカウントに直接決済）。`success_url` / `cancel_url` は商品詳細ページに `?purchase=success` / `?purchase=cancelled` を付けて戻す。未ログイン時は 401 とエラーメッセージ「購入にはログインが必要です」を返す。

- [ ] **決済完了ページ（`/checkout/success`）**
  現状は専用ページの代わりに、商品詳細ページ（`/products/[id]`）が `?purchase=success` クエリを見て完了メッセージをインラインで表示している。専用ページ化は今後の課題。

- [x] **Stripe Webhook 処理（`/api/stripe/webhook`）**
  `checkout.session.completed` イベントを受信したら、`stripe.webhooks.constructEvent` で署名検証したうえで以下 2 つを行う。
  1. 対応する `orders` の `status` を `paid` に UPDATE（決済試行の内部トラッキング用）。
  2. `purchases`（買い手向けの確定購入記録。下記参照）へ INSERT。
  ローカル確認は `stripe listen --forward-to localhost:3000/api/stripe/webhook` で実施。

- [x] **`purchases` テーブル＋購入記録の冪等保存**
  `src/lib/db/schema.ts` に `purchases` テーブルを追加（`buyer_id` は `authUsers.id` への FK、`product_id` は `products.id` への FK、`amount`、`stripe_checkout_session_id`（UNIQUE）、`stripe_price_id`、`created_at`）。マイグレーション: `0006_reflective_blink.sql`。
  Webhook の `checkout.session.completed` 内で Checkout Session の `metadata.userId` / `metadata.productId` / `metadata.stripePriceId` を読み取り `purchases` に INSERT。**いずれか欠けている場合は INSERT せず `console.error` にセッション ID と欠けているフィールドを記録**（決済自体は成功しているため 200 は返す）。`stripe_checkout_session_id` の UNIQUE 制約 + `onConflictDoNothing` により、同じ Webhook イベントが複数回配信されても重複保存されない（冪等性）。

---

## Phase 5｜購入後

- [ ] **購入履歴（`/purchases`）**
  `buyer_id = ログインユーザーID` の `purchases` 一覧を表示する。商品名・金額・購入日・ダウンロードボタンを表示する。
  ※ `purchases` テーブルと Webhook からの記録は Phase 4 で実装済み（データは既に貯まる状態）。本ページの UI 自体は未着手。

- [ ] **ダウンロードエンドポイント（`/api/downloads/[purchaseId]`）**
  `purchase.buyer_id === ログインユーザーID` を確認し、不一致なら 403 を返す。一致する場合は `products.file_path` からファイルを読み込み、`Content-Disposition: attachment; filename="..."` ヘッダーと共にレスポンスとして返す。

---

## 実装順の依存関係

```
[Phase 1] Prisma セットアップ
    └→ [Phase 2] 売り手機能（DB がないと動かない）
          └→ [Phase 3] 公開ページ（商品データが必要）
                └→ [Phase 4] 決済（商品詳細ページが必要）
                      └→ [Phase 5] 購入後（決済完了が前提）
```
