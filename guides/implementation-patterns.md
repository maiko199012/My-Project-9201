# 実装パターン集

`AGENTS.md` の規約を満たすための最小骨格。実際のリソース名・スキーマ名に合わせて置き換える。

## API Handler の最小骨格

```ts
// src/app/api/posts/route.ts
import { eq } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { posts } from "@/lib/db/schema"
import { createPostSchema } from "@/lib/schemas/post"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = await db.select().from(posts).where(eq(posts.ownerId, user.id))
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = createPostSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const [data] = await db.insert(posts).values({ ...parsed.data, ownerId: user.id }).returning()
  return NextResponse.json({ data }, { status: 201 })
}
```

## Client Component の base-nova フォーム

```tsx
<form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
  <FieldGroup>
    <Field data-invalid={!!errors.title || undefined}>
      <FieldLabel htmlFor="title">タイトル</FieldLabel>
      <Input id="title" aria-invalid={!!errors.title || undefined} {...register("title")} />
      <FieldError errors={errors.title ? [errors.title] : undefined} />
    </Field>
  </FieldGroup>
  <Button type="submit" disabled={mutation.isPending}>作成</Button>
</form>
```
