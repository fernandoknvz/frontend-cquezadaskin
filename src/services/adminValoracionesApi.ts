import { apiFetch } from "@/services/apiClient";
import { getArrayFromResponse, getRecordFromResponse } from "@/services/faqApi";
import {
  mapValoracionCliente,
  type ValoracionEstado,
} from "@/services/clientValoracionesApi";

export type ValoracionAdmin = {
  id: number | string;
  cliente_id?: number | string | null;
  cita_id?: number | string | null;
  cliente_nombre?: string | null;
  cliente_correo?: string | null;
  nombre_mostrado: string;
  comentario: string;
  puntuacion: number;
  estado: ValoracionEstado;
  visible: boolean;
  respuesta_admin?: string | null;
  creado_en: string;
  updated_at: string;
};

export type AdminValoracionPayload = Partial<
  Pick<
    ValoracionAdmin,
    "nombre_mostrado" | "comentario" | "puntuacion" | "visible" | "respuesta_admin"
  >
>;

export type AdminValoracionEstadoPayload = {
  estado: ValoracionEstado;
  visible?: boolean;
  publicada?: boolean;
  aprobada?: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toStringOrNull = (value: unknown) =>
  value === null || value === undefined ? null : String(value);

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

export const mapValoracionAdmin = (item: unknown): ValoracionAdmin => {
  const record = isRecord(item) ? item : {};
  const cliente = isRecord(record.cliente) ? record.cliente : {};
  const mapped = mapValoracionCliente(record);

  return {
    ...mapped,
    cliente_id: toStringOrNull(record.cliente_id ?? cliente.id),
    cita_id: toStringOrNull(record.cita_id),
    cliente_nombre: toStringOrNull(
      record.cliente_nombre ?? cliente.nombre ?? cliente.name
    ),
    cliente_correo: toStringOrNull(
      record.cliente_correo ??
        record.cliente_email ??
        cliente.correo ??
        cliente.email
    ),
    visible: toBool(record.visible ?? record.publicada ?? record.published, mapped.visible),
    creado_en: toStringOrNull(record.creado_en ?? record.created_at) ?? "",
    updated_at: toStringOrNull(record.updated_at) ?? "",
  };
};

export const listValoracionesAdmin = async () => {
  const response = await apiFetch<unknown>("/admin/valoraciones");
  return getArrayFromResponse(response, [
    "valoraciones",
    "testimonios",
    "data",
    "items",
    "results",
  ]).map(mapValoracionAdmin);
};

export const getValoracionAdmin = async (id: number | string) => {
  const response = await apiFetch<unknown>(
    `/admin/valoraciones/${encodeURIComponent(String(id))}`
  );
  return mapValoracionAdmin(
    getRecordFromResponse(response, ["valoracion", "testimonio"])
  );
};

export const updateValoracionEstadoAdmin = async (
  id: number | string,
  payload: AdminValoracionEstadoPayload
) => {
  const response = await apiFetch<unknown>(
    `/admin/valoraciones/${encodeURIComponent(String(id))}/estado`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
  return mapValoracionAdmin(
    getRecordFromResponse(response, ["valoracion", "testimonio"])
  );
};

export const patchValoracionAdmin = async (
  id: number | string,
  payload: AdminValoracionPayload
) => {
  const response = await apiFetch<unknown>(
    `/admin/valoraciones/${encodeURIComponent(String(id))}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
  return mapValoracionAdmin(
    getRecordFromResponse(response, ["valoracion", "testimonio"])
  );
};

export const deleteValoracionAdmin = (id: number | string) =>
  apiFetch<{ message?: string; success?: boolean }>(
    `/admin/valoraciones/${encodeURIComponent(String(id))}`,
    {
      method: "DELETE",
    }
  );
