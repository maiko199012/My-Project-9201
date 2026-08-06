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

- [x] **Stripe Connect Express オンボーディング（`/seller/onboarding`）**
  `seller_profiles` ではなく既存の `profiles` テーブルに `stripe_connect_account_id` / `stripe_onboarding_completed` / `stripe_charges_enabled` を追加（`0007_glamorous_raza.sql`）。
  `GET /api/seller/onboarding`: Connect account があれば Stripe から `details_submitted` / `charges_enabled` を取得して DB に同期し状態を返す。
  `POST /api/seller/onboarding`: account 未作成なら Express account を作成（`card_payments` / `transfers` capability）、Account Link を発行してリダイレクト先 URL を返す。
  ページ側は「未登録 / 手続き未完了 / 完了」の 3 状態を表示し、未完了時は「売り手登録する」または「手続きを再開する」ボタンを表示。ダッシュボードの「次にやること」から導線を追加。
  **Checkout 側もこれに合わせて変更**: `POST /api/checkout` は商品の売り手（`products.user_id`）の `profiles` を join し、`stripe_charges_enabled` が `true` でない場合は 400 で決済をブロックする。Stripe Checkout Session は `payment_intent_data.transfer_data.destination` に売り手の Connect アカウントを指定するデスティネーション支払いとして作成（プラットフォーム手数料 `application_fee_amount` は現在 0%、`src/app/api/checkout/route.ts` の `PLATFORM_FEE_PERCENT` で変更可能）。Webhook（`/api/stripe/webhook`）はプラットフォームアカウント上で `checkout.session.completed` を受け取る変更前と同じ実装のままで動作する（デスティネーション支払いの仕様上、送金は自動処理されイベントの受信先は変わらないため）。
  ⚠️ 既存の公開済み商品は、売り手が Connect オンボーディングを完了するまで購入できなくなる（意図した変更）。
  動作確認済み（テストサンドボックスで実際にオンボーディングを完了し `stripe_charges_enabled: true` を確認）。

- [x] **売上ダッシュボード（`/dashboard/sales`）＋ `GET /api/sales`**
  `GET /api/sales`: ログイン中ユーザーが売り手の商品（`products.user_id = 自分`）について、`purchases` を集計して返す。商品ごとの件数・売上は `products` から `purchases` への LEFT JOIN で売上 0 の商品も含める。直近の販売は商品名・金額・日時のみで、買い手を特定できる情報（`buyer_id` やメール等）は一切含めない。
  ページ側は「① 売上合計金額・販売件数合計の統計カード → ② 商品ごとの売上テーブル → ③ 最近の販売一覧」の 3 段構成。金額は `¥1,000` 形式（`toLocaleString("ja-JP")`）。ダッシュボードの「次にやること」から導線を追加。

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

- [x] **決済完了ページ（`/products/[id]/success`）**
  `/checkout/success` ではなく `/products/[id]/success` として実装（Checkout の `success_url` を `?session_id={CHECKOUT_SESSION_ID}` 付きでこちらに変更）。`GET /api/purchases/[productId]` を `purchased: false` の間 3 秒間隔でポーリングし、Webhook 反映前は「決済確認中です」+ 手動再確認ボタンを表示。反映後はダウンロードボタンを表示する。認可は `session_id` ではなく毎回 `purchases` テーブルの実データで判定。

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

- [x] **購入履歴 / マイページ（`GET /api/purchases` ＋ `/purchases`）**
  `GET /api/purchases`: `buyer_id = ログインユーザーID` の `purchases` を `products` と JOIN し、商品タイトル・画像URL（`product-images` は公開バケットなので直接 `getPublicUrl`）・購入金額・購入日時を新着順で返す。
  `/purchases` ページ: カードグリッドでサムネイル・タイトル・購入日・金額・ダウンロードボタン（`/api/downloads/[productId]` にリンク）を表示。0 件時は「まだ購入した商品はありません」+ 商品一覧へのリンク。ヘッダーにログイン時のみ「マイページ」リンクを追加（`Header.tsx`）。

- [x] **ダウンロードエンドポイント（`GET /api/downloads/[productId]`）**
  `purchaseId` ではなく `productId` を受け取り、`buyer_id = ログインユーザーID AND product_id` で `purchases` を確認（未購入・未ログインは 401/403）。ファイルを直接ストリームする代わりに、`SUPABASE_SERVICE_ROLE_KEY`（`src/lib/supabase/service.ts`）を使って `product-files`（非公開バケット）の**署名付き URL を 60 秒有効で発行し 307 リダイレクト**。ファイルの実 URL は画面にもレスポンス JSON にも出さない。
  `product-files` バケットには authenticated/anon 向けの SELECT ポリシーがない設計（`0003_setup_storage_buckets.sql` のコメント通り）ため、この用途でのみ RLS を回避するサービスロールキーを追加導入した。

---

## 実装順の依存関係

```
[Phase 1] Prisma セットアップ
    └→ [Phase 2] 売り手機能（DB がないと動かない）
          └→ [Phase 3] 公開ページ（商品データが必要）
                └→ [Phase 4] 決済（商品詳細ページが必要）
                      └→ [Phase 5] 購入後（決済完了が前提）
```
