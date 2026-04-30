import { apiFetch } from "@/services/apiClient";

export type AdminInstagramPost = {
  id: string;
  embed_url: string;
  activo: boolean;
  orden: number;
  actualizado_en?: string | null;
};

export type AdminInstagramPayload = Omit<AdminInstagramPost, "id" | "actualizado_en">;

type AdminInstagramPostRaw = {
  id: number | string;
  embed_url?: string | null;
  activo?: number | string | boolean | null;
  orden?: number | string | null;
  actualizado_en?: string | null;
};

const mapPost = (item: AdminInstagramPostRaw): AdminInstagramPost => ({
  id: String(item.id),
  embed_url: item.embed_url ?? "",
  activo: Boolean(Number(item.activo ?? 0)),
  orden: Number(item.orden ?? 0),
  actualizado_en: item.actualizado_en ?? null,
});

// ✅ Endpoint ADMIN (recomendado)
const ADMIN_INSTAGRAM_PATH = "/instagram";
// Si aún NO existe en backend, usa temporalmente: const ADMIN_INSTAGRAM_PATH = "/instagram";

export const listInstagramAdmin = async (): Promise<AdminInstagramPost[]> => {
  const data = await apiFetch<AdminInstagramPostRaw[]>(ADMIN_INSTAGRAM_PATH);
  return data.map(mapPost);
};

export const createInstagramAdmin = (payload: AdminInstagramPayload) =>
  apiFetch<{ id: number | string }>(ADMIN_INSTAGRAM_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateInstagramAdmin = (id: string, payload: Partial<AdminInstagramPayload>) =>
  apiFetch<{ success: boolean }>(`${ADMIN_INSTAGRAM_PATH}?id=${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteInstagramAdmin = (id: string) =>
  apiFetch<{ success: boolean }>(`${ADMIN_INSTAGRAM_PATH}?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });