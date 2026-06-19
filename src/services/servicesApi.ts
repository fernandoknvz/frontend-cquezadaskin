import { apiFetch } from "@/services/apiClient";

export type ServiceItem = {
  id: number;
  nombre: string;
  etiqueta?: string | null;
  subtitulo?: string | null;
  descripcion?: string;
  beneficios?: string[];
  imagen_url?: string;
  precio?: number;
  activo?: boolean;
  orden?: number;
  categoria_id?: number | null;
  mostrar_servicios?: boolean;
  mostrar_especiales?: boolean;
  mostrar_empresas?: boolean;
  cta_primary_label?: string | null;
  cta_primary_url?: string | null;
  cta_secondary_label?: string | null;
  cta_secondary_url?: string | null;
};

const toBoolean = (value: any, fallback: boolean) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "si", "sí", "yes", "y"].includes(normalized)) return true;
  if (["0", "false", "no", "n"].includes(normalized)) return false;
  return fallback;
};

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

const mapService = (item: any): ServiceItem => ({
  id: Number(item.id),
  nombre: item.nombre ?? "",
  etiqueta: item.etiqueta ?? null,
  subtitulo: item.subtitulo ?? null,
  descripcion: item.descripcion ?? "",
  beneficios: parseBenefits(item.beneficios),
  imagen_url: item.imagen_url ?? item.image_url ?? item.imagenUrl ?? item.imagen ?? "",
  precio: Number(item.precio ?? 0),
  activo: toBoolean(item.activo, true),
  orden: Number(item.orden ?? 0),
  categoria_id: item.categoria_id ?? null,
  mostrar_servicios: toBoolean(
    item.mostrar_servicios ?? item.mostrar_home ?? item.visible_servicios ?? item.visible,
    true
  ),
  mostrar_especiales: toBoolean(
    item.mostrar_especiales ?? item.visible_especiales ?? item.visible,
    false
  ),
  mostrar_empresas: toBoolean(item.mostrar_empresas ?? item.visible_empresas ?? item.visible, false),
  cta_primary_label: item.cta_primary_label ?? null,
  cta_primary_url: item.cta_primary_url ?? null,
  cta_secondary_label: item.cta_secondary_label ?? null,
  cta_secondary_url: item.cta_secondary_url ?? null,
});

export type ServiceSection = "servicios" | "especiales" | "empresas";

const pickServices = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];

  const candidates = [
    response.data,
    response.servicios,
    response.services,
    response.items,
    response.results,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      if (Array.isArray(candidate.data)) return candidate.data;
      if (Array.isArray(candidate.servicios)) return candidate.servicios;
      if (Array.isArray(candidate.items)) return candidate.items;
      if (Array.isArray(candidate.results)) return candidate.results;
    }
  }

  return [];
};

export const listServices = async (section?: ServiceSection) => {
  const query = section
    ? `/servicios?public=1&section=${encodeURIComponent(section)}&seccion=${encodeURIComponent(
        section
      )}`
    : "/servicios?public=1";
  const response = await apiFetch<any>(query, {
    skipAuth: true,
  });
  return pickServices(response).map(mapService);
};
