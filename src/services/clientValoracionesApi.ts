import { apiFetch } from "@/services/apiClient";
import { getClientToken } from "@/services/clientAuthStorage";
import { getArrayFromResponse, getRecordFromResponse } from "@/services/faqApi";

export type ValoracionEstado =
  | "pendiente"
  | "aprobada"
  | "aprobado"
  | "rechazada"
  | "rechazado"
  | string;

export type ValoracionPublica = {
  id: number | string;
  nombre_mostrado: string;
  comentario: string;
  puntuacion: number;
  estado?: ValoracionEstado;
  visible?: boolean;
  publicada?: boolean;
  aprobada?: boolean;
  respuesta_admin?: string | null;
  creado_en?: string | null;
};

export type ValoracionCliente = {
  id: number | string;
  cita_id?: number | string | null;
  nombre_mostrado: string;
  comentario: string;
  puntuacion: number;
  estado: ValoracionEstado;
  visible: boolean;
  respuesta_admin?: string | null;
  creado_en?: string | null;
};

export type ValoracionClientePayload = {
  cita_id?: number | string | null;
  nombre_mostrado: string;
  comentario: string;
  puntuacion: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toStringOrNull = (value: unknown) =>
  value === null || value === undefined ? null : String(value);

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBool = (value: unknown, fallback = false) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "si";
  }
  return Boolean(value);
};

const normalizeEstado = (value: unknown, fallback: ValoracionEstado) => {
  const normalized = toStringOrNull(value)?.toLowerCase().trim();
  if (normalized === "aprobado") return "aprobada";
  if (normalized === "rechazado") return "rechazada";
  return normalized ?? fallback;
};

const hasField = (record: Record<string, unknown>, keys: string[]) =>
  keys.some((key) => record[key] !== undefined && record[key] !== null);

const isPublicValoracion = (item: ValoracionPublica) => {
  const estado = normalizeEstado(item.estado, "aprobada");
  const hasVisibility =
    item.visible !== undefined ||
    item.publicada !== undefined ||
    item.aprobada !== undefined;
  const isVisible =
    item.visible !== false && item.publicada !== false && item.aprobada !== false;

  return estado === "aprobada" && (!hasVisibility || isVisible);
};

export const mapValoracionPublica = (item: unknown): ValoracionPublica => {
  const record = isRecord(item) ? item : {};

  return {
    id: toStringOrNull(record.id) ?? "",
    nombre_mostrado:
      toStringOrNull(record.nombre_mostrado ?? record.nombre ?? record.name) ??
      "Cliente CQuezadaSkin",
    comentario: toStringOrNull(record.comentario ?? record.comment) ?? "",
    puntuacion: Math.min(
      5,
      Math.max(1, toNumber(record.puntuacion ?? record.rating, 5))
    ),
    estado: normalizeEstado(record.estado ?? record.status, "aprobada"),
    visible: hasField(record, ["visible"])
      ? toBool(record.visible, false)
      : undefined,
    publicada: hasField(record, ["publicada", "published"])
      ? toBool(record.publicada ?? record.published, false)
      : undefined,
    aprobada: hasField(record, ["aprobada", "approved"])
      ? toBool(record.aprobada ?? record.approved, false)
      : undefined,
    respuesta_admin: toStringOrNull(record.respuesta_admin),
    creado_en: toStringOrNull(record.creado_en ?? record.created_at),
  };
};

export const mapValoracionCliente = (item: unknown): ValoracionCliente => {
  const record = isRecord(item) ? item : {};

  return {
    id: toStringOrNull(record.id) ?? "",
    cita_id: toStringOrNull(record.cita_id),
    nombre_mostrado:
      toStringOrNull(record.nombre_mostrado ?? record.nombre ?? record.name) ??
      "Cliente CQuezadaSkin",
    comentario: toStringOrNull(record.comentario ?? record.comment) ?? "",
    puntuacion: Math.min(
      5,
      Math.max(1, toNumber(record.puntuacion ?? record.rating, 5))
    ),
    estado: normalizeEstado(record.estado ?? record.status, "pendiente"),
    visible: toBool(record.visible ?? record.publicada ?? record.published, false),
    respuesta_admin: toStringOrNull(record.respuesta_admin),
    creado_en: toStringOrNull(record.creado_en ?? record.created_at),
  };
};

const getPublicValoracionesFrom = async (path: string) => {
  const response = await apiFetch<unknown>(path, { skipAuth: true });
  return getArrayFromResponse(response, [
    "testimonios",
    "valoraciones",
    "data",
    "items",
    "results",
  ]);
};

export const listTestimonios = async () => {
  let items = await getPublicValoracionesFrom("/testimonios");

  if (items.length === 0) {
    try {
      items = await getPublicValoracionesFrom("/valoraciones?public=1");
    } catch {
      // El endpoint historico es /testimonios; el fallback solo cubre APIs nuevas.
    }
  }

  return items
    .map(mapValoracionPublica)
    .filter((item) => item.comentario.trim() && isPublicValoracion(item));
};

export const listValoracionesCliente = async (token = getClientToken()) => {
  const response = await apiFetch<unknown>("/clientes/valoraciones", {
    authToken: token,
  });
  return getArrayFromResponse(response, [
    "valoraciones",
    "testimonios",
    "data",
    "items",
    "results",
  ]).map(mapValoracionCliente);
};

export const createValoracionCliente = async (
  payload: ValoracionClientePayload,
  token = getClientToken()
) => {
  const response = await apiFetch<unknown>("/clientes/valoraciones", {
    method: "POST",
    body: JSON.stringify(payload),
    authToken: token,
  });
  return mapValoracionCliente(
    getRecordFromResponse(response, ["valoracion", "testimonio"])
  );
};
