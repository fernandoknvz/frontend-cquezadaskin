import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/AuthContext";
import { requestPasswordReset } from "@/services/authApi";

export default function LoginPage() {
  const { login, user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "forgot">("login");

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/admin";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier || !password) {
      setError("Ingresa email o usuario y contraseña.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(trimmedIdentifier, password, remember);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setResetLoading(true);
    setResetMessage(null);
    setResetError(null);
    try {
      const email = resetEmail.trim();
      if (!email) {
        setResetError("Ingresa tu correo para continuar.");
        return;
      }
      const response = await requestPasswordReset(email);
      setResetMessage(response.message ?? "Revisa tu correo para continuar.");
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Error al enviar correo");
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
        <p className="mt-1 text-sm text-[#D6D6D6]">
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

            {error ? (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-300">
                {error}
              </div>
            ) : null}

            <Button
              className="w-full rounded-2xl h-12 bg-[#00D1C1] text-[#03110f] hover:bg-[#20E0D0]"
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>

            <label className="flex items-center gap-2 text-sm text-[#B8B8B8]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              No cerrar sesión
            </label>

            <button
              type="button"
              className="text-sm text-[#00D1C1] underline underline-offset-4 hover:text-[#20E0D0]"
              onClick={() => {
                setMode("forgot");
                setResetMessage(null);
                setResetError(null);
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

            {resetError ? (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-300">
                {resetError}
              </div>
            ) : resetMessage ? (
              <div className="rounded-2xl border border-[#00D1C1]/25 bg-[#00D1C1]/10 p-3 text-xs text-[#00D1C1]">
                {resetMessage}
              </div>
            ) : null}

            <Button
              className="w-full rounded-2xl h-12 bg-[#00D1C1] text-[#03110f] hover:bg-[#20E0D0]"
              disabled={resetLoading}
            >
              {resetLoading ? "Enviando..." : "Enviar correo de recuperación"}
            </Button>

            <button
              type="button"
              className="text-sm text-[#00D1C1] underline underline-offset-4 hover:text-[#20E0D0]"
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
