import { apiFetch } from "@/services/apiClient";
import type { Pagination } from "@/services/adminClientesApi";

export type ReservaEstado =
  | "solicitada"
  | "pendiente"
  | "confirmada"
  | "cancelada"
  | "completada"
  | "reagendada"
  | string;

export type ReservaAdmin = {
  id: number | string;
  cliente_id?: number | string | null;
  servicio_id?: number | string | null;
  cliente_nombre?: string | null;
  cliente_email?: string | null;
  cliente_correo?: string | null;
  cliente_telefono?: string | null;
  servicio_nombre?: string | null;
  fecha: string;
  hora: string;
  estado: ReservaEstado;
  observacion_admin?: string | null;
  creado_en?: string | null;
  updated_at?: string | null;
};

export type ReservasFilters = {
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  cliente_id?: number | string;
  servicio_id?: number | string;
  search?: string;
  page?: number;
  limit?: number;
};

export type ReservasResponse = {
  data: ReservaAdmin[];
  pagination: Pagination;
};

export type UpdateReservaEstadoPayload = {
  estado: ReservaEstado;
  observacion_admin?: string;
  motivo?: string;
};

export type ReagendarReservaPayload = {
  fecha: string;
  hora: string;
  observacion_admin?: string;
  motivo?: string;
};

const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toStringOrNull = (value: unknown) =>
  value === null || value === undefined ? null : String(value);

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildQuery = (filters: ReservasFilters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
};

const getArrayFromResponse = (response: unknown): unknown[] => {
  if (Array.isArray(response)) return response;
  if (!isRecord(response)) return [];
  const candidates = [response.data, response.reservas, response.items, response.results];
  const arrayCandidate = candidates.find(Array.isArray);
  return Array.isArray(arrayCandidate) ? arrayCandidate : [];
};

const getPaginationFromResponse = (
  response: unknown,
  fallback: ReservasFilters
): Pagination => {
  if (!isRecord(response)) {
    return {
      ...DEFAULT_PAGINATION,
      page: fallback.page ?? DEFAULT_PAGINATION.page,
      limit: fallback.limit ?? DEFAULT_PAGINATION.limit,
      total: Array.isArray(response) ? response.length : 0,
    };
  }

  const meta = isRecord(response.pagination)
    ? response.pagination
    : isRecord(response.meta)
      ? response.meta
      : response;
  const total = toNumber(meta.total, getArrayFromResponse(response).length);
  const limit = toNumber(meta.limit ?? meta.per_page, fallback.limit ?? 10);
  const page = toNumber(meta.page ?? meta.current_page, fallback.page ?? 1);
  const totalPages = toNumber(
    meta.totalPages ?? meta.total_pages ?? meta.last_page,
    Math.max(1, Math.ceil(total / Math.max(1, limit)))
  );

  return { page, limit, total, totalPages };
};

export const mapReservaAdmin = (item: unknown): ReservaAdmin => {
  const record = isRecord(item) ? item : {};
  const cliente = isRecord(record.cliente) ? record.cliente : {};
  const servicio = isRecord(record.servicio) ? record.servicio : {};

  return {
    id: toStringOrNull(record.id) ?? "",
    cliente_id: toStringOrNull(record.cliente_id ?? cliente.id),
    servicio_id: toStringOrNull(record.servicio_id ?? servicio.id),
    cliente_nombre:
      toStringOrNull(
        record.cliente_nombre ?? record.cliente ?? cliente.nombre ?? cliente.name
      ) ??
      "Cliente sin nombre",
    cliente_email: toStringOrNull(
      record.cliente_email ??
        record.cliente_correo ??
        record.correo ??
        cliente.email ??
        cliente.correo
    ),
    cliente_correo: toStringOrNull(
      record.cliente_correo ??
        record.cliente_email ??
        record.correo ??
        cliente.correo ??
        cliente.email
    ),
    cliente_telefono: toStringOrNull(
      record.cliente_telefono ?? record.telefono ?? cliente.telefono
    ),
    servicio_nombre:
      toStringOrNull(
        record.servicio_nombre ?? record.servicio ?? servicio.nombre ?? servicio.name
      ) ??
      "Servicio sin nombre",
    fecha: toStringOrNull(record.fecha) ?? "",
    hora: toStringOrNull(record.hora) ?? "",
    estado: toStringOrNull(record.estado) ?? "pendiente",
    observacion_admin: toStringOrNull(record.observacion_admin),
    creado_en: toStringOrNull(record.creado_en ?? record.created_at),
    updated_at: toStringOrNull(record.updated_at),
  };
};

export const listReservasAdmin = async (
  filters: ReservasFilters = {}
): Promise<ReservasResponse> => {
  const response = await apiFetch<unknown>(
    `/admin/reservas${buildQuery({ page: 1, limit: 10, ...filters })}`
  );
  const data = getArrayFromResponse(response).map(mapReservaAdmin);
  return {
    data,
    pagination: getPaginationFromResponse(response, filters),
  };
};

export const getReservaAdmin = async (id: number | string) => {
  const response = await apiFetch<unknown>(
    `/admin/reservas/${encodeURIComponent(String(id))}`
  );
  const source = isRecord(response)
    ? response.reserva ?? response.data ?? response
    : response;
  return mapReservaAdmin(source);
};

export const updateReservaEstadoAdmin = (
  id: number | string,
  payload: UpdateReservaEstadoPayload
) =>
  apiFetch<{ message?: string; reserva?: ReservaAdmin; data?: ReservaAdmin }>(
    `/admin/reservas/${encodeURIComponent(String(id))}/estado`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );

export const reagendarReservaAdmin = (
  id: number | string,
  payload: ReagendarReservaPayload
) =>
  apiFetch<{ message?: string; reserva?: ReservaAdmin; data?: ReservaAdmin }>(
    `/admin/reservas/${encodeURIComponent(String(id))}/reagendar`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );

export const deleteReservaAdmin = (id: number | string) =>
  apiFetch<{ message?: string; success?: boolean }>(
    `/admin/reservas/${encodeURIComponent(String(id))}`,
    {
      method: "DELETE",
    }
  );
