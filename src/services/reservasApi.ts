import { apiFetch } from "@/services/apiClient";
import { getClientToken } from "@/services/clientAuthStorage";

export type CreateReservaPayload = {
  servicio_id: number;
  fecha: string;
  hora: string;
  duracion_min: number;
};

export type ClienteReserva = {
  id?: number | string;
  servicio_id?: number | string;
  servicio?: string;
  servicio_nombre?: string;
  nombre_servicio?: string;
  fecha?: string;
  hora?: string;
  estado?: "solicitada" | "confirmada" | "cancelada" | "pendiente" | string;
  created_at?: string;
  fecha_creacion?: string;
  createdAt?: string;
};

export const createReserva = (
  payload: CreateReservaPayload,
  token = getClientToken()
) =>
  apiFetch<{ message?: string; id?: number | string }>("/reservas", {
    method: "POST",
    body: JSON.stringify(payload),
    authToken: token,
  });

export const listClienteReservas = async (token = getClientToken()) => {
  const response = await apiFetch<
    ClienteReserva[] | { data?: ClienteReserva[]; reservas?: ClienteReserva[] }
  >("/clientes/reservas", {
    authToken: token,
  });

  return Array.isArray(response)
    ? response
    : response.data ?? response.reservas ?? [];
};
