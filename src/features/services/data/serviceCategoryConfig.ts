import facialFallbackImage from "@/assets/skinspace-products.jpeg";
import miradaFallbackImage from "@/assets/skinspace-gloves-profile.jpeg";
import corporalFallbackImage from "@/assets/services/relajante.jpg";
import otrosFallbackImage from "@/assets/skinspace-device.jpeg";

export type OfficialServiceCategoryId =
  | "facial"
  | "diseno-mirada"
  | "corporal"
  | "otros-servicios";

export type OfficialServiceCategory = {
  id: OfficialServiceCategoryId;
  name: string;
  description: string;
  fallbackImage: string;
};

export const OFFICIAL_SERVICE_CATEGORIES: OfficialServiceCategory[] = [
  {
    id: "facial",
    name: "Facial",
    description:
      "Tratamientos faciales personalizados para limpiar, renovar, hidratar y potenciar la luminosidad natural de tu piel.",
    fallbackImage: facialFallbackImage,
  },
  {
    id: "diseno-mirada",
    name: "Diseño de mirada",
    description:
      "Servicios enfocados en cejas y pestañas para realzar la expresión del rostro con armonía y cuidado profesional.",
    fallbackImage: miradaFallbackImage,
  },
  {
    id: "corporal",
    name: "Corporal",
    description:
      "Tratamientos corporales orientados al bienestar, la relajación, el drenaje y el cuidado integral del cuerpo.",
    fallbackImage: corporalFallbackImage,
  },
  {
    id: "otros-servicios",
    name: "Otros servicios",
    description:
      "Procedimientos complementarios y técnicas estéticas especializadas disponibles previa evaluación personalizada.",
    fallbackImage: otrosFallbackImage,
  },
];

const normalizeCategoryText = (value?: string | null) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const getOfficialCategoryById = (id: OfficialServiceCategoryId) =>
  OFFICIAL_SERVICE_CATEGORIES.find((category) => category.id === id) ??
  OFFICIAL_SERVICE_CATEGORIES[OFFICIAL_SERVICE_CATEGORIES.length - 1];

export const getOfficialCategoryIdByName = (
  value?: string | null
): OfficialServiceCategoryId => {
  const normalized = normalizeCategoryText(value);

  if (
    normalized.includes("diseno") ||
    normalized.includes("mirada") ||
    normalized.includes("lash") ||
    normalized.includes("brow") ||
    normalized.includes("pestana") ||
    normalized.includes("ceja")
  ) {
    return "diseno-mirada";
  }

  if (
    normalized.includes("corporal") ||
    normalized.includes("masaje") ||
    normalized.includes("drenaje") ||
    normalized.includes("gluteo")
  ) {
    return "corporal";
  }

  if (normalized.includes("facial") || normalized.includes("rostro")) {
    return "facial";
  }

  return "otros-servicios";
};

export const getOfficialCategoryIdFromText = (
  values: Array<string | null | undefined>
): OfficialServiceCategoryId => {
  const combined = values.filter(Boolean).join(" ");
  return getOfficialCategoryIdByName(combined);
};
