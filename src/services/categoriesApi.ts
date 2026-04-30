import { apiFetch } from "@/services/apiClient";

export type ServiceCategory = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  activo?: boolean;
  orden?: number;
};

const mapCategory = (item: any): ServiceCategory => ({
  id: Number(item.id),
  nombre: item.nombre ?? "",
  descripcion: item.descripcion ?? null,
  imagen_url: item.imagen_url ?? null,
  activo: Boolean(Number(item.activo ?? 0)),
  orden: Number(item.orden ?? 0),
});

export const listServiceCategories = async () => {
  const data = await apiFetch<any[]>("/categorias");
  return data.map(mapCategory);
};
