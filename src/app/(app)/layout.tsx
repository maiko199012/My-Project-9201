import { redirect } from "next/navigation"

import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"
import { createClient } from "@/lib/supabase/server"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <>
      <Header email={user.email} />
      <main className="flex-1 bg-background px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto w-full max-w-[1024px]">{children}</div>
      </main>
      <Footer />
    </>
  )
}
