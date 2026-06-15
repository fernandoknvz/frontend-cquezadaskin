import { resolveApiAssetUrl } from "@/services/apiClient";

export const DEFAULT_SERVICE_IMAGE = "/img/banner.jpg";

export const resolveImageUrl = (
  imagenUrl?: string | null,
  fallback = DEFAULT_SERVICE_IMAGE
) => {
  const value = String(imagenUrl ?? "").trim();
  const fallbackValue = String(fallback ?? "").trim();

  if (!value) {
    return fallbackValue ? resolveApiAssetUrl(fallbackValue) : "";
  }

  return resolveApiAssetUrl(value);
};
