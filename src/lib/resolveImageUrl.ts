import { resolveApiAssetUrl } from "@/services/apiClient";

export const DEFAULT_SERVICE_IMAGE = "/img/oficial_hero.jpeg";

export const resolveImageUrl = (
  imagenUrl?: string | null,
  fallback = DEFAULT_SERVICE_IMAGE
): string => {
  const value = String(imagenUrl ?? "").trim();
  const fallbackValue = String(fallback ?? "").trim();

  if (!value) {
    return fallbackValue ? resolveImageUrl(fallbackValue, "") : "";
  }

  if (
    /^https?:\/\//i.test(value) ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("/img/")) {
    return value;
  }

  return resolveApiAssetUrl(value);
};
