import { apiFetch } from "@/services/apiClient";

export type AdminHomeContent = {
  id: string;
  titulo: string;
  subtitulo: string;
  imagen_url: string;
  video_embed?: string | null;
  actualizado_en?: string | null;
};

export type AdminHomeContentPayload = Omit<
  AdminHomeContent,
  "id" | "actualizado_en"
>;

const mapHomeContent = (item: any): AdminHomeContent => ({
  id: String(item.id),
  titulo: item.titulo ?? "",
  subtitulo: item.subtitulo ?? "",
  imagen_url: item.imagen_url ?? "",
  video_embed: item.video_embed ?? "",
  actualizado_en: item.actualizado_en ?? null,
});

export const listHomeContentAdmin = async () => {
  const data = await apiFetch<any[]>("/home-content");
  return data.map(mapHomeContent);
};

export const createHomeContentAdmin = (payload: AdminHomeContentPayload) =>
  apiFetch<{ id: number | string }>("/home-content", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateHomeContentAdmin = (
  id: string,
  payload: Partial<AdminHomeContentPayload>
) =>
  apiFetch<{ success: boolean }>(`/home-content?id=${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteHomeContentAdmin = (id: string) =>
  apiFetch<{ success: boolean }>(`/home-content?id=${id}`, {
    method: "DELETE",
  });
