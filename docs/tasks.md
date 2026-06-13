# 実装タスクリスト

> spec.md の機能リストをもとに、依存関係を考慮した実装順に並べています。
> 認証（`/login`）とダッシュボード（`/dashboard`）はスターター実装済みのため除外。

---

## Phase 1｜データ層の整備

- [ ] **Prisma セットアップ＋スキーマ定義**
  `prisma/schema.prisma` を作成し、`seller_profiles` / `products` / `purchases` の3テーブルを定義する。初期マイグレーションを実行してSQLiteのDBファイルを生成する。

---

## Phase 2｜売り手機能

- [ ] **Stripe Connect Express オンボーディング（`/seller/onboarding`）**
  「売り手登録する」ボタンを押すと Stripe の Account Link URL を生成してリダイレクトする。Stripe から戻ってきたら `seller_profiles.onboarding_completed` を `true` に更新し、完了メッセージを表示する。

- [ ] **商品登録フォーム（`/seller/products/new`）**
  タイトル・説明・価格・ファイルのフォームを作成する。送信時にファイルを `public/uploads/` に保存し、`products` テーブルに INSERT する。`onboarding_completed` が `false` の場合は `/seller/onboarding` にリダイレクトする。

- [ ] **商品管理一覧（`/seller/products`）**
  ログインユーザーの `owner_id` で絞り込んだ商品一覧を表示する。公開／非公開の切り替えボタン（`published` を UPDATE）、編集リンク、削除ボタンを実装する。

- [ ] **商品編集フォーム（`/seller/products/[id]/edit`）**
  既存データを初期値としてフォームを表示し、送信時に `products` を UPDATE する。`product.owner_id !== ログインユーザーID` の場合は 403 を返す。

---

## Phase 3｜公開ページ（買い手向け）

- [x] **トップページ（`/`）**
  `published = true` の商品を新着順で数件取得してカード形式で表示する。

- [ ] **商品一覧（`/products`）**
  `published = true` の全商品を一覧表示する。タイトル・価格・出品者名（`profiles` と JOIN）を表示する。

- [ ] **商品詳細（`/products/[id]`）**
  商品の全情報と出品者名を表示する。未ログインなら「ログインして購入」、ログイン済み未購入なら「購入する」、購入済み（`purchases.status = completed`）なら「ダウンロード」ボタンを表示する。

---

## Phase 4｜決済

- [ ] **Stripe Checkout セッション作成（API route）**
  `POST /api/checkout` を実装する。`purchases` に `pending` レコードを INSERT し、Stripe Checkout Session を Connect アカウント向けに作成して URL を返す。`success_url` に `stripe_session_id` をクエリパラメータとして含める。

- [ ] **決済完了ページ（`/checkout/success`）**
  クエリパラメータの `session_id` で `purchases` を引き、商品名とダウンロードボタンを表示する。購入履歴へのリンクも設置する。

- [ ] **Stripe Webhook 処理（`/api/webhooks/stripe`）**
  `checkout.session.completed` イベントを受信したら、対応する `purchases` の `status` を `completed` に UPDATE する。署名検証（`stripe.webhooks.constructEvent`）を必ず実装する。

---

## Phase 5｜購入後

- [ ] **購入履歴（`/purchases`）**
  `buyer_id = ログインユーザーID` かつ `status = completed` の購入一覧を表示する。商品名・金額・購入日・ダウンロードボタンを表示する。

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
