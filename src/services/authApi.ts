import { apiFetch } from "@/services/apiClient";

export type AuthUser = {
  id: number | string;
  username: string;
  rol: string;
  email?: string | null;
};

type LoginResponse = {
  success: boolean;
  token: string;
  user: AuthUser;
};

type MeResponse = {
  user: AuthUser;
};

export const loginRequest = (username: string, password: string) =>
  apiFetch<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const meRequest = () => apiFetch<MeResponse>("/me");

export const logoutRequest = () =>
  apiFetch<{ success: boolean }>("/logout", {
    method: "POST",
  });

export const requestPasswordReset = (email: string) =>
  apiFetch<{ message: string }>("/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const resetPasswordRequest = (token: string, password: string) =>
  apiFetch<{ message: string }>("/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
