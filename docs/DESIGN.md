# DESIGN.md — CodeNow Market デザイン規約

このファイルはアプリ全体のデザイン規約です。
新しい画面を作るときは、必ずここを参照してください。

---

## 1. トーン・雰囲気

- **クリーン・ミニマル** — 余計な装飾を排除し、コンテンツを主役にする
- **信頼感・プロフェッショナル** — デジタル商品を売買するマーケットとして安心感を与える
- **軽快・モダン** — 角丸・薄いシャドウ・ホバーアニメーションで柔らかさを演出

参考イメージ: Gumroad / Lemon Squeezy

---

## 2. カラーパレット

| 役割 | 色名 | 値 |
|---|---|---|
| プライマリ（アクション・リンク） | Indigo | `#4F46E5` |
| プライマリ（ホバー） | Indigo Dark | `#4338CA` |
| 背景（ページ全体） | White | `#FFFFFF` |
| 背景（セクション区切り） | Gray 50 | `#F9FAFB` |
| 背景（ダーク CTA） | Gray 900 | `#111827` |
| テキスト（見出し） | Gray 900 | `#111827` |
| テキスト（本文） | Gray 600 | `#4B5563` |
| テキスト（補足・メタ情報） | Gray 400 | `#9CA3AF` |
| ボーダー | Gray 200 | `#E5E7EB` |
| 成功 | Green 600 | `#16A34A` |
| エラー | Red 600 | `#DC2626` |
| バッジ（New） | Indigo | `#4F46E5` |

---

## 3. タイポグラフィ

フォントは Tailwind のデフォルト（Inter / システムフォント）を使用。

| 用途 | クラス例 | サイズ | 太さ |
|---|---|---|---|
| ヒーロー見出し | `text-4xl font-bold` | 36px | 700 |
| セクション見出し | `text-2xl font-bold` | 24px | 700 |
| カード見出し | `text-base font-semibold` | 16px | 600 |
| 本文 | `text-sm text-gray-600` | 14px | 400 |
| 補足・メタ情報 | `text-xs text-gray-400` | 12px | 400 |
| 価格 | `text-lg font-bold text-gray-900` | 18px | 700 |
| ボタンラベル | `text-sm font-medium` | 14px | 500 |

---

## 4. 余白の取り方

### ページ全体

- 左右パディング: `px-4`（モバイル）/ `px-6`（タブレット）/ `px-0`（デスクトップはコンテナで制御）
- コンテナ最大幅: `max-w-5xl mx-auto`（約 1024px）

### セクション間

- セクションの上下余白: `py-16`（デスクトップ）/ `py-10`（モバイル）

### カード内

- カード内パディング: `p-4`（小カード）/ `p-6`（標準カード）

### フォーム

- ラベルとインプットの間: `gap-1.5`
- フィールド間: `gap-4` または `gap-6`
- フォーム全体の縦余白: `space-y-6`

---

## 5. コンポーネント規約

### ボタン

```
プライマリ:
  bg-indigo-600 text-white hover:bg-indigo-700
  px-5 py-2.5 rounded-lg text-sm font-medium
  transition-colors

セカンダリ（アウトライン）:
  border border-gray-300 text-gray-700 hover:bg-gray-50
  px-5 py-2.5 rounded-lg text-sm font-medium
  transition-colors

危険（削除など）:
  bg-red-600 text-white hover:bg-red-700
  px-5 py-2.5 rounded-lg text-sm font-medium

テキストリンク:
  text-indigo-600 hover:text-indigo-800 underline-offset-4 hover:underline
```

### カード（商品カード）

```
bg-white rounded-xl border border-gray-200
shadow-sm hover:shadow-md transition-shadow
overflow-hidden cursor-pointer
```

- サムネイル: `aspect-video bg-gray-100` （16:9、画像がない場合はプレースホルダー）
- カード内パディング: `p-4`
- 商品名: `text-base font-semibold text-gray-900 line-clamp-2`
- 売り手名: `text-xs text-gray-400`
- 価格: `text-lg font-bold text-gray-900`
- ボタン: カード下部に `詳細を見る`（セカンダリ）

### フォーム（shadcn/ui の Field パターン）

```
Field（FieldGroup の中に配置）:
  FieldLabel: text-sm font-medium text-gray-700
  Input: border border-gray-300 rounded-lg px-3 py-2 text-sm
         focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
  FieldError: text-xs text-red-600 mt-1
```

- エラー時: `data-invalid` で赤ボーダー、`FieldError` でメッセージ表示
- 必須マーク: ラベル末尾に `*`（赤）

### バッジ

```
New:     bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full
公開中:  bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full
非公開:  bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full
```

### テーブル（購入履歴・商品管理一覧）

```
テーブル外枠: border border-gray-200 rounded-xl overflow-hidden
ヘッダー行: bg-gray-50 text-xs font-medium text-gray-500 uppercase
データ行: border-t border-gray-100 hover:bg-gray-50 transition-colors
セル: px-4 py-3 text-sm
```

### ページヘッダー（各画面上部）

```
<div class="mb-8">
  <h1 class="text-2xl font-bold text-gray-900">ページタイトル</h1>
  <p class="mt-1 text-sm text-gray-500">補足説明</p>
</div>
```

### 空状態（データなし）

```
<div class="text-center py-16 text-gray-400">
  アイコン（大）
  <p class="mt-2 text-sm">まだ商品がありません</p>
  <Button class="mt-4">アクションボタン</Button>
</div>
```

---

## 6. グリッドレイアウト

| 画面 | モバイル | タブレット | デスクトップ |
|---|---|---|---|
| 商品一覧 | 1列 | 2列 | 3〜4列 |
| フィーチャーカード | 1列 | 2列 | 3列 |
| 売り手商品管理 | 1列 | 2列 | 3列 |

```
商品一覧グリッド:
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6
```

---

## 7. スマホ表示の考え方

- **モバイルファースト** — まずスマホで崩れないか確認してから、`sm:` / `lg:` で広げる
- ナビゲーション: ヘッダーにロゴ＋ハンバーガーメニュー（または最小限のリンク）
- ボタン: モバイルでは `w-full` で横幅いっぱいに（複数ある場合は縦並び）
- フォーム: 1カラム固定（横並びにしない）
- カード: `gap-4`（モバイル）→ `gap-6`（デスクトップ）

---

## 8. 画面別デザイン方針

### `/` トップページ
- ヒーロー → フィーチャー3列 → 新着商品グリッド → ダークCTAバナー → フッター
- ヒーローは `bg-white` または淡いグラデーション（`from-indigo-50 to-white`）

### `/products` 商品一覧
- フィルター（価格順・新着順）を右上に配置
- 商品グリッド（3〜4列）
- ページネーションまたは無限スクロール

### `/products/[id]` 商品詳細
- 左: サムネイル大
- 右: 商品名 / 売り手名 / 価格 / 「購入する」ボタン（`w-full`）/ 説明文
- モバイルは縦1列

### `/seller/products` 売り手商品管理
- 右上に「＋ 新規商品を登録」ボタン
- 商品をテーブルまたはカードリストで表示
- 各行に「編集」「公開/非公開」「削除」アクション

### `/seller/products/new` `/seller/products/[id]/edit` 商品登録・編集
- 白カード内にフォームをまとめる
- `max-w-2xl mx-auto`（狭めにして集中させる）
- 下部に「保存する」（プライマリ）「キャンセル」（テキスト）

### `/purchases` 購入履歴
- テーブルまたはカードリスト
- 各行に「ダウンロード」ボタン（緑またはアウトライン）

### `/checkout/success` 購入完了
- 中央揃えのサンキューメッセージ
- チェックマークアイコン（緑）
- 「購入履歴を見る」ボタン

---

## 9. アニメーション・インタラクション

- ホバー: `transition-colors` / `transition-shadow`（duration 150〜200ms）
- ローディング: `Loader2` アイコン（lucide-react）を `animate-spin` で使用
- ページ遷移: Next.js のデフォルト（追加ライブラリは不要）

---

## 10. 禁止事項

- カラーパレット外の色を勝手に使わない
- `Dialog`, `Toast`, `Select`, `Dropdown` など未導入の shadcn コンポーネントを使わない
- インラインスタイル（`style={}`)は使わない
- `!important` は使わない
