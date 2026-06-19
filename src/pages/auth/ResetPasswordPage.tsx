import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordRequest } from "@/services/authApi";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError("El enlace no es valido o falta el token.");
      return;
    }

    if (password.trim().length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const response = await resetPasswordRequest(token, password.trim());
      setMessage(response.message ?? "Contraseña actualizada.");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="premium-panel rounded-3xl p-8">
        <h1 className="premium-heading text-3xl font-semibold text-white">
          Restablecer contraseña
        </h1>
        <p className="mt-1 text-sm text-[#6d554b]">
          Ingresa una nueva contraseña para continuar.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva contraseña</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 rounded-2xl border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar contraseña</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-11 rounded-2xl border-white/10"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-300">
              {error}
            </div>
          ) : message ? (
            <div className="rounded-2xl border border-[#c69a86]/25 bg-[#c69a86]/10 p-3 text-xs text-[#c69a86]">
              {message}
            </div>
          ) : null}

          <Button
            className="w-full rounded-2xl h-12 bg-[#c69a86] text-[#4b3932] hover:bg-[#e8c2b5]"
            disabled={loading}
          >
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </Button>
        </form>
      </div>
    </div>
  );
}
