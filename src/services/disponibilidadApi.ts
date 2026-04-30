import { apiFetch } from "@/services/apiClient";

export type DisponibilidadSlot = {
  fecha: string;
  hora: string;
  activo: number | boolean;
  ocupada: number | boolean;
};

export const getDisponibilidadPorFecha = async (fecha: string) => {
  const data = await apiFetch<{ fecha: string; horas: string[] }>(
    `/disponibilidad?fecha=${encodeURIComponent(fecha)}`
  );
  return data.horas ?? [];
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
