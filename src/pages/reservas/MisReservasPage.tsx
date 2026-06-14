import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  ClipboardList,
  History,
  LockKeyhole,
  LogIn,
  LogOut,
  MessageSquare,
  Pencil,
  RefreshCw,
  RotateCw,
  Send,
  ShieldCheck,
  Star,
  UserRound,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import {
  clearClientSession,
  getClientToken,
  setStoredClient,
} from "@/services/clientAuthStorage";
import {
  cancelarReservaCliente,
  getClienteMe,
  getClienteReservas,
  reagendarReservaCliente,
  updateClienteMe,
  updateClientePassword,
  type ClientePerfil,
  type ReservaCliente,
} from "@/services/clientPortalApi";
import {
  createValoracionCliente,
  listValoracionesCliente,
  type ValoracionCliente,
} from "@/services/clientValoracionesApi";
import {
  getMinimumBookableTimeForDate,
  getTodayKey,
  isBookableDateTime,
  SAME_DAY_BOOKING_LEAD_MESSAGE,
} from "@/lib/bookingTimeRules";

type PerfilForm = {
  nombre: string;
  email: string;
  telefono: string;
  aceptaPromociones: boolean;
};

type PasswordForm = {
  actual: string;
  nueva: string;
  confirmacion: string;
};

type CancelForm = {
  motivo: string;
};

type ReagendarForm = {
  fecha: string;
  hora: string;
  motivo: string;
};

type ActionMode = "cancelar" | "reagendar" | null;

type ValoracionForm = {
  cita_id: string;
  nombre_mostrado: string;
  comentario: string;
  puntuacion: string;
};

const emptyPerfilForm: PerfilForm = {
  nombre: "",
  email: "",
  telefono: "",
  aceptaPromociones: false,
};

const emptyPasswordForm: PasswordForm = {
  actual: "",
  nueva: "",
  confirmacion: "",
};

const emptyValoracionForm: ValoracionForm = {
  cita_id: "",
  nombre_mostrado: "",
  comentario: "",
  puntuacion: "5",
};

const estadoLabels: Record<string, string> = {
  solicitada: "Solicitada",
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  reagendada: "Reagendada",
  cancelada: "Cancelada",
  completada: "Completada",
};

const valoracionEstadoLabels: Record<string, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobada",
  rechazada: "Rechazada",
  rechazado: "Rechazada",
};

const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const timeLabel = (value?: string | null) =>
  value ? value.slice(0, 5) : "Sin hora";

const getReservaServicio = (reserva: ReservaCliente) =>
  reserva.servicio_nombre ??
  reserva.nombre_servicio ??
  reserva.servicio ??
  "Tratamiento CQuezadaSkin";

const getClienteEmail = (perfil: ClientePerfil | null) =>
  perfil?.email ?? perfil?.correo ?? "";

const isPromocionesEnabled = (perfil: ClientePerfil | null) => {
  const value =
    perfil?.acepta_promociones ??
    perfil?.preferencias_promociones ??
    perfil?.recibe_promociones;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    return value === "1" || value.toLowerCase() === "true";
  }
  return false;
};

const mapPerfilToForm = (perfil: ClientePerfil | null): PerfilForm => ({
  nombre: perfil?.nombre ?? "",
  email: getClienteEmail(perfil),
  telefono: perfil?.telefono ?? "",
  aceptaPromociones: isPromocionesEnabled(perfil),
});

const getEstadoClass = (estado?: string | null) => {
  const normalized = (estado ?? "pendiente").toLowerCase();
  if (normalized === "confirmada" || normalized === "completada") {
    return "border-[#00D1C1]/30 bg-[#00D1C1]/10 text-[#20E0D0]";
  }
  if (normalized === "cancelada") {
    return "border-red-400/30 bg-red-500/10 text-red-200";
  }
  if (normalized === "reagendada") {
    return "border-amber-300/30 bg-amber-400/10 text-amber-200";
  }
  if (normalized === "solicitada") {
    return "border-sky-300/30 bg-sky-400/10 text-sky-200";
  }
  return "border-white/10 bg-[#0B0F0F] text-[#D6D6D6]";
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const isUnauthorizedError = (error: unknown) =>
  error instanceof Error &&
  (error as Error & { status?: number }).status === 401;

export const MisReservasPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [token, setToken] = useState<string | null>(() => getClientToken());
  const [perfil, setPerfil] = useState<ClientePerfil | null>(null);
  const [perfilForm, setPerfilForm] = useState<PerfilForm>(emptyPerfilForm);
  const [passwordForm, setPasswordForm] =
    useState<PasswordForm>(emptyPasswordForm);
  const [proximas, setProximas] = useState<ReservaCliente[]>([]);
  const [historial, setHistorial] = useState<ReservaCliente[]>([]);
  const [valoraciones, setValoraciones] = useState<ValoracionCliente[]>([]);
  const [valoracionForm, setValoracionForm] =
    useState<ValoracionForm>(emptyValoracionForm);
  const [loading, setLoading] = useState(Boolean(getClientToken()));
  const [loadingValoraciones, setLoadingValoraciones] = useState(false);
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const [savingValoracion, setSavingValoracion] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<ReservaCliente | null>(
    null
  );
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [cancelForm, setCancelForm] = useState<CancelForm>({ motivo: "" });
  const [reagendarForm, setReagendarForm] = useState<ReagendarForm>({
    fecha: "",
    hora: "",
    motivo: "",
  });

  const clienteNombre = perfil?.nombre || "Cliente CQuezadaSkin";
  const clearNotification = useCallback(() => {
    toast.clear();
  }, [toast]);
  const clearErrorNotification = useCallback(() => {
    toast.clear();
  }, [toast]);
  const showSuccess = useCallback((title: string, description: string) => {
    toast.success({ title, description });
  }, [toast]);
  const showError = useCallback((description: string) => {
    toast.error({
      title: "No se pudo completar la accion",
      description,
    });
  }, [toast]);

  const loadPortal = useCallback(async () => {
    const currentToken = getClientToken();
    setToken(currentToken);

    if (!currentToken) {
      setLoading(false);
      setPerfil(null);
      setProximas([]);
      setHistorial([]);
      setValoraciones([]);
      return;
    }

    setLoading(true);
    clearErrorNotification();
    try {
      const [perfilResponse, reservasResponse, valoracionesResponse] = await Promise.all([
        getClienteMe(currentToken),
        getClienteReservas(currentToken),
        listValoracionesCliente(currentToken),
      ]);
      setPerfil(perfilResponse);
      setStoredClient(perfilResponse);
      setPerfilForm(mapPerfilToForm(perfilResponse));
      setValoracionForm((prev) => ({
        ...prev,
        nombre_mostrado: prev.nombre_mostrado || perfilResponse.nombre || "",
      }));
      setProximas(reservasResponse.proximas);
      setHistorial(reservasResponse.historial);
      setValoraciones(valoracionesResponse);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearClientSession();
        setToken(null);
      }
      setPerfil(null);
      setProximas([]);
      setHistorial([]);
      setValoraciones([]);
      showError(
        getErrorMessage(err, "No se pudo cargar la información de tu cuenta")
      );
    } finally {
      setLoading(false);
    }
  }, [clearErrorNotification, showError]);

  useEffect(() => {
    loadPortal();
  }, [loadPortal]);

  const totalReservas = useMemo(
    () => proximas.length + historial.length,
    [historial.length, proximas.length]
  );

  const handleLogoutClient = () => {
    clearClientSession();
    setToken(null);
    setPerfil(null);
    setProximas([]);
    setHistorial([]);
    setValoraciones([]);
    setSelectedReserva(null);
    setActionMode(null);
    navigate("/agendar");
  };

  const loadValoraciones = useCallback(async () => {
    const currentToken = getClientToken();
    if (!currentToken) return;

    setLoadingValoraciones(true);
    clearErrorNotification();
    try {
      const data = await listValoracionesCliente(currentToken);
      setValoraciones(data);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearClientSession();
        setToken(null);
      }
      showError(getErrorMessage(err, "No se pudieron cargar tus valoraciones"));
    } finally {
      setLoadingValoraciones(false);
    }
  }, [clearErrorNotification, showError]);

  const handlePerfilSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;

    setSavingPerfil(true);
    clearNotification();
    try {
      const updated = await updateClienteMe(
        {
          nombre: perfilForm.nombre.trim(),
          email: perfilForm.email.trim(),
          correo: perfilForm.email.trim(),
          telefono: perfilForm.telefono.trim(),
          acepta_promociones: perfilForm.aceptaPromociones,
          preferencias_promociones: perfilForm.aceptaPromociones,
        },
        token
      );
      setPerfil(updated);
      setStoredClient(updated);
      setPerfilForm(mapPerfilToForm(updated));
      showSuccess(
        "Perfil actualizado",
        "Tus datos fueron guardados correctamente."
      );
    } catch (err) {
      showError(getErrorMessage(err, "No se pudo actualizar tu perfil"));
    } finally {
      setSavingPerfil(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;

    if (passwordForm.nueva.length < 8) {
      showError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (passwordForm.nueva !== passwordForm.confirmacion) {
      showError("La confirmación de contraseña no coincide");
      return;
    }

    setSavingPassword(true);
    clearNotification();
    try {
      await updateClientePassword(
        {
          password_actual: passwordForm.actual,
          password_nueva: passwordForm.nueva,
          password_confirmacion: passwordForm.confirmacion,
        },
        token
      );
      setPasswordForm(emptyPasswordForm);
      showSuccess(
        "Contraseña actualizada",
        "Tu nueva contraseña fue guardada correctamente."
      );
    } catch (err) {
      showError(getErrorMessage(err, "No se pudo actualizar la contraseña"));
    } finally {
      setSavingPassword(false);
    }
  };

  const openCancelAction = (reserva: ReservaCliente) => {
    setSelectedReserva(reserva);
    setActionMode("cancelar");
    setCancelForm({ motivo: "" });
    clearNotification();
  };

  const openReagendarAction = (reserva: ReservaCliente) => {
    setSelectedReserva(reserva);
    setActionMode("reagendar");
    setReagendarForm({
      fecha: reserva.fecha?.slice(0, 10) ?? "",
      hora: reserva.hora?.slice(0, 5) ?? "",
      motivo: "",
    });
    clearNotification();
  };

  const closeActionPanel = () => {
    setSelectedReserva(null);
    setActionMode(null);
  };

  const handleCancelarReserva = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !selectedReserva) return;

    setSavingAction(true);
    clearNotification();
    try {
      await cancelarReservaCliente(
        selectedReserva.id,
        { motivo: cancelForm.motivo.trim() },
        token
      );
      showSuccess(
        "Reserva cancelada",
        "Tu reserva fue cancelada correctamente."
      );
      closeActionPanel();
      await loadPortal();
    } catch (err) {
      showError(
        getErrorMessage(
          err,
          "No se pudo cancelar la reserva. Revisa si está muy próxima, ya fue cancelada o no está disponible para cambios."
        )
      );
    } finally {
      setSavingAction(false);
    }
  };

  const handleReagendarReserva = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !selectedReserva) return;

    if (!isBookableDateTime(reagendarForm.fecha, reagendarForm.hora)) {
      showError(SAME_DAY_BOOKING_LEAD_MESSAGE);
      return;
    }

    setSavingAction(true);
    clearNotification();
    try {
      await reagendarReservaCliente(
        selectedReserva.id,
        {
          fecha: reagendarForm.fecha,
          hora: reagendarForm.hora,
          motivo: reagendarForm.motivo.trim(),
        },
        token
      );
      showSuccess(
        "Solicitud enviada",
        "Tu solicitud de reagendamiento fue enviada correctamente."
      );
      closeActionPanel();
      await loadPortal();
    } catch (err) {
      showError(
        getErrorMessage(
          err,
          "No se pudo reagendar la reserva. El horario podría no estar disponible."
        )
      );
    } finally {
      setSavingAction(false);
    }
  };

  const handleValoracionSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;

    const comentario = valoracionForm.comentario.trim();
    const nombreMostrado = valoracionForm.nombre_mostrado.trim();
    const puntuacion = Number(valoracionForm.puntuacion);

    if (!nombreMostrado) {
      showError("Ingresa el nombre que quieres mostrar en la valoracion");
      return;
    }

    if (comentario.length < 10) {
      showError("Cuentanos un poco mas sobre tu experiencia");
      return;
    }

    if (!Number.isFinite(puntuacion) || puntuacion < 1 || puntuacion > 5) {
      showError("Selecciona una puntuacion entre 1 y 5");
      return;
    }

    setSavingValoracion(true);
    clearNotification();
    try {
      await createValoracionCliente(
        {
          cita_id: valoracionForm.cita_id || null,
          nombre_mostrado: nombreMostrado,
          comentario,
          puntuacion,
        },
        token
      );
      setValoracionForm({
        ...emptyValoracionForm,
        nombre_mostrado: nombreMostrado,
      });
      showSuccess(
        "Valoración enviada",
        "Tu valoración fue enviada y quedará pendiente de revisión."
      );
      await loadValoraciones();
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearClientSession();
        setToken(null);
      }
      showError(getErrorMessage(err, "No se pudo enviar tu valoracion"));
    } finally {
      setSavingValoracion(false);
    }
  };

  if (!token) {
    return (
      <section className="mx-auto w-[92%] max-w-5xl py-10 sm:py-14">
        <Card className="rounded-2xl border-white/10 bg-[#121212] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <LogIn className="h-5 w-5 text-[#00D1C1]" />
              Inicia sesión como cliente
            </CardTitle>
            <CardDescription>
              Ingresa desde el flujo de agenda para ver tu cuenta y reservas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="rounded-2xl bg-[#00D1C1] text-[#03110f] hover:bg-[#20E0D0]"
            >
              <Link to="/agendar">Ir a agendar</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-[92%] max-w-6xl py-8 text-white sm:py-14">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#00D1C1]">
            Área cliente
          </p>
          <h1 className="premium-heading mt-2 text-3xl font-semibold min-[390px]:text-4xl sm:text-6xl">
            Mi cuenta
          </h1>
          <p className="mt-3 max-w-2xl text-base text-[#D6D6D6] sm:text-lg">
            Revisa tu perfil, próximas reservas, historial y seguridad de tu
            cuenta CQuezadaSkin.
          </p>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 min-[430px]:grid-cols-3 sm:flex sm:w-auto sm:flex-wrap">
          <Button variant="outline" asChild>
            <Link to="/agendar">Nueva reserva</Link>
          </Button>
          <Button variant="outline" onClick={loadPortal} disabled={loading}>
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Actualizar
          </Button>
          <Button variant="outline" onClick={handleLogoutClient}>
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-[#121212] p-6 text-sm text-[#B8B8B8]">
          Cargando tu cuenta...
        </div>
      ) : (
        <div className="mt-8 grid gap-6">
          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <ProfileCard
              clienteNombre={clienteNombre}
              perfilForm={perfilForm}
              saving={savingPerfil}
              totalReservas={totalReservas}
              onChange={setPerfilForm}
              onSubmit={handlePerfilSubmit}
            />
            <SecurityCard
              passwordForm={passwordForm}
              saving={savingPassword}
              onChange={setPasswordForm}
              onSubmit={handlePasswordSubmit}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <ReservasSection
              title="Próximas reservas"
              description="Gestiona tus próximas solicitudes y reservas."
              icon={<ClipboardList className="h-5 w-5 text-[#00D1C1]" />}
              emptyTitle="No tienes próximas reservas"
              reservas={proximas}
              showActions
              onCancel={openCancelAction}
              onReagendar={openReagendarAction}
            />
            <ReservasSection
              title="Historial"
              description="Reservas pasadas, completadas o canceladas."
              icon={<History className="h-5 w-5 text-[#00D1C1]" />}
              emptyTitle="Aún no hay historial"
              reservas={historial}
              showActions={false}
              onCancel={openCancelAction}
              onReagendar={openReagendarAction}
            />
          </section>

          <MisValoracionesSection
            reservas={historial}
            valoraciones={valoraciones}
            form={valoracionForm}
            loading={loadingValoraciones}
            saving={savingValoracion}
            onRefresh={loadValoraciones}
            onChange={setValoracionForm}
            onSubmit={handleValoracionSubmit}
          />

          {selectedReserva && actionMode ? (
            <ActionPanel
              mode={actionMode}
              reserva={selectedReserva}
              cancelForm={cancelForm}
              reagendarForm={reagendarForm}
              saving={savingAction}
              onCancelFormChange={setCancelForm}
              onReagendarFormChange={setReagendarForm}
              onClose={closeActionPanel}
              onSubmitCancel={handleCancelarReserva}
              onSubmitReagendar={handleReagendarReserva}
            />
          ) : null}
        </div>
      )}
    </section>
  );
};

function ProfileCard({
  clienteNombre,
  perfilForm,
  saving,
  totalReservas,
  onChange,
  onSubmit,
}: {
  clienteNombre: string;
  perfilForm: PerfilForm;
  saving: boolean;
  totalReservas: number;
  onChange: React.Dispatch<React.SetStateAction<PerfilForm>>;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <Card className="rounded-2xl border-white/10 bg-[#121212] text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <UserRound className="h-5 w-5 text-[#00D1C1]" />
          Perfil
        </CardTitle>
        <CardDescription>
          Hola, {clienteNombre}. Mantén tus datos de contacto actualizados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="cliente-nombre">Nombre</Label>
            <Input
              id="cliente-nombre"
              value={perfilForm.nombre}
              onChange={(event) =>
                onChange((prev) => ({ ...prev, nombre: event.target.value }))
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cliente-email">Email / correo</Label>
            <Input
              id="cliente-email"
              type="email"
              value={perfilForm.email}
              onChange={(event) =>
                onChange((prev) => ({ ...prev, email: event.target.value }))
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cliente-telefono">Teléfono</Label>
            <Input
              id="cliente-telefono"
              value={perfilForm.telefono}
              onChange={(event) =>
                onChange((prev) => ({ ...prev, telefono: event.target.value }))
              }
              required
            />
          </div>
          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0B0F0F] p-4 text-sm text-[#D6D6D6]">
            <input
              type="checkbox"
              checked={perfilForm.aceptaPromociones}
              onChange={(event) =>
                onChange((prev) => ({
                  ...prev,
                  aceptaPromociones: event.target.checked,
                }))
              }
              className="mt-1"
            />
            Acepto recibir novedades y promociones de CQuezadaSkin.
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#8E8E8E]">
              {totalReservas} reservas registradas en tu cuenta.
            </p>
            <Button
              type="submit"
              className="rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0]"
              disabled={saving}
            >
              <Pencil className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar perfil"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SecurityCard({
  passwordForm,
  saving,
  onChange,
  onSubmit,
}: {
  passwordForm: PasswordForm;
  saving: boolean;
  onChange: React.Dispatch<React.SetStateAction<PasswordForm>>;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <Card className="rounded-2xl border-white/10 bg-[#121212] text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ShieldCheck className="h-5 w-5 text-[#00D1C1]" />
          Seguridad
        </CardTitle>
        <CardDescription>
          Cambia tu contraseña sin guardar datos sensibles en el navegador.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="password-actual">Contraseña actual</Label>
            <Input
              id="password-actual"
              type="password"
              value={passwordForm.actual}
              onChange={(event) =>
                onChange((prev) => ({ ...prev, actual: event.target.value }))
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password-nueva">Nueva contraseña</Label>
            <Input
              id="password-nueva"
              type="password"
              value={passwordForm.nueva}
              onChange={(event) =>
                onChange((prev) => ({ ...prev, nueva: event.target.value }))
              }
              minLength={8}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password-confirmacion">
              Confirmar nueva contraseña
            </Label>
            <Input
              id="password-confirmacion"
              type="password"
              value={passwordForm.confirmacion}
              onChange={(event) =>
                onChange((prev) => ({
                  ...prev,
                  confirmacion: event.target.value,
                }))
              }
              minLength={8}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-fit rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0]"
            disabled={saving}
          >
            <LockKeyhole className="h-4 w-4" />
            {saving ? "Guardando..." : "Cambiar contraseña"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ReservasSection({
  title,
  description,
  icon,
  emptyTitle,
  reservas,
  showActions,
  onCancel,
  onReagendar,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  emptyTitle: string;
  reservas: ReservaCliente[];
  showActions: boolean;
  onCancel: (reserva: ReservaCliente) => void;
  onReagendar: (reserva: ReservaCliente) => void;
}) {
  return (
    <Card className="rounded-2xl border-white/10 bg-[#121212] text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {reservas.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0B0F0F] p-5 text-sm text-[#A8A8A8]">
            {emptyTitle}
          </div>
        ) : (
          <div className="grid gap-4">
            {reservas.map((reserva) => (
              <ReservaCard
                key={`${reserva.id}-${reserva.fecha}-${reserva.hora}`}
                reserva={reserva}
                showActions={showActions}
                onCancel={onCancel}
                onReagendar={onReagendar}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReservaCard({
  reserva,
  showActions,
  onCancel,
  onReagendar,
}: {
  reserva: ReservaCliente;
  showActions: boolean;
  onCancel: (reserva: ReservaCliente) => void;
  onReagendar: (reserva: ReservaCliente) => void;
}) {
  const estado = (reserva.estado ?? "pendiente").toLowerCase();
  const canManage = showActions && estado !== "cancelada" && estado !== "completada";

  return (
    <article className="rounded-2xl border border-white/10 bg-[#0B0F0F] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {getReservaServicio(reserva)}
          </h3>
          <div className="mt-3 grid gap-2 text-sm text-[#D6D6D6] sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#00D1C1]" />
              {formatDate(reserva.fecha)}
            </p>
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#00D1C1]" />
              {timeLabel(reserva.hora)}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getEstadoClass(
            estado
          )}`}
        >
          {estadoLabels[estado] ?? estado}
        </span>
      </div>

      {reserva.observacion_admin ? (
        <p className="mt-4 rounded-2xl border border-white/10 bg-[#121212] p-3 text-sm text-[#A8A8A8]">
          {reserva.observacion_admin}
        </p>
      ) : null}

      {canManage ? (
      <div className="mt-4 grid gap-2 min-[430px]:grid-cols-2 sm:flex sm:flex-wrap">
          <Button variant="outline" size="sm" onClick={() => onReagendar(reserva)}>
            <RotateCw className="h-4 w-4" />
            Reagendar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-red-400/30 text-red-300 hover:bg-red-500/10 hover:text-red-300"
            onClick={() => onCancel(reserva)}
          >
            <XCircle className="h-4 w-4" />
            Cancelar
          </Button>
        </div>
      ) : null}
    </article>
  );
}

function MisValoracionesSection({
  reservas,
  valoraciones,
  form,
  loading,
  saving,
  onRefresh,
  onChange,
  onSubmit,
}: {
  reservas: ReservaCliente[];
  valoraciones: ValoracionCliente[];
  form: ValoracionForm;
  loading: boolean;
  saving: boolean;
  onRefresh: () => void;
  onChange: React.Dispatch<React.SetStateAction<ValoracionForm>>;
  onSubmit: (event: FormEvent) => void;
}) {
  const reservasElegibles = reservas.filter((reserva) => {
    const estado = (reserva.estado ?? "").toLowerCase();
    return estado === "completada" || estado === "confirmada" || estado === "";
  });

  return (
    <Card className="rounded-2xl border-white/10 bg-[#121212] text-white">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MessageSquare className="h-5 w-5 text-[#00D1C1]" />
              Mis valoraciones
            </CardTitle>
            <CardDescription>
              Comparte tu experiencia. La valoracion sera revisada antes de
              publicarse.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="valoracion-cita">Reserva asociada opcional</Label>
              <select
                id="valoracion-cita"
                value={form.cita_id}
                onChange={(event) =>
                  onChange((prev) => ({ ...prev, cita_id: event.target.value }))
                }
                className="h-11 rounded-2xl border border-white/10 bg-[#0B0F0F] px-3 text-sm text-white outline-none focus:border-[#00D1C1]/70 focus:ring-2 focus:ring-[#00D1C1]/30"
              >
                <option value="">Sin asociar a una reserva</option>
                {reservasElegibles.map((reserva) => (
                  <option key={String(reserva.id)} value={String(reserva.id)}>
                    {getReservaServicio(reserva)} - {formatDate(reserva.fecha)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="valoracion-nombre">Nombre a mostrar</Label>
              <Input
                id="valoracion-nombre"
                value={form.nombre_mostrado}
                onChange={(event) =>
                  onChange((prev) => ({
                    ...prev,
                    nombre_mostrado: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="valoracion-puntuacion">Puntuacion</Label>
              <select
                id="valoracion-puntuacion"
                value={form.puntuacion}
                onChange={(event) =>
                  onChange((prev) => ({
                    ...prev,
                    puntuacion: event.target.value,
                  }))
                }
                className="h-11 rounded-2xl border border-white/10 bg-[#0B0F0F] px-3 text-sm text-white outline-none focus:border-[#00D1C1]/70 focus:ring-2 focus:ring-[#00D1C1]/30"
              >
                <option value="5">5 estrellas</option>
                <option value="4">4 estrellas</option>
                <option value="3">3 estrellas</option>
                <option value="2">2 estrellas</option>
                <option value="1">1 estrella</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="valoracion-comentario">Comentario</Label>
              <Textarea
                id="valoracion-comentario"
                value={form.comentario}
                onChange={(event) =>
                  onChange((prev) => ({
                    ...prev,
                    comentario: event.target.value,
                  }))
                }
                required
              />
            </div>
            <p className="rounded-2xl border border-white/10 bg-[#0B0F0F] p-3 text-xs text-[#A8A8A8]">
              Tu valoración fue enviada y quedará pendiente de revisión.
            </p>
            <Button
              type="submit"
              className="w-fit rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0]"
              disabled={saving}
            >
              <Send className="h-4 w-4" />
              {saving ? "Enviando..." : "Enviar valoracion"}
            </Button>
          </form>

          <div className="grid gap-3">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-[#0B0F0F] p-5 text-sm text-[#A8A8A8]">
                Cargando tus valoraciones...
              </div>
            ) : valoraciones.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#0B0F0F] p-5 text-sm text-[#A8A8A8]">
                Aun no has enviado valoraciones.
              </div>
            ) : (
              valoraciones.map((valoracion) => (
                <article
                  key={String(valoracion.id)}
                  className="rounded-2xl border border-white/10 bg-[#0B0F0F] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">
                        {valoracion.nombre_mostrado}
                      </h3>
                      <StarRating value={valoracion.puntuacion} />
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getValoracionEstadoClass(
                        valoracion.estado
                      )}`}
                    >
                      {valoracionEstadoLabels[valoracion.estado] ??
                        valoracion.estado}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[#D6D6D6]">
                    {valoracion.comentario}
                  </p>
                  {valoracion.respuesta_admin ? (
                    <p className="mt-4 rounded-2xl border border-[#00D1C1]/20 bg-[#00D1C1]/10 p-3 text-sm text-[#D6D6D6]">
                      {valoracion.respuesta_admin}
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="mt-2 flex items-center gap-0.5" aria-label={`${value} de 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < value ? "fill-[#00D1C1] text-[#00D1C1]" : "text-[#3A3A3A]"
          }`}
        />
      ))}
    </div>
  );
}

const getValoracionEstadoClass = (estado?: string | null) => {
  const normalized = (estado ?? "pendiente").toLowerCase();
  if (normalized === "aprobado") {
    return "border-[#00D1C1]/30 bg-[#00D1C1]/10 text-[#20E0D0]";
  }
  if (normalized === "rechazado" || normalized === "rechazada") {
    return "border-red-400/30 bg-red-500/10 text-red-200";
  }
  return "border-amber-300/30 bg-amber-400/10 text-amber-200";
};

function ActionPanel({
  mode,
  reserva,
  cancelForm,
  reagendarForm,
  saving,
  onCancelFormChange,
  onReagendarFormChange,
  onClose,
  onSubmitCancel,
  onSubmitReagendar,
}: {
  mode: ActionMode;
  reserva: ReservaCliente;
  cancelForm: CancelForm;
  reagendarForm: ReagendarForm;
  saving: boolean;
  onCancelFormChange: React.Dispatch<React.SetStateAction<CancelForm>>;
  onReagendarFormChange: React.Dispatch<React.SetStateAction<ReagendarForm>>;
  onClose: () => void;
  onSubmitCancel: (event: FormEvent) => void;
  onSubmitReagendar: (event: FormEvent) => void;
}) {
  return (
    <Card className="rounded-2xl border-white/10 bg-[#121212] text-white">
      <CardHeader>
        <CardTitle className="text-xl">
          {mode === "cancelar" ? "Cancelar reserva" : "Reagendar reserva"}
        </CardTitle>
        <CardDescription>
          {getReservaServicio(reserva)} · {formatDate(reserva.fecha)} ·{" "}
          {timeLabel(reserva.hora)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mode === "cancelar" ? (
          <form className="grid gap-4" onSubmit={onSubmitCancel}>
            <div className="grid gap-2">
              <Label htmlFor="cancelar-motivo">Motivo opcional</Label>
              <Textarea
                id="cancelar-motivo"
                value={cancelForm.motivo}
                onChange={(event) =>
                  onCancelFormChange({ motivo: event.target.value })
                }
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                className="rounded-2xl bg-red-500 font-semibold text-white hover:bg-red-400"
                disabled={saving}
              >
                {saving ? "Procesando..." : "Confirmar cancelación"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </form>
        ) : (
          <form className="grid gap-4" onSubmit={onSubmitReagendar}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="reagendar-fecha">Nueva fecha</Label>
                <Input
                  id="reagendar-fecha"
                  type="date"
                  value={reagendarForm.fecha}
                  min={getTodayKey()}
                  onChange={(event) =>
                    onReagendarFormChange((prev) => ({
                      ...prev,
                      fecha: event.target.value,
                      hora: "",
                    }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reagendar-hora">Nueva hora</Label>
                <Input
                  id="reagendar-hora"
                  type="time"
                  value={reagendarForm.hora}
                  min={getMinimumBookableTimeForDate(reagendarForm.fecha)}
                  onChange={(event) =>
                    onReagendarFormChange((prev) => ({
                      ...prev,
                      hora: event.target.value,
                    }))
                  }
                  required
                />
                {reagendarForm.fecha === getTodayKey() ? (
                  <p className="text-xs leading-5 text-[#A8A8A8]">
                    {SAME_DAY_BOOKING_LEAD_MESSAGE}.
                  </p>
                ) : null}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reagendar-motivo">Motivo opcional</Label>
              <Textarea
                id="reagendar-motivo"
                value={reagendarForm.motivo}
                onChange={(event) =>
                  onReagendarFormChange((prev) => ({
                    ...prev,
                    motivo: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                className="rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0]"
                disabled={saving}
              >
                {saving ? "Procesando..." : "Guardar reagendamiento"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default MisReservasPage;
