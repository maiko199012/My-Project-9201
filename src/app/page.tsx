import Link from "next/link"
import {
  Download,
  CreditCard,
  UploadCloud,
  BookOpen,
  Code2,
  Layers,
  FileText,
  Palette,
} from "lucide-react"

import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"
import { createClient } from "@/lib/supabase/server"

// ─── 仮の商品データ（Day 3 で API に差し替え） ───────────────────────
const MOCK_PRODUCTS = [
  {
    id: "1",
    title: "Next.js 完全入門テンプレート",
    sellerName: "Maiko H.",
    price: 1980,
    icon: Code2,
    badge: "NEW",
  },
  {
    id: "2",
    title: "Python Web スクレイピング実践ガイド",
    sellerName: "TechWriter",
    price: 1200,
    icon: FileText,
    badge: null,
  },
  {
    id: "3",
    title: "Figma UI コンポーネントキット 2024",
    sellerName: "DesignLab",
    price: 4800,
    icon: Palette,
    badge: null,
  },
  {
    id: "4",
    title: "個人開発 SaaS ランディングページセット",
    sellerName: "Indie Hacker",
    price: 2980,
    icon: Layers,
    badge: null,
  },
  {
    id: "5",
    title: "TypeScript 設計パターン集",
    sellerName: "TypeScript Fan",
    price: 980,
    icon: BookOpen,
    badge: "NEW",
  },
  {
    id: "6",
    title: "Tailwind CSS コンポーネント 100 選",
    sellerName: "CSS Wizard",
    price: 1500,
    icon: Palette,
    badge: null,
  },
]

// ─── フィーチャーカード ────────────────────────────────────────────
const FEATURES = [
  {
    icon: UploadCloud,
    title: "かんたん出品",
    description:
      "商品ページを作るだけ。ファイルをアップして価格を設定したらすぐ販売開始。",
  },
  {
    icon: CreditCard,
    title: "安全な決済",
    description:
      "Stripe Connect を利用。売上は売り手のアカウントへ直接振り込まれます。",
  },
  {
    icon: Download,
    title: "何度でも DL",
    description:
      "購入後はいつでも購入履歴からダウンロード可能。期限なし・回数制限なし。",
  },
]

// ─────────────────────────────────────────────────────────────────
export default async function TopPage() {
  // ログイン済みならメールを Header に渡す（未ログインでもリダイレクトしない）
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-full flex-col">
      <Header email={user?.email} />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="bg-gradient-to-b from-indigo-50 to-white px-4 py-20 text-center sm:py-28">
          <div className="mx-auto max-w-2xl">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">
              デジタル商品を、
              <br />
              売って・買って・すぐ届く
            </h1>
            <p className="mt-5 text-base leading-relaxed text-gray-600 sm:text-lg">
              ファイルをアップロードするだけで販売開始。
              <br className="hidden sm:block" />
              Stripe 決済で売り手に直接入金されます。
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/products"
                className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto"
              >
                商品を見る
              </Link>
              <Link
                href="/seller/onboarding"
                className="w-full rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
              >
                販売を始める
              </Link>
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────── */}
        <section className="bg-white px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex flex-col items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-100">
                    <Icon className="size-5 text-indigo-600" aria-hidden="true" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                  <p className="text-sm leading-relaxed text-gray-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 新着商品 ──────────────────────────────────────────── */}
        <section className="bg-gray-50 px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">新着商品</h2>
              <Link
                href="/products"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline underline-offset-4"
              >
                すべて見る →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {MOCK_PRODUCTS.map(({ id, title, sellerName, price, icon: Icon, badge }) => (
                <Link
                  key={id}
                  href={`/products/${id}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* サムネイル */}
                  <div className="relative flex aspect-video items-center justify-center bg-indigo-50">
                    <Icon className="size-10 text-indigo-300" aria-hidden="true" />
                    {badge && (
                      <span className="absolute right-3 top-3 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
                        {badge}
                      </span>
                    )}
                  </div>
                  {/* カード本文 */}
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <p className="line-clamp-2 text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {title}
                    </p>
                    <p className="text-xs text-gray-400">{sellerName}</p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <span className="text-lg font-bold text-gray-900">
                        ¥{price.toLocaleString()}
                      </span>
                      <span className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition-colors group-hover:border-indigo-400 group-hover:text-indigo-600">
                        詳細を見る
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ───────────────────────────────────────── */}
        <section className="bg-gray-900 px-4 py-16 text-center">
          <div className="mx-auto max-w-xl">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              あなたの知識を商品にしよう
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Google アカウントがあればすぐに始められます。
              <br />
              手数料は Stripe の決済手数料のみ。月額費用は一切かかりません。
            </p>
            <Link
              href="/seller/onboarding"
              className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100"
            >
              無料で販売を始める
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
