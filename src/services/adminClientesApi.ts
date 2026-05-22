import { apiFetch } from "@/services/apiClient";

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ClienteAdmin = {
  id: number | string;
  nombre: string;
  rut?: string | null;
  correo?: string | null;
  email?: string | null;
  telefono?: string | null;
  notas_admin?: string | null;
  activo?: boolean | number | string | null;
  creado_en?: string | null;
  updated_at?: string | null;
  total_reservas?: number;
  reservas_confirmadas?: number;
  reservas_canceladas?: number;
  ultima_reserva?: string | null;
  proxima_reserva?: string | null;
  reservas_recientes?: ClienteReservaResumen[];
};

export type ClienteReservaResumen = {
  id: number | string;
  servicio_nombre?: string | null;
  fecha?: string | null;
  hora?: string | null;
  estado?: string | null;
};

export type ClienteAdminPayload = Partial<
  Pick<
    ClienteAdmin,
    "nombre" | "rut" | "correo" | "email" | "telefono" | "notas_admin" | "activo"
  >
>;

export type ClientesFilters = {
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  direction?: "asc" | "desc" | string;
};

export type ClientesResponse = {
  data: ClienteAdmin[];
  pagination: Pagination;
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

const toBoolLike = (value: unknown) => {
  if (value === null || value === undefined) return value;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    return value === "1" || value.toLowerCase() === "true";
  }
  return Boolean(value);
};

const buildQuery = (filters: ClientesFilters) => {
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
  const candidates = [response.data, response.clientes, response.items, response.results];
  const arrayCandidate = candidates.find(Array.isArray);
  return Array.isArray(arrayCandidate) ? arrayCandidate : [];
};

const getPaginationFromResponse = (
  response: unknown,
  fallback: ClientesFilters
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

const mapReservaResumen = (item: unknown): ClienteReservaResumen => {
  const record = isRecord(item) ? item : {};
  return {
    id: toStringOrNull(record.id) ?? "",
    servicio_nombre: toStringOrNull(record.servicio_nombre ?? record.servicio),
    fecha: toStringOrNull(record.fecha),
    hora: toStringOrNull(record.hora),
    estado: toStringOrNull(record.estado),
  };
};

export const mapClienteAdmin = (item: unknown): ClienteAdmin => {
  const record = isRecord(item) ? item : {};
  const nestedCliente = isRecord(record.cliente) ? record.cliente : {};
  const estadisticas = isRecord(record.estadisticas) ? record.estadisticas : {};
  const source = Object.keys(nestedCliente).length > 0 ? nestedCliente : record;
  const reservasRecientes = Array.isArray(record.reservas_recientes)
    ? record.reservas_recientes.map(mapReservaResumen)
    : Array.isArray(record.reservas)
      ? record.reservas.map(mapReservaResumen)
      : [];

  return {
    id: toStringOrNull(source.id) ?? "",
    nombre: toStringOrNull(source.nombre ?? source.name) ?? "Cliente sin nombre",
    rut: toStringOrNull(source.rut),
    correo: toStringOrNull(source.correo),
    email: toStringOrNull(source.email ?? source.correo),
    telefono: toStringOrNull(source.telefono ?? source.phone),
    notas_admin: toStringOrNull(source.notas_admin),
    activo: toBoolLike(source.activo),
    creado_en: toStringOrNull(source.creado_en ?? source.created_at),
    updated_at: toStringOrNull(source.updated_at),
    total_reservas: toNumber(
      estadisticas.total_reservas ?? record.total_reservas,
      0
    ),
    reservas_confirmadas: toNumber(
      estadisticas.reservas_confirmadas ?? record.reservas_confirmadas,
      0
    ),
    reservas_canceladas: toNumber(
      estadisticas.reservas_canceladas ?? record.reservas_canceladas,
      0
    ),
    ultima_reserva: toStringOrNull(
      estadisticas.ultima_reserva ?? record.ultima_reserva
    ),
    proxima_reserva: toStringOrNull(
      estadisticas.proxima_reserva ?? record.proxima_reserva
    ),
    reservas_recientes: reservasRecientes,
  };
};

export const listClientesAdmin = async (
  filters: ClientesFilters = {}
): Promise<ClientesResponse> => {
  const response = await apiFetch<unknown>(
    `/admin/clientes${buildQuery({ page: 1, limit: 10, ...filters })}`
  );
  const data = getArrayFromResponse(response).map(mapClienteAdmin);
  return {
    data,
    pagination: getPaginationFromResponse(response, filters),
  };
};

export const getClienteAdmin = async (id: number | string) => {
  const response = await apiFetch<unknown>(
    `/admin/clientes/${encodeURIComponent(String(id))}`
  );
  const source = isRecord(response)
    ? response.cliente ?? response.data ?? response
    : response;
  return mapClienteAdmin(source);
};

export const updateClienteAdmin = (
  id: number | string,
  payload: ClienteAdminPayload
) =>
  apiFetch<{ message?: string; cliente?: ClienteAdmin; data?: ClienteAdmin }>(
    `/admin/clientes/${encodeURIComponent(String(id))}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );

export const patchClienteAdmin = (
  id: number | string,
  payload: ClienteAdminPayload
) =>
  apiFetch<{ message?: string; cliente?: ClienteAdmin; data?: ClienteAdmin }>(
    `/admin/clientes/${encodeURIComponent(String(id))}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );

export const deleteClienteAdmin = (id: number | string) =>
  apiFetch<{ message?: string; success?: boolean }>(
    `/admin/clientes/${encodeURIComponent(String(id))}`,
    {
      method: "DELETE",
    }
  );
