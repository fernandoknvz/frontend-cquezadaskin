import { apiFetch } from "@/services/apiClient";

export type AdminService = {
  id: string;
  nombre: string;
  etiqueta?: string | null;
  subtitulo?: string | null;
  descripcion: string;
  beneficios?: string[] | null;
  imagen_url?: string;
  precio?: number;
  activo?: boolean;
  orden?: number;
  categoria_id?: number | null;
  mostrar_servicios?: boolean;
  mostrar_empresas?: boolean;
  cta_primary_label?: string | null;
  cta_primary_url?: string | null;
  cta_secondary_label?: string | null;
  cta_secondary_url?: string | null;
};

export type AdminServicePayload = Omit<AdminService, "id">;

const parseBenefits = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter((item) => item.trim().length > 0);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item)).filter((item) => item.trim().length > 0);
        }
      } catch {
        // ignore JSON parse errors
      }
    }
    return trimmed
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
};

const mapService = (item: any): AdminService => ({
  id: String(item.id),
  nombre: item.nombre ?? "",
  etiqueta: item.etiqueta ?? null,
  subtitulo: item.subtitulo ?? null,
  descripcion: item.descripcion ?? "",
  beneficios: parseBenefits(item.beneficios),
  imagen_url: item.imagen_url ?? "",
  precio: Number(item.precio ?? 0),
  activo: Boolean(Number(item.activo ?? 0)),
  orden: Number(item.orden ?? 0),
  categoria_id: item.categoria_id ?? null,
  mostrar_servicios: Boolean(Number(item.mostrar_servicios ?? 0)),
  mostrar_empresas: Boolean(Number(item.mostrar_empresas ?? 0)),
  cta_primary_label: item.cta_primary_label ?? null,
  cta_primary_url: item.cta_primary_url ?? null,
  cta_secondary_label: item.cta_secondary_label ?? null,
  cta_secondary_url: item.cta_secondary_url ?? null,
});

export const listServicesAdmin = async () => {
  const data = await apiFetch<any[]>("/servicios");
  return data.map(mapService);
};

export const createServiceAdmin = (payload: AdminServicePayload) =>
  apiFetch<{ id: number | string }>("/servicios", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateServiceAdmin = (
  id: string,
  payload: Partial<AdminServicePayload>
) =>
  apiFetch<{ message: string }>(`/servicios/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteServiceAdmin = (id: string) =>
  apiFetch<{ message: string }>(`/servicios/${id}`, {
    method: "DELETE",
  });
