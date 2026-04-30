import { apiFetch } from "@/services/apiClient";

export type AdminCita = {
  id: number;
  cliente: string;
  correo: string;
  telefono: string;
  servicio: string;
  servicio_id?: number;
  fecha: string;
  hora?: string | null;
  estado: string;
};

const mapCita = (item: any): AdminCita => ({
  id: Number(item.id),
  cliente: item.cliente ?? "",
  correo: item.correo ?? "",
  telefono: item.telefono ?? "",
  servicio: item.servicio ?? "",
  servicio_id: item.servicio_id ? Number(item.servicio_id) : undefined,
  fecha: item.fecha ?? "",
  hora: item.hora ?? null,
  estado: item.estado ?? "pendiente",
});

export const listCitasAdmin = async () => {
  const data = await apiFetch<any[]>("/citas");
  return data.map(mapCita);
};

export const updateCitaAdmin = (
  id: number,
  payload: { estado?: string; fecha?: string; hora?: string; servicio_id?: number }
) =>
  apiFetch<{ success: boolean; message: string }>(`/citas?id=${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteCitaAdmin = (id: number) =>
  apiFetch<{ success: boolean; message: string }>(`/citas?id=${id}`, {
    method: "DELETE",
  });
