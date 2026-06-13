export const profileKeys = {
  all: ["profile"] as const,
  details: () => [...profileKeys.all, "detail"] as const,
  detail: () => [...profileKeys.details(), "me"] as const,
}

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...productKeys.lists(), filters ?? {}] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
}
