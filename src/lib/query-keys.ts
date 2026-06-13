export const profileKeys = {
  all: ["profile"] as const,
  details: () => [...profileKeys.all, "detail"] as const,
  detail: () => [...profileKeys.details(), "me"] as const,
}
