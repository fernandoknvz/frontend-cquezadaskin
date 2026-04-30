import { apiFetch } from "@/services/apiClient";

export type CreateCitaPayload = {
  nombre: string;
  email: string;
  telefono: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM (front) o HH:MM:SS (compat)
  servicio_id: number;
  rut?: string;
  duracion_min: 30 | 60 | 90;
};

export type CitaSlot = { fecha: string; hora: string } | string;

export type CreateCitaResponse = {
  message?: string;
  duracion_min: number;
  slots: CitaSlot[];
  cita_ids: number[];
};

const normalizeHora = (hora: string) => {
  const h = (hora ?? "").trim();
  // Si viene HH:MM -> convertir a HH:MM:SS
  if (/^\d{2}:\d{2}$/.test(h)) return `${h}:00`;
  return h;
};

export const createCita = (payload: CreateCitaPayload) => {
  const compatPayload = {
    ...payload,

    // 1) Alias típicos para correo
    correo: payload.email,
    mail: payload.email,

    // 2) Alias típicos para servicio
    servicioId: payload.servicio_id,
    service_id: payload.servicio_id,

    // 3) Alias típicos para duración
    duracion: payload.duracion_min,
    duracionMin: payload.duracion_min,

    // 4) Normalización hora
    hora: normalizeHora(payload.hora),
  };

  return apiFetch<CreateCitaResponse>("/citas", {
    method: "POST",
    body: JSON.stringify(compatPayload),
  });
};