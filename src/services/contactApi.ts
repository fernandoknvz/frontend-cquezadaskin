import { apiFetch } from "@/services/apiClient";

export type ContactRequestPayload = {
  asunto: string;
  nombre: string;
  email: string;
  telefono?: string;
  mensaje: string;
};

export type ContactRequestResponse = {
  success: boolean;
  message: string;
};

export const sendContactRequest = (payload: ContactRequestPayload) =>
  apiFetch<ContactRequestResponse>("/contacto", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify(payload),
  });
