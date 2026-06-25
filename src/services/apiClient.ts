const rawApiUrl =
  import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "/api";

const API_BASE_URL = String(rawApiUrl).replace(/\/$/, "").endsWith("/api")
  ? String(rawApiUrl).replace(/\/$/, "")
  : `${String(rawApiUrl).replace(/\/$/, "")}/api`;

const API_ASSET_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

const normalizePath = (path: string) =>
  path.startsWith("/") ? path : `/${path}`;

export const resolveApiAssetUrl = (url?: string | null) => {
  const value = String(url ?? "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }
  return `${API_ASSET_BASE_URL}${normalizePath(value)}`;
};

const errorKeys = ["message", "error", "errors", "detalle", "details", "detail"];

const stringifyErrorValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map(stringifyErrorValue).filter(Boolean).join(" ");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => {
        const text = stringifyErrorValue(item);
        return text ? `${key}: ${text}` : "";
      })
      .filter(Boolean)
      .join(" ");
  }
  return "";
};

const extractErrorMessage = (raw: string) => {
  if (!raw) return "Error en la solicitud";

  try {
    const parsed = JSON.parse(raw);
    for (const key of errorKeys) {
      const text = stringifyErrorValue(parsed?.[key]);
      if (text) return text;
    }
    return stringifyErrorValue(parsed) || raw;
  } catch {
    return raw;
  }
};

const looksLikeImageSizeError = (message: string) => {
  const value = message.toLowerCase();
  return (
    /(imagen|image|archivo|file|upload|payload)/.test(value) &&
    /(pesad|grande|large|tama|size|max|exceed|excede|413)/.test(value)
  );
};

const getRequestErrorMessage = (
  status: number,
  path: string,
  fallback: string
) => {
  const normalizedPath = normalizePath(path);

  if (status === 401) {
    return normalizedPath === "/login"
      ? "Credenciales incorrectas"
      : "Sesión expirada";
  }

  if (status === 413 || looksLikeImageSizeError(fallback)) {
    return "La imagen es demasiado pesada. Intenta subir una imagen mas liviana.";
  }

  return fallback;
};

type ApiFetchOptions = RequestInit & {
  authToken?: string | null;
  skipAuth?: boolean;
};

export async function apiFetch<T>(
  path: string,
  options?: ApiFetchOptions
): Promise<T> {
  const { getAccessToken } = await import("@/services/authStorage");
  const hasAuthToken = Object.prototype.hasOwnProperty.call(
    options ?? {},
    "authToken"
  );
  const token = options?.skipAuth
    ? null
    : hasAuthToken
      ? options?.authToken ?? null
      : getAccessToken();
  const requestOptions = { ...(options ?? {}) };
  delete requestOptions.authToken;
  delete requestOptions.skipAuth;

  let response: Response;

  try {
    const isFormData = requestOptions.body instanceof FormData;
    const headers = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(requestOptions.headers ?? {}),
    };

    response = await fetch(`${API_BASE_URL}${normalizePath(path)}`, {
      ...requestOptions,
      credentials: requestOptions.credentials ?? "include",
      headers,
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }

  if (!response.ok) {
    if (response.status === 401 && !hasAuthToken) {
      const { clearAuthStorage } = await import("@/services/authStorage");
      clearAuthStorage();
    }

    const raw = await response.text();

    const message = extractErrorMessage(raw);

    const error = new Error(
      getRequestErrorMessage(response.status, path, message)
    );
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  if (response.status === 204) return undefined as T;

  const raw = await response.text();
  if (!raw) return undefined as T;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as T;
  }
}
