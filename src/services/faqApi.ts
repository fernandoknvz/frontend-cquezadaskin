import { apiFetch } from "@/services/apiClient";

export type FAQItem = {
  id: number | string;
  pregunta: string;
  respuesta: string;
  categoria?: string | null;
  orden?: number | null;
  activo?: boolean | null;
  creado_en?: string | null;
  updated_at?: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toStringOrNull = (value: unknown) =>
  value === null || value === undefined ? null : String(value);

const toNumberOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toBoolOrNull = (value: unknown) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "si";
  }
  return Boolean(value);
};

export const getArrayFromResponse = (
  response: unknown,
  keys: string[]
): unknown[] => {
  if (Array.isArray(response)) return response;
  if (!isRecord(response)) return [];

  for (const key of keys) {
    const value = response[key];
    if (Array.isArray(value)) return value;
  }

  if (Array.isArray(response.data)) return response.data;

  if (isRecord(response.data)) {
    for (const key of keys) {
      const value = response.data[key];
      if (Array.isArray(value)) return value;
    }
  }

  return [];
};

export const getRecordFromResponse = (
  response: unknown,
  keys: string[]
): unknown => {
  if (!isRecord(response)) return response;

  for (const key of keys) {
    const value = response[key];
    if (isRecord(value)) return value;
  }

  if (isRecord(response.data)) {
    for (const key of keys) {
      const value = response.data[key];
      if (isRecord(value)) return value;
    }
    return response.data;
  }

  return response;
};

export const mapFAQItem = (item: unknown): FAQItem => {
  const record = isRecord(item) ? item : {};

  return {
    id: toStringOrNull(record.id) ?? "",
    pregunta: toStringOrNull(record.pregunta ?? record.question) ?? "",
    respuesta: toStringOrNull(record.respuesta ?? record.answer) ?? "",
    categoria: toStringOrNull(record.categoria ?? record.category),
    orden: toNumberOrNull(record.orden ?? record.order),
    activo: toBoolOrNull(record.activo ?? record.active),
    creado_en: toStringOrNull(record.creado_en ?? record.created_at),
    updated_at: toStringOrNull(record.updated_at),
  };
};

export const listFAQ = async () => {
  const response = await apiFetch<unknown>("/faq", { skipAuth: true });
  return getArrayFromResponse(response, ["faq", "faqs", "items", "results"])
    .map(mapFAQItem)
    .filter((item) => item.pregunta.trim() && item.respuesta.trim());
};
