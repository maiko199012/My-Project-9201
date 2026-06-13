import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center bg-background px-4 py-10 sm:px-6">
      <div className="w-full max-w-[380px]">{children}</div>
    </main>
  )
}
