/* eslint-disable @next/next/no-img-element */

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-800">
      {/* Header */}
      <header className="border-b border-stone-200 sticky top-0 bg-stone-50/90 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight text-stone-800">
            Cafe Mdot
          </div>
          <nav className="hidden md:flex gap-8 text-sm text-stone-500">
            <a href="#menu" className="hover:text-stone-800 transition-colors">
              Menu
            </a>
            <a href="#info" className="hover:text-stone-800 transition-colors">
              Access
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-28 md:py-40 text-center">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-5">
          Welcome to
        </p>
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6 text-stone-900 leading-tight">
          Cafe Mdot
        </h1>
        <p className="text-lg md:text-xl text-stone-500 max-w-md mx-auto mb-12 leading-relaxed">
          一杯のコーヒーが、
          <br className="hidden md:block" />
          あなたの一日をあたたかく包む。
        </p>
        <a
          href="#menu"
          className="inline-block bg-stone-800 text-white px-9 py-4 rounded-full font-medium hover:bg-stone-900 transition-colors"
        >
          メニューを見る
        </a>
      </section>

      {/* Menu */}
      <section id="menu" className="bg-stone-100">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-3">
              Our Menu
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900">
              こだわりのメニュー
            </h2>
          </div>

          <h3 className="text-xs tracking-[0.25em] text-stone-400 uppercase mb-6">
            Drinks
          </h3>
          <div className="grid md:grid-cols-3 gap-6 mb-14">
            {drinks.map((item) => (
              <article
                key={item.name}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-baseline justify-between mb-1">
                    <h4 className="font-semibold text-stone-800">{item.name}</h4>
                    <span className="text-stone-600 font-medium text-sm">
                      {item.price}
                    </span>
                  </div>
                  <p className="text-sm text-stone-500">{item.description}</p>
                </div>
              </article>
            ))}
          </div>

          <h3 className="text-xs tracking-[0.25em] text-stone-400 uppercase mb-6">
            Food
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {foods.map((item) => (
              <article
                key={item.name}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-baseline justify-between mb-1">
                    <h4 className="font-semibold text-stone-800">{item.name}</h4>
                    <span className="text-stone-600 font-medium text-sm">
                      {item.price}
                    </span>
                  </div>
                  <p className="text-sm text-stone-500">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Info */}
      <section id="info" className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-3">
            Visit Us
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900">
            アクセス・営業時間
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-stone-100 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-stone-700 rounded-full flex items-center justify-center text-white shrink-0">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-stone-900">場所</h3>
            </div>
            <p className="text-stone-700 leading-relaxed">
              〒150-0001
              <br />
              東京都渋谷区神宮前 3-1-1
              <br />
              Mdotビル 1F
            </p>
            <p className="mt-4 text-sm text-stone-500">
              表参道駅 A2出口より徒歩 5 分
            </p>
          </div>

          <div className="bg-stone-100 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-stone-700 rounded-full flex items-center justify-center text-white shrink-0">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-stone-900">営業時間</h3>
            </div>
            <div className="space-y-3">
              {hours.map((h) => (
                <div
                  key={h.day}
                  className="flex justify-between text-stone-700 text-sm"
                >
                  <span className="font-medium">{h.day}</span>
                  <span>{h.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-300">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="grid md:grid-cols-3 gap-10 mb-10">
            {/* Brand */}
            <div>
              <p className="text-lg font-bold text-white mb-2">Cafe Mdot</p>
              <p className="text-sm leading-relaxed text-stone-400">
                一杯のコーヒーが、
                <br />
                あなたの一日をあたたかく包む。
              </p>
            </div>

            {/* Hours */}
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-4">
                営業時間
              </p>
              <div className="space-y-2">
                {hours.map((h) => (
                  <div key={h.day} className="flex justify-between text-sm">
                    <span>{h.day}</span>
                    <span className="text-stone-400">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Address */}
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-4">
                アクセス
              </p>
              <address className="not-italic text-sm leading-relaxed">
                〒150-0001
                <br />
                東京都渋谷区神宮前 3-1-1
                <br />
                Mdotビル 1F
                <br />
                <span className="text-stone-400 mt-1 block">
                  表参道駅 A2出口より徒歩 5 分
                </span>
              </address>
            </div>
          </div>

          <div className="border-t border-stone-700 pt-6 text-center">
            <p className="text-xs text-stone-500">
              © 2026 Cafe Mdot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

const drinks = [
  {
    name: "Signature Latte",
    price: "¥680",
    description: "自家焙煎エスプレッソと濃厚なスチームミルクのハーモニー",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
  },
  {
    name: "Matcha Latte",
    price: "¥720",
    description: "京都産宇治抹茶を使った、まろやかなほうじ茶ラテ",
    image:
      "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=600&q=80",
  },
  {
    name: "Chamomile Tea",
    price: "¥580",
    description: "心を落ち着かせる、オーガニックカモミールのハーブティー",
    image:
      "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&q=80",
  },
];

const foods = [
  {
    name: "Butter Croissant",
    price: "¥420",
    description: "毎朝焼き上げる、外はサクサク、中はふわふわのクロワッサン",
    image:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80",
  },
  {
    name: "Avocado Toast",
    price: "¥880",
    description: "厚切りサワードウにアボカドと半熟卵をのせた人気モーニング",
    image:
      "https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=600&q=80",
  },
  {
    name: "Basque Cheesecake",
    price: "¥580",
    description: "バスク風の濃厚チーズケーキ。コーヒーとの相性が抜群",
    image:
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80",
  },
];

const hours = [
  { day: "月曜日 〜 金曜日", time: "8:00 〜 20:00" },
  { day: "土曜日", time: "9:00 〜 21:00" },
  { day: "日曜日・祝日", time: "10:00 〜 18:00" },
];
