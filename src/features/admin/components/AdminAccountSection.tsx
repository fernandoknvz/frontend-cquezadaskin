import { useEffect, useState, type FormEvent } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import {
  getAccount,
  updateAccount,
  type AccountUser,
} from "@/services/accountApi";

export const AdminAccountSection = () => {
  const toast = useToast();
  const [account, setAccount] = useState<AccountUser | null>(null);
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccount = async () => {
    setError(null);
    try {
      const data = await getAccount();
      setAccount(data.user);
      setEmail(data.user.email ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar cuenta");
    }
  };

  useEffect(() => {
    loadAccount();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!currentPassword.trim()) {
      setError("Debes ingresar tu contraseña actual.");
      return;
    }

    const trimmedEmail = email.trim();
    const currentEmail = account?.email ?? "";
    const wantsEmailChange = trimmedEmail !== currentEmail;
    const wantsPasswordChange = newPassword.trim() !== "";

    if (!wantsEmailChange && !wantsPasswordChange) {
      setError("No hay cambios para actualizar.");
      return;
    }

    if (wantsEmailChange && !trimmedEmail) {
      setError("Debes ingresar un correo valido.");
      return;
    }

    if (wantsPasswordChange && newPassword !== confirmPassword) {
      setError("Las nuevas contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        current_password: currentPassword.trim(),
        ...(wantsEmailChange ? { email: trimmedEmail } : {}),
        ...(wantsPasswordChange ? { new_password: newPassword.trim() } : {}),
      };
      const response = await updateAccount(payload);
      setAccount(response.user);
      setEmail(response.user.email ?? "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success({
        title: "Cuenta actualizada",
        description: "Los cambios quedaron guardados correctamente.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="premium-panel rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="premium-section-title text-3xl font-semibold">
            Cuenta administrativa
          </h2>
          <p className="mt-1 text-sm text-[#6d554b]">
            Actualiza tu correo y contraseña de acceso.
          </p>
        </div>
        <Button variant="outline" onClick={loadAccount}>
          Recargar datos
        </Button>
      </div>

      {account ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[#c69a86]/35 bg-[#c69a86]/10 p-3 text-sm text-[#6d554b]">
          Sesión iniciada como <strong className="text-[#c69a86]">{account.username}</strong> ({account.rol})
        </div>
      ) : null}

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="account-email">Correo de recuperacion</Label>
            <Input
              id="account-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@dominio.cl"
              type="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="account-current-password">Contraseña actual</Label>
            <Input
              id="account-current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="********"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="account-new-password">Nueva contraseña</Label>
            <Input
              id="account-new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Dejar en blanco si no cambia"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="account-confirm-password">
              Confirmar nueva contraseña
            </Label>
            <Input
              id="account-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repite la nueva contraseña"
            />
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Acción requerida</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </section>
  );
};

export default AdminAccountSection;
