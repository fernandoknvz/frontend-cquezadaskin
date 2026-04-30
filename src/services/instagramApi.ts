import { apiFetch } from "@/services/apiClient";

export type InstagramPost = {
  id: number;
  embed_url: string;
  activo: boolean;
  orden: number;
};

type InstagramPostRaw = {
  id: number | string;
  embed_url?: string | null;
  activo?: number | string | boolean | null;
  orden?: number | string | null;
};

const mapPost = (item: InstagramPostRaw): InstagramPost => ({
  id: Number(item.id),
  embed_url: item.embed_url ?? "",
  activo: Boolean(Number(item.activo ?? 0)),
  orden: Number(item.orden ?? 0),
});

export const listInstagramPosts = async (): Promise<InstagramPost[]> => {
  const data = await apiFetch<InstagramPostRaw[]>("/instagram");
  return data.map(mapPost);
};