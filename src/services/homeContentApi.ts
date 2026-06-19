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
  imagen_url: resolveImageUrl(item.imagen_url, ""),
  video_embed: item.video_embed ?? "",
});

const pickItems = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];

  const candidates = [
    response.data,
    response.homeContent,
    response.home_content,
    response.items,
    response.content,
    response.results,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      if (Array.isArray(candidate.data)) return candidate.data;
      if (Array.isArray(candidate.items)) return candidate.items;
      if (Array.isArray(candidate.results)) return candidate.results;
    }
  }

  return [];
};

export const listHomeContent = async () => {
  const response = await apiFetch<any>("/home-content", { skipAuth: true });
  return pickItems(response).map(mapItem);
};
