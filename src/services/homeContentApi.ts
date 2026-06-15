import { resolveImageUrl } from "@/lib/resolveImageUrl";
import { apiFetch } from "@/services/apiClient";

export type HomeContentItem = {
  id: number;
  titulo: string;
  subtitulo: string;
  imagen_url: string;
  video_embed?: string | null;
};

const mapItem = (item: any): HomeContentItem => ({
  id: Number(item.id),
  titulo: item.titulo ?? "",
  subtitulo: item.subtitulo ?? "",
  imagen_url: resolveImageUrl(item.imagen_url, "/img/banner.jpg"),
  video_embed: item.video_embed ?? "",
});

export const listHomeContent = async () => {
  const data = await apiFetch<any[]>("/home-content", { skipAuth: true });
  return data.map(mapItem);
};
