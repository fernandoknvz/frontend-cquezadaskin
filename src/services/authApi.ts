import { apiFetch } from "@/services/apiClient";

export type AuthRole = "admin" | "superadmin" | string;

export type AuthUser = {
  id: number | string;
  username: string;
  email: string | null;
  rol: AuthRole;
};

type LoginPayload = {
  identifier: string;
  username: string;
  email?: string | null;
  password: string;
};

type LoginResponse = {
  success: boolean;
  token: string;
  user: AuthUser;
};

type MeResponse = {
  user: AuthUser;
};

export const loginRequest = (identifier: string, password: string) => {
  const trimmedIdentifier = identifier.trim();
  const payload: LoginPayload = {
    identifier: trimmedIdentifier,
    username: trimmedIdentifier,
    email: trimmedIdentifier.includes("@") ? trimmedIdentifier : null,
    password,
  };

  return apiFetch<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
};

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
