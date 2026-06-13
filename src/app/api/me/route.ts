import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [profile] = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)

  if (!profile) {
    return NextResponse.json(
      { error: "Profile not found" },
      { status: 404 },
    )
  }

  return NextResponse.json({ data: profile })
}
