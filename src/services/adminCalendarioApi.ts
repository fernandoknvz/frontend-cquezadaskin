import { apiFetch } from "@/services/apiClient";
import {
  normalizeAvailabilityDateForApi,
  normalizeAvailabilityTimeForApi,
} from "@/lib/availabilitySlots";
import { dedupeReservasById } from "@/lib/reservaTime";

export type CalendarioEstado =
  | "solicitada"
  | "pendiente"
  | "confirmada"
  | "cancelada"
  | "completada"
  | "reagendada"
  | string;

export type CalendarioEvento = {
  id: number | string;
  cliente_id?: number | string | null;
  cliente_nombre?: string | null;
  cliente_correo?: string | null;
  cliente_email?: string | null;
  cliente_telefono?: string | null;
  servicio_id?: number | string | null;
  servicio_nombre?: string | null;
  fecha: string;
  hora: string;
  hora_fin?: string | null;
  duracion_min?: number | string | null;
  estado: CalendarioEstado;
  observacion_admin?: string | null;
  creado_en?: string | null;
  updated_at?: string | null;
};

export type DisponibilidadAdmin = {
  id: number | string;
  fecha: string;
  hora: string;
  hora_fin?: string | null;
  disponible?: boolean | number | string | null;
  tipo?: "disponibilidad" | "bloqueo" | string | null;
  estado?: string | null;
  reserva_id?: number | string | null;
  ocupado?: boolean | number | string | null;
  ocupada?: boolean | number | string | null;
  motivo?: string | null;
  updated_at?: string | null;
};

export type CalendarioFilters = {
  fecha_desde?: string;
  fecha_hasta?: string;
  estado?: string;
  servicio_id?: number | string;
  cliente_id?: number | string;
};

export type DisponibilidadFilters = {
  fecha?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  tipo?: string;
};

export type DisponibilidadPayload = {
  fecha: string;
  hora: string;
  disponible?: boolean;
  tipo?: string;
  motivo?: string;
};

export type DisponibilidadBulkPayload = {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  intervalo_minutos: number;
  estado: "disponible" | "no_disponible";
  motivo?: string;
};

export type DisponibilidadBulkResponse = {
  ok?: boolean;
  creados: number;
  omitidos: number;
  errores: string[];
  mensaje?: string;
  data?: DisponibilidadAdmin[];
};

export type DisponibilidadDiaResponse = {
  ok?: boolean;
  actualizados?: number;
  creados?: number;
  omitidos?: number;
  mensaje?: string;
  errores?: string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toStringOrNull = (value: unknown) =>
  value === null || value === undefined ? null : String(value);

const toBoolLike = (value: unknown) => {
  if (value === null || value === undefined) return value;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "si";
  }
  return Boolean(value);
};

const buildQuery = (
  filters: Record<string, string | number | undefined | null>
) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
};

const pickArray = (source: unknown, keys: string[]): unknown[] => {
  if (Array.isArray(source)) return source;
  if (!isRecord(source)) return [];

  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) return value;
    if (isRecord(value)) {
      const nested = pickArray(value, keys);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

const collectArrays = (source: unknown, keys: string[]): unknown[] => {
  const primary = pickArray(source, keys);
  if (primary.length > 0 && Array.isArray(source)) return primary;

  const collected = new Set<unknown>(primary);
  if (!isRecord(source)) return [...collected];

  keys.forEach((key) => {
    const value = source[key];
    if (Array.isArray(value)) {
      value.forEach((item) => collected.add(item));
    } else if (isRecord(value)) {
      collectArrays(value, keys).forEach((item) => collected.add(item));
    }
  });

  if (collected.size === 0) {
    Object.values(source).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach((item) => collected.add(item));
      } else if (isRecord(value)) {
        collectArrays(value, keys).forEach((item) => collected.add(item));
      }
    });
  }

  return [...collected];
};

export const mapCalendarioEvento = (item: unknown): CalendarioEvento => {
  const record = isRecord(item) ? item : {};
  const cliente = isRecord(record.cliente) ? record.cliente : {};
  const servicio = isRecord(record.servicio) ? record.servicio : {};

  return {
    id: toStringOrNull(record.id) ?? "",
    cliente_id: toStringOrNull(record.cliente_id ?? cliente.id),
    cliente_nombre:
      toStringOrNull(
        record.cliente_nombre ?? record.cliente_name ?? cliente.nombre ?? cliente.name
      ) ?? "Cliente sin nombre",
    cliente_correo: toStringOrNull(
      record.cliente_correo ??
        record.cliente_email ??
        record.correo ??
        cliente.correo ??
        cliente.email
    ),
    cliente_email: toStringOrNull(
      record.cliente_email ??
        record.cliente_correo ??
        record.email ??
        cliente.email ??
        cliente.correo
    ),
    cliente_telefono: toStringOrNull(
      record.cliente_telefono ?? record.telefono ?? cliente.telefono
    ),
    servicio_id: toStringOrNull(record.servicio_id ?? servicio.id),
    servicio_nombre:
      toStringOrNull(
        record.servicio_nombre ?? record.servicio_name ?? servicio.nombre ?? servicio.name
      ) ?? "Servicio sin nombre",
    fecha: toStringOrNull(record.fecha) ?? "",
    hora:
      toStringOrNull(record.hora ?? record.hora_inicio ?? record.start_time) ?? "",
    hora_fin: toStringOrNull(
      record.hora_fin ??
        record.hora_termino ??
        record.hora_fin_real ??
        record.end_time
    ),
    duracion_min: toStringOrNull(
      record.duracion_min ?? record.duracion ?? record.duracionMin
    ),
    estado: toStringOrNull(record.estado) ?? "pendiente",
    observacion_admin: toStringOrNull(record.observacion_admin),
    creado_en: toStringOrNull(record.creado_en ?? record.created_at),
    updated_at: toStringOrNull(record.updated_at),
  };
};

export const mapDisponibilidadAdmin = (item: unknown): DisponibilidadAdmin => {
  const record = isRecord(item) ? item : {};

  return {
    id: toStringOrNull(record.id) ?? "",
    fecha: toStringOrNull(record.fecha) ?? "",
    hora: toStringOrNull(record.hora) ?? "",
    hora_fin: toStringOrNull(
      record.hora_fin ??
        record.hora_termino ??
        record.hora_fin_real ??
        record.end_time
    ),
    disponible: toBoolLike(record.disponible),
    tipo: toStringOrNull(record.tipo ?? record.type) ?? "disponibilidad",
    estado: toStringOrNull(record.estado ?? record.status),
    reserva_id: toStringOrNull(
      record.reserva_id ?? record.reservaId ?? record.cita_id ?? record.citaId
    ),
    ocupado: toBoolLike(record.ocupado ?? record.reservado),
    ocupada: toBoolLike(record.ocupada),
    motivo: toStringOrNull(record.motivo ?? record.observacion),
    updated_at: toStringOrNull(record.updated_at),
  };
};

const mapEventosResponse = (response: unknown) =>
  dedupeReservasById(
    collectArrays(response, [
      "data",
      "eventos",
      "reservas",
      "calendario",
      "items",
    ]).map(mapCalendarioEvento)
  );

const mapDisponibilidadResponse = (response: unknown) =>
  collectArrays(response, [
    "data",
    "disponibilidad",
    "horarios",
    "bloqueos",
    "items",
  ]).map(mapDisponibilidadAdmin);

export const getCalendario = async (params: CalendarioFilters = {}) => {
  const response = await apiFetch<unknown>(
    `/admin/calendario${buildQuery(params)}`
  );
  return mapEventosResponse(response);
};

export const getCalendarioDia = async (fecha: string) => {
  const response = await apiFetch<unknown>(
    `/admin/calendario/dia${buildQuery({ fecha })}`
  );
  return mapEventosResponse(response);
};

export const getCalendarioSemana = async (fecha: string) => {
  const response = await apiFetch<unknown>(
    `/admin/calendario/semana${buildQuery({ fecha })}`
  );
  return mapEventosResponse(response);
};

export const getDisponibilidad = async (
  params: DisponibilidadFilters = {}
) => {
  const response = await apiFetch<unknown>(
    `/admin/disponibilidad${buildQuery(params)}`
  );
  return mapDisponibilidadResponse(response);
};

export const createDisponibilidad = (payload: DisponibilidadPayload) =>
  apiFetch<{ message?: string; data?: DisponibilidadAdmin }>(
    "/admin/disponibilidad",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

export const createDisponibilidadBulk = (payload: DisponibilidadBulkPayload) => {
  const apiPayload: DisponibilidadBulkPayload = {
    fecha: normalizeAvailabilityDateForApi(payload.fecha),
    hora_inicio: normalizeAvailabilityTimeForApi(payload.hora_inicio),
    hora_fin: normalizeAvailabilityTimeForApi(payload.hora_fin),
    intervalo_minutos: payload.intervalo_minutos,
    estado: payload.estado,
    motivo: payload.motivo ?? "",
  };

  return apiFetch<DisponibilidadBulkResponse>("/admin/disponibilidad/bulk", {
    method: "POST",
    body: JSON.stringify(apiPayload),
  });
};

export const bloquearDiaDisponibilidad = (fecha: string) =>
  apiFetch<DisponibilidadDiaResponse>("/admin/disponibilidad/bloquear-dia", {
    method: "POST",
    body: JSON.stringify({
      fecha: normalizeAvailabilityDateForApi(fecha),
    }),
  });

export const habilitarDiaDisponibilidad = (fecha: string) =>
  apiFetch<DisponibilidadDiaResponse>("/admin/disponibilidad/habilitar-dia", {
    method: "POST",
    body: JSON.stringify({
      fecha: normalizeAvailabilityDateForApi(fecha),
    }),
  });

export const updateDisponibilidad = (
  id: number | string,
  payload: Partial<DisponibilidadPayload>
) =>
  apiFetch<{ message?: string; data?: DisponibilidadAdmin }>(
    `/admin/disponibilidad/${encodeURIComponent(String(id))}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );

export const deleteDisponibilidad = (id: number | string) =>
  apiFetch<{ message?: string; success?: boolean }>(
    `/admin/disponibilidad/${encodeURIComponent(String(id))}`,
    {
      method: "DELETE",
    }
  );

export const deleteBloqueo = (id: number | string) =>
  apiFetch<{ message?: string; success?: boolean }>(
    `/admin/bloqueos/${encodeURIComponent(String(id))}`,
    {
      method: "DELETE",
    }
  );
