export const profileKeys = {
  all: ["profile"] as const,
  details: () => [...profileKeys.all, "detail"] as const,
  detail: () => [...profileKeys.details(), "me"] as const,
}

export const publicProductKeys = {
  all: ["public-products"] as const,
  lists: () => [...publicProductKeys.all, "list"] as const,
  detail: (id: string) => [...publicProductKeys.all, "detail", id] as const,
}

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...productKeys.lists(), filters ?? {}] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
}

export const purchaseKeys = {
  all: ["purchases"] as const,
  status: (productId: string) => [...purchaseKeys.all, "status", productId] as const,
  lists: () => [...purchaseKeys.all, "list"] as const,
}

export const sellerOnboardingKeys = {
  all: ["seller-onboarding"] as const,
  status: () => [...sellerOnboardingKeys.all, "status"] as const,
}

export const salesKeys = {
  all: ["sales"] as const,
  summary: () => [...salesKeys.all, "summary"] as const,
}
