import { apiFetch } from "@/services/apiClient";
import { getClientToken } from "@/services/clientAuthStorage";

export type ClienteProfile = {
  id?: number | string;
  nombre?: string;
  email?: string;
  correo?: string;
  telefono?: string;
  rut?: string;
};

export type ClienteCredentials = {
  email: string;
  password: string;
};

export type ClienteRegisterPayload = ClienteCredentials & {
  nombre: string;
  telefono: string;
  rut?: string;
  acepta_politica: boolean;
  recibe_promociones?: boolean;
};

type ClienteAuthResponse = {
  token?: string;
  access_token?: string;
  cliente?: ClienteProfile;
  user?: ClienteProfile;
  data?: {
    token?: string;
    access_token?: string;
    cliente?: ClienteProfile;
    user?: ClienteProfile;
  };
};

const extractToken = (response: ClienteAuthResponse) =>
  response.token ?? response.access_token ?? response.data?.token ?? response.data?.access_token;

const extractClient = (response: ClienteAuthResponse) =>
  response.cliente ?? response.user ?? response.data?.cliente ?? response.data?.user ?? null;

export const registerCliente = async (payload: ClienteRegisterPayload) => {
  const response = await apiFetch<ClienteAuthResponse>("/clientes/register", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });

  return {
    token: extractToken(response),
    cliente: extractClient(response),
  };
};

export const loginCliente = async (payload: ClienteCredentials) => {
  const response = await apiFetch<ClienteAuthResponse>("/clientes/login", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });

  return {
    token: extractToken(response),
    cliente: extractClient(response),
  };
};

export const getClienteMe = async (token = getClientToken()) => {
  const response = await apiFetch<ClienteAuthResponse>("/clientes/me", {
    authToken: token,
  });

  return extractClient(response) ?? response;
};
