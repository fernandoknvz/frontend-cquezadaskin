import { apiFetch } from "@/services/apiClient";

export type DisponibilidadSlot = {
  fecha: string;
  hora: string;
  activo?: number | boolean | string | null;
  disponible?: number | boolean | string | null;
  ocupada?: number | boolean | string | null;
  ocupado?: number | boolean | string | null;
  reservado?: number | boolean | string | null;
  reserva_id?: number | string | null;
  estado?: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toBoolLike = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (["1", "true", "si", "sí", "yes"].includes(normalized)) return true;
    if (["0", "false", "no"].includes(normalized)) return false;
  }
  return Boolean(value);
};

const isOccupiedSlot = (slot: DisponibilidadSlot) => {
  const estado = slot.estado?.toLowerCase() ?? "";
  return (
    estado === "reservado" ||
    estado === "reservada" ||
    estado === "ocupado" ||
    estado === "ocupada" ||
    Boolean(slot.reserva_id) ||
    toBoolLike(slot.ocupada) === true ||
    toBoolLike(slot.ocupado) === true ||
    toBoolLike(slot.reservado) === true
  );
};

const isAvailableSlot = (slot: DisponibilidadSlot) =>
  !isOccupiedSlot(slot) &&
  toBoolLike(slot.activo) !== false &&
  toBoolLike(slot.disponible) !== false;

const pickHoras = (response: unknown): unknown[] => {
  if (Array.isArray(response)) return response;
  if (!isRecord(response)) return [];
  if (Array.isArray(response.horas)) return response.horas;
  if (Array.isArray(response.slots)) return response.slots;
  if (Array.isArray(response.disponibilidad)) return response.disponibilidad;
  if (Array.isArray(response.data)) return response.data;
  if (isRecord(response.data)) return pickHoras(response.data);
  return [];
};

const mapHoraDisponible = (item: unknown) => {
  if (typeof item === "string") return item.slice(0, 5);
  if (!isRecord(item)) return null;

  const slot: DisponibilidadSlot = {
    fecha: String(item.fecha ?? ""),
    hora: String(item.hora ?? item.time ?? ""),
    activo: item.activo as DisponibilidadSlot["activo"],
    disponible: item.disponible as DisponibilidadSlot["disponible"],
    ocupada: item.ocupada as DisponibilidadSlot["ocupada"],
    ocupado: item.ocupado as DisponibilidadSlot["ocupado"],
    reservado: item.reservado as DisponibilidadSlot["reservado"],
    reserva_id: (item.reserva_id ??
      item.reservaId ??
      item.cita_id ??
      item.citaId) as DisponibilidadSlot["reserva_id"],
    estado: item.estado === undefined ? null : String(item.estado),
  };

  if (!slot.hora || !isAvailableSlot(slot)) return null;
  return slot.hora.slice(0, 5);
};

type DisponibilidadPorFechaOptions = {
  servicioId?: string | number;
  duracionMin?: string | number;
};

export const getDisponibilidadPorFecha = async (
  fecha: string,
  options: DisponibilidadPorFechaOptions = {}
) => {
  const params = new URLSearchParams({ fecha });
  if (options.servicioId) params.set("servicio_id", String(options.servicioId));
  if (options.duracionMin) params.set("duracion_min", String(options.duracionMin));

  const data = await apiFetch<unknown>(
    `/disponibilidad?${params.toString()}`,
    { skipAuth: true }
  );
  return pickHoras(data).map(mapHoraDisponible).filter(Boolean) as string[];
};

export const listDiasDisponibles = (desde: string, hasta: string) =>
  apiFetch<string[]>(
    `/disponibilidad?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(
      hasta
    )}&modo=dias`
  );

export const listSlotsDisponibles = (
  desde: string,
  hasta: string,
  includeInactive = false
) =>
  apiFetch<DisponibilidadSlot[]>(
    `/disponibilidad?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(
      hasta
    )}${includeInactive ? "&include_inactive=1" : ""}`
  );

export const createDisponibilidad = (payload: { fechas: string[]; horas: string[] }) =>
  apiFetch<{ message: string; total: number }>("/disponibilidad", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const deleteDisponibilidad = (payload: { fechas: string[]; horas: string[] }) =>
  apiFetch<{ message: string; total: number }>("/disponibilidad", {
    method: "DELETE",
    body: JSON.stringify(payload),
  });
