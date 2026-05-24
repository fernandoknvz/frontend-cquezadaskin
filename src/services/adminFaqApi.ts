import { apiFetch } from "@/services/apiClient";
import {
  getArrayFromResponse,
  getRecordFromResponse,
  mapFAQItem,
  type FAQItem,
} from "@/services/faqApi";

export type AdminFAQPayload = {
  pregunta: string;
  respuesta: string;
  categoria?: string | null;
  orden?: number | null;
  activo?: boolean | null;
};

export const listFAQAdmin = async () => {
  const response = await apiFetch<unknown>("/admin/faq");
  return getArrayFromResponse(response, ["faq", "faqs", "items", "results"]).map(
    mapFAQItem
  );
};

export const getFAQAdmin = async (id: number | string) => {
  const response = await apiFetch<unknown>(
    `/admin/faq/${encodeURIComponent(String(id))}`
  );
  return mapFAQItem(getRecordFromResponse(response, ["faq", "item"]));
};

export const createFAQAdmin = (payload: AdminFAQPayload) =>
  apiFetch<{ message?: string; faq?: FAQItem; data?: FAQItem }>("/admin/faq", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const patchFAQAdmin = (id: number | string, payload: AdminFAQPayload) =>
  apiFetch<{ message?: string; faq?: FAQItem; data?: FAQItem }>(
    `/admin/faq/${encodeURIComponent(String(id))}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );

export const updateFAQAdmin = (id: number | string, payload: AdminFAQPayload) =>
  apiFetch<{ message?: string; faq?: FAQItem; data?: FAQItem }>(
    `/admin/faq/${encodeURIComponent(String(id))}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );

export const deleteFAQAdmin = (id: number | string) =>
  apiFetch<{ message?: string; success?: boolean }>(
    `/admin/faq/${encodeURIComponent(String(id))}`,
    {
      method: "DELETE",
    }
  );
