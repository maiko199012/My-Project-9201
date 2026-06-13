# EC サイト 仕様書

> **注意（AGENTS.md より）**  
> このプロジェクトは Next.js の破壊的変更を含むバージョンを使用しています。  
> コードを書く前に必ず `node_modules/next/dist/docs/` の関連ガイドを読み、  
> deprecation 警告を確認・対応してください。

---

## プロジェクト概要

売り手がデジタル商品（ファイル）を登録し、買い手が Stripe 決済で購入してダウンロードするマーケットプレイス。

- ログインした人なら誰でも売り手になれる
- 決済は Stripe Connect Express を使い、売り手のアカウントへ直接入金される
- ファイルのダウンロードは購入済みユーザーが無制限に行える

---

## ユーザーの種類

### 売り手

- Google ログイン後、Stripe Connect Express でオンボーディングを完了した人
- 商品（タイトル・説明・価格・販売ファイル）を登録・編集・削除できる
- 公開／非公開を切り替えられる
- 編集・削除は **自分の商品のみ** 可能

### 買い手

- ログイン不要で商品を閲覧できる
- 購入時はログインが必須
- Stripe Checkout（Connect 経由）で決済し、購入履歴からファイルを何度でもダウンロードできる

---

## 機能リスト

| # | 機能 | 対象 |
|---|---|---|
| 1 | Google ログイン・ログアウト | 全員 |
| 2 | Stripe Connect Express オンボーディング | 売り手 |
| 3 | 商品登録・編集・削除 | 売り手 |
| 4 | 商品の公開／非公開切り替え | 売り手 |
| 5 | 公開商品の一覧・詳細閲覧 | 全員 |
| 6 | Stripe Checkout による購入 | 買い手 |
| 7 | Webhook による購入確定処理 | システム |
| 8 | 購入履歴の表示 | 買い手 |
| 9 | 購入済みファイルのダウンロード（無制限） | 買い手 |

---

## 画面リスト

既存画面（スターター実装済み）：

| URL | 説明 |
|---|---|
| `/login` | Google ログイン |
| `/dashboard` | ログイン後のマイページ |

追加画面：

| URL | ログイン | 対象 | 使うテーブル |
|---|---|---|---|
| `/` | 不要 | 全員 | products |
| `/products` | 不要 | 全員 | products, profiles |
| `/products/[id]` | 不要（購入はログイン必須） | 全員 | products, profiles, purchases |
| `/seller/onboarding` | 必須 | 売り手 | seller_profiles |
| `/seller/products` | 必須 | 売り手 | products |
| `/seller/products/new` | 必須 | 売り手 | products |
| `/seller/products/[id]/edit` | 必須 | 売り手 | products |
| `/checkout/success` | 必須 | 買い手 | purchases, products |
| `/purchases` | 必須 | 買い手 | purchases, products |
| `/api/downloads/[purchaseId]` | 必須 | 買い手 | purchases, products |

### 画面遷移

**売り手の動線：**

```
/login → /dashboard → /seller/onboarding（未登録時）
                    → /seller/products
                          → /seller/products/new
                          → /seller/products/[id]/edit
```

**買い手の動線：**

```
/ → /products → /products/[id]
                      ↓（未ログインなら /login 経由）
                 Stripe Checkout（外部）
                      ↓
               /checkout/success
                      ↓
               /purchases → /api/downloads/[purchaseId]
```

---

## データベース設計

### `profiles`（スターター実装済み）

| カラム | 型 | 内容 |
|---|---|---|
| id | TEXT PK | ユーザーID（Google sub） |
| email | TEXT | メールアドレス |
| created_at | DATETIME | 作成日時 |

---

### `seller_profiles`

売り手として登録したユーザーの Stripe Connect 情報。  
ログインユーザー全員ではなく、オンボーディングした人だけレコードが存在する。

| カラム | 型 | 内容 |
|---|---|---|
| id | TEXT PK | |
| profile_id | TEXT FK UNIQUE | → profiles.id |
| stripe_account_id | TEXT | Stripe Connect Express アカウントID |
| onboarding_completed | BOOLEAN | 銀行口座・本人確認の完了フラグ |
| created_at | DATETIME | 売り手登録日時 |

---

### `products`

`owner_id` により所有者を特定し、「自分の商品しか編集できない」ルールをアプリ側で実現する。

| カラム | 型 | 内容 |
|---|---|---|
| id | TEXT PK | |
| owner_id | TEXT FK | → profiles.id（商品の持ち主） |
| title | TEXT | 商品名 |
| description | TEXT | 説明文 |
| price | INTEGER | 価格（円単位の整数。Stripe の仕様） |
| file_path | TEXT | ファイルの保存パス or URL |
| file_name | TEXT | 元のファイル名（ダウンロード時のファイル名に使用） |
| file_size | INTEGER | ファイルサイズ（バイト） |
| published | BOOLEAN | 公開中かどうか |
| created_at | DATETIME | 作成日時 |
| updated_at | DATETIME | 最終更新日時 |

---

### `purchases`

決済の試行から完了まで1テーブルで管理する。  
「やり直し」は新しいレコードを INSERT し、失敗レコードは履歴として残す。

| カラム | 型 | 内容 |
|---|---|---|
| id | TEXT PK | |
| buyer_id | TEXT FK | → profiles.id（購入者） |
| product_id | TEXT FK | → products.id（購入した商品） |
| stripe_session_id | TEXT UNIQUE | Stripe Checkout Session ID |
| amount | INTEGER | 実際に決済された金額（円） |
| status | TEXT | `pending` / `completed` / `failed` |
| created_at | DATETIME | 決済開始日時 |
| updated_at | DATETIME | ステータス変更日時（Webhook 受信時に更新） |

**status の遷移：**

```
「購入する」ボタン押下  → pending で INSERT
Stripe Webhook 受信    → completed に UPDATE
タイムアウト / 失敗    → failed に UPDATE
「もう一度試す」       → 新しい pending レコードを INSERT（前の failed は保持）
```

---

### テーブル関係

```
profiles ─────────── seller_profiles   （1対1）
    │
    ├──< products（owner_id）            （1対多：1人が複数商品）
    │         │
    └──< purchases >──── products       （多対多を purchases で解決）
  （buyer）
```

---

## 検証項目

このサービスが「動いている」と言える条件：

1. **商品登録** — Stripe Connect オンボーディング完了後、商品フォームから登録すると DB に保存され `/products` に表示される
2. **決済完了** — 商品詳細の「購入する」から Stripe Checkout を経て `/checkout/success` に遷移し、`purchases.status` が `completed` になっている
3. **Webhook 処理** — `checkout.session.completed` イベント受信時に purchases レコードが更新されている（Stripe ダッシュボードで確認可能）
4. **ダウンロード認可** — 未ログイン・他人の purchase ID では `/api/downloads/[purchaseId]` が 403 を返し、購入本人のみファイルを取得できる
5. **編集の権限制御** — 他人の `/seller/products/[id]/edit` にアクセスすると 403 になる
