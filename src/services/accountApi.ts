import { apiFetch } from "@/services/apiClient";

export type AccountUser = {
  id: number | string;
  username: string;
  rol: string;
  email?: string | null;
};

export type AccountResponse = {
  user: AccountUser;
};

export type UpdateAccountPayload = {
  email?: string;
  current_password: string;
  new_password?: string;
};

export const getAccount = () => apiFetch<AccountResponse>("/account");

export const updateAccount = (payload: UpdateAccountPayload) =>
  apiFetch<{ message: string; user: AccountUser }>("/account", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
