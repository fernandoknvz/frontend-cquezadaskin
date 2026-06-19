import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/AuthContext";
import { useToast } from "@/hooks/useToast";
import { requestPasswordReset } from "@/services/authApi";

export default function LoginPage() {
  const { login, user, token, loading: authLoading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot">("login");

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/admin";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier || !password) {
      toast.warning({
        title: "Faltan datos",
        description: "Ingresa email o usuario y contrasena.",
      });
      return;
    }

    setLoading(true);
    try {
      await login(trimmedIdentifier, password, remember);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error({
        title: "No pudimos iniciar sesión",
        description:
          err instanceof Error ? err.message : "Credenciales incorrectas",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setResetLoading(true);
    try {
      const email = resetEmail.trim();
      if (!email) {
        toast.warning({
          title: "Falta el correo",
          description: "Ingresa tu correo para continuar.",
        });
        return;
      }
      const response = await requestPasswordReset(email);
      toast.success({
        title: "Correo enviado",
        description: response.message ?? "Revisa tu correo para continuar.",
      });
    } catch (err) {
      toast.error({
        title: "No se pudo enviar el correo",
        description:
          err instanceof Error ? err.message : "Error al enviar correo",
      });
    } finally {
      setResetLoading(false);
    }
  };

  React.useEffect(() => {
    if (authLoading) return;
    if (token && user) {
      navigate("/admin", { replace: true });
    }
  }, [authLoading, token, user, navigate]);

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="premium-panel rounded-3xl p-8">
        <h1 className="premium-heading text-3xl font-semibold text-white">Acceso admin</h1>
        <p className="mt-1 text-sm text-[#6d554b]">
          Ingresa con tus credenciales para continuar.
        </p>

        {mode === "login" ? (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="identifier">Email o usuario</Label>
              <Input
                id="identifier"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="h-11 rounded-2xl border-white/10"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 rounded-2xl border-white/10"
                autoComplete="current-password"
              />
            </div>

            <Button
              className="w-full rounded-2xl h-12 bg-[#c69a86] text-[#4b3932] hover:bg-[#e8c2b5]"
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>

            <label className="flex items-center gap-2 text-sm text-[#7d6a61]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              No cerrar sesión
            </label>

            <button
              type="button"
              className="text-sm text-[#c69a86] underline underline-offset-4 hover:text-[#e8c2b5]"
              onClick={() => {
                setMode("forgot");
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleResetSubmit}>
            <div className="space-y-2">
              <Label htmlFor="reset-email">Correo</Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
                className="h-11 rounded-2xl border-white/10"
                autoComplete="email"
              />
            </div>

            <Button
              className="w-full rounded-2xl h-12 bg-[#c69a86] text-[#4b3932] hover:bg-[#e8c2b5]"
              disabled={resetLoading}
            >
              {resetLoading ? "Enviando..." : "Enviar correo de recuperación"}
            </Button>

            <button
              type="button"
              className="text-sm text-[#c69a86] underline underline-offset-4 hover:text-[#e8c2b5]"
              onClick={() => setMode("login")}
            >
              Volver al inicio de sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
