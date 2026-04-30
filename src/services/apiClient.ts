const rawApiUrl =
  import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "/api";

const API_BASE_URL = String(rawApiUrl).replace(/\/$/, "").endsWith("/api")
  ? String(rawApiUrl).replace(/\/$/, "")
  : `${String(rawApiUrl).replace(/\/$/, "")}/api`;

const normalizePath = (path: string) =>
  path.startsWith("/") ? path : `/${path}`;

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

  const response = await fetch(`${API_BASE_URL}${normalizePath(path)}`, {
    ...requestOptions,
    credentials: requestOptions.credentials ?? "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(requestOptions.headers ?? {}),
    },
  });

    if (!response.ok) {
      if (response.status === 401 && !hasAuthToken) {
        const { clearAuthStorage } = await import("@/services/authStorage");
        clearAuthStorage();
      }
    
      const raw = await response.text();
    
      // Intentar extraer un mensaje útil (JSON o texto)
      let message = raw || "Error en la solicitud";
      try {
        const parsed = JSON.parse(raw);
        message =
          parsed?.error ??
          parsed?.message ??
          parsed?.detail ??
          parsed?.errors?.[0] ??
          message;
      } catch {
        // raw no era JSON, dejamos el texto
      }
    
      const error = new Error(message);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
