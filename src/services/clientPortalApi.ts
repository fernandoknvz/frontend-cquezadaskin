import { apiFetch } from "@/services/apiClient";
import { getClientToken } from "@/services/clientAuthStorage";

export type ClientePerfil = {
  id?: number | string | null;
  nombre?: string | null;
  correo?: string | null;
  email?: string | null;
  telefono?: string | null;
  preferencias_promociones?: boolean | number | string | null;
  acepta_promociones?: boolean | number | string | null;
  recibe_promociones?: boolean | number | string | null;
  creado_en?: string | null;
};

export type ClientePerfilPayload = Partial<
  Pick<
    ClientePerfil,
    | "nombre"
    | "correo"
    | "email"
    | "telefono"
    | "preferencias_promociones"
    | "acepta_promociones"
    | "recibe_promociones"
  >
>;

export type ClientePasswordPayload = {
  password_actual: string;
  password_nueva: string;
  password_confirmacion?: string;
};

export type ReservaClienteEstado =
  | "solicitada"
  | "pendiente"
  | "confirmada"
  | "reagendada"
  | "cancelada"
  | "completada"
  | string;

export type ReservaCliente = {
  id: number | string;
  servicio_id?: number | string | null;
  servicio_nombre?: string | null;
  nombre_servicio?: string | null;
  servicio?: string | null;
  fecha?: string | null;
  hora?: string | null;
  estado?: ReservaClienteEstado | null;
  observacion_admin?: string | null;
  creado_en?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ReservasClienteResponse = {
  proximas: ReservaCliente[];
  historial: ReservaCliente[];
  reservas: ReservaCliente[];
};

export type CancelarReservaClientePayload = {
  motivo?: string;
};

export type ReagendarReservaClientePayload = {
  fecha: string;
  hora: string;
  motivo?: string;
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

const pickRecord = (response: unknown, keys: string[]) => {
  if (!isRecord(response)) return {};

  for (const key of keys) {
    const value = response[key];
    if (isRecord(value)) return value;
  }

  if (isRecord(response.data)) {
    for (const key of keys) {
      const value = response.data[key];
      if (isRecord(value)) return value;
    }
  }

  return response;
};

const pickArray = (response: unknown, keys: string[]): unknown[] => {
  if (Array.isArray(response)) return response;
  if (!isRecord(response)) return [];

  for (const key of keys) {
    const value = response[key];
    if (Array.isArray(value)) return value;
  }

  if (isRecord(response.data)) {
    for (const key of keys) {
      const value = response.data[key];
      if (Array.isArray(value)) return value;
    }
  }

  return [];
};

export const mapClientePerfil = (item: unknown): ClientePerfil => {
  const record = pickRecord(item, ["cliente", "user", "perfil", "profile"]);
  return {
    id: toStringOrNull(record.id),
    nombre: toStringOrNull(record.nombre ?? record.name),
    correo: toStringOrNull(record.correo ?? record.email),
    email: toStringOrNull(record.email ?? record.correo),
    telefono: toStringOrNull(record.telefono ?? record.phone),
    preferencias_promociones: toBoolLike(
      record.preferencias_promociones ??
        record.acepta_promociones ??
        record.recibe_promociones
    ),
    acepta_promociones: toBoolLike(
      record.acepta_promociones ??
        record.preferencias_promociones ??
        record.recibe_promociones
    ),
    recibe_promociones: toBoolLike(
      record.recibe_promociones ??
        record.acepta_promociones ??
        record.preferencias_promociones
    ),
    creado_en: toStringOrNull(record.creado_en ?? record.created_at),
  };
};

export const mapReservaCliente = (item: unknown): ReservaCliente => {
  const record = isRecord(item) ? item : {};
  const servicio = isRecord(record.servicio) ? record.servicio : {};

  return {
    id: toStringOrNull(record.id) ?? "",
    servicio_id: toStringOrNull(record.servicio_id ?? servicio.id),
    servicio_nombre: toStringOrNull(
      record.servicio_nombre ??
        record.nombre_servicio ??
        record.servicio_name ??
        servicio.nombre ??
        servicio.name
    ),
    nombre_servicio: toStringOrNull(
      record.nombre_servicio ??
        record.servicio_nombre ??
        record.servicio_name ??
        servicio.nombre ??
        servicio.name
    ),
    servicio: toStringOrNull(record.servicio_texto ?? record.servicio),
    fecha: toStringOrNull(record.fecha),
    hora: toStringOrNull(record.hora),
    estado: toStringOrNull(record.estado) ?? "pendiente",
    observacion_admin: toStringOrNull(record.observacion_admin),
    creado_en: toStringOrNull(record.creado_en ?? record.created_at),
    created_at: toStringOrNull(record.created_at ?? record.creado_en),
    updated_at: toStringOrNull(record.updated_at),
  };
};

const normalizeReservasResponse = (response: unknown): ReservasClienteResponse => {
  const proximas = pickArray(response, ["proximas", "proximas_reservas"]).map(
    mapReservaCliente
  );
  const historial = pickArray(response, ["historial", "historial_reservas"]).map(
    mapReservaCliente
  );
  const reservas = pickArray(response, ["reservas", "items", "data"]).map(
    mapReservaCliente
  );

  if (proximas.length > 0 || historial.length > 0) {
    return {
      proximas,
      historial,
      reservas: reservas.length > 0 ? reservas : [...proximas, ...historial],
    };
  }

  return splitReservasByDate(reservas);
};

const splitReservasByDate = (reservas: ReservaCliente[]): ReservasClienteResponse => {
  const nowKey = new Date().toISOString().slice(0, 10);
  const proximas: ReservaCliente[] = [];
  const historial: ReservaCliente[] = [];

  reservas.forEach((reserva) => {
    const estado = (reserva.estado ?? "").toLowerCase();
    const fecha = reserva.fecha?.slice(0, 10) ?? "";
    const isHistorical =
      estado === "cancelada" || estado === "completada" || (fecha && fecha < nowKey);

    if (isHistorical) {
      historial.push(reserva);
    } else {
      proximas.push(reserva);
    }
  });

  return { proximas, historial, reservas };
};

export const getClienteMe = async (token = getClientToken()) => {
  const response = await apiFetch<unknown>("/clientes/me", {
    authToken: token,
  });
  return mapClientePerfil(response);
};

export const updateClienteMe = async (
  payload: ClientePerfilPayload,
  token = getClientToken()
) => {
  const response = await apiFetch<unknown>("/clientes/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
    authToken: token,
  });
  return mapClientePerfil(response);
};

export const updateClientePassword = (
  payload: ClientePasswordPayload,
  token = getClientToken()
) =>
  apiFetch<{ message?: string; success?: boolean }>("/clientes/me/password", {
    method: "PATCH",
    body: JSON.stringify(payload),
    authToken: token,
  });

export const getClienteReservas = async (token = getClientToken()) => {
  const response = await apiFetch<unknown>("/clientes/reservas", {
    authToken: token,
  });
  return normalizeReservasResponse(response);
};

export const cancelarReservaCliente = (
  id: number | string,
  payload: CancelarReservaClientePayload,
  token = getClientToken()
) =>
  apiFetch<{ message?: string; success?: boolean }>(
    `/clientes/reservas/${encodeURIComponent(String(id))}/cancelar`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
      authToken: token,
    }
  );

export const reagendarReservaCliente = (
  id: number | string,
  payload: ReagendarReservaClientePayload,
  token = getClientToken()
) =>
  apiFetch<{ message?: string; success?: boolean }>(
    `/clientes/reservas/${encodeURIComponent(String(id))}/reagendar`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
      authToken: token,
    }
  );
