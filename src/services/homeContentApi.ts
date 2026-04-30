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
  imagen_url: item.imagen_url ?? "",
  video_embed: item.video_embed ?? "",
});

export const listHomeContent = async () => {
  const data = await apiFetch<any[]>("/home-content");
  return data.map(mapItem);
};
