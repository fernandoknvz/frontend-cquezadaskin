import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle,
  Clock,
  IdCard,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  User,
  UserCheck,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  clearClientSession,
  getClientToken,
  getStoredClient,
  setClientToken,
  setStoredClient,
} from "@/services/clientAuthStorage";
import {
  getClienteMe,
  loginCliente,
  registerCliente,
  type ClienteProfile,
} from "@/services/clientesApi";
import { getDisponibilidadPorFecha } from "@/services/disponibilidadApi";
import { createReserva } from "@/services/reservasApi";
import { listServices, type ServiceItem } from "@/services/servicesApi";
import brandLogo from "@/assets/logo_cquezadaskin.png";

type AuthMode = "login" | "register";

type AuthForm = {
  nombre: string;
  rut: string;
  telefono: string;
  email: string;
  password: string;
  aceptaPolitica: boolean;
  recibePromociones: boolean;
};

type BookingForm = {
  servicioId: string;
  fecha: string;
  hora: string;
  duracionMin: "30" | "60" | "90";
};

const FINAL_SUCCESS_MESSAGE =
  "Tu solicitud fue enviada. CQuezadaSkin te contactará para confirmar.";

const todayKey = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dateToKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const keyToDate = (value: string) => {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
};

const formatDisplayDate = (value: string) => {
  const date = keyToDate(value);
  if (!date) return "Selecciona una fecha";
  return date.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const isPastDate = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const candidate = new Date(date);
  candidate.setHours(0, 0, 0, 0);
  return candidate < today;
};

const formatPrice = (value?: number) => {
  if (!value) return null;
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
};

const timeLabel = (time: string) => time.slice(0, 5);

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const EMAIL_ERROR_MESSAGE = "Ingresa un correo electrónico válido.";
const PHONE_ERROR_MESSAGE = "Ingresa un celular válido de 8 dígitos.";
const RUT_REQUIRED_MESSAGE = "El RUT es obligatorio.";
const RUT_ERROR_MESSAGE = "Ingresa un RUT válido.";
const REGISTER_FALLBACK_ERROR =
  "No pudimos crear la cuenta. Intenta nuevamente.";
const CHILEAN_MOBILE_PREFIX = "+569";

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

const normalizePhoneDigits = (value: string) => {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("569") && digits.length > 8) {
    return digits.slice(3, 11);
  }

  return digits.slice(0, 8);
};

const isValidChileanMobile = (value: string) => /^\d{8}$/.test(value);

const cleanRut = (value: string) =>
  value
    .replace(/[^0-9kK]/g, "")
    .slice(0, 9)
    .toUpperCase();

const formatRut = (value: string) => {
  const rut = cleanRut(value);
  if (rut.length <= 1) return rut;

  const body = rut.slice(0, -1);
  const verifier = rut.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${formattedBody}-${verifier}`;
};

const getRutParts = (value: string) => {
  const rut = cleanRut(value);
  if (rut.length < 2) return null;

  return {
    body: rut.slice(0, -1),
    verifier: rut.slice(-1),
  };
};

const calculateRutVerifier = (body: string) => {
  let sum = 0;
  let multiplier = 2;

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const result = 11 - (sum % 11);
  if (result === 11) return "0";
  if (result === 10) return "K";
  return String(result);
};

const isValidRut = (value: string) => {
  const parts = getRutParts(value);
  if (!parts || !/^\d+$/.test(parts.body)) return false;

  return calculateRutVerifier(parts.body) === parts.verifier;
};

const getAuthErrorMessage = (error: unknown, fallback: string) => {
  const message = error instanceof Error ? error.message.trim() : "";
  if (
    !message ||
    message.includes("<!DOCTYPE") ||
    message.includes("<html") ||
    message.includes("Unexpected token")
  ) {
    return fallback;
  }

  return message;
};

export const AgendarPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authForm, setAuthForm] = useState<AuthForm>({
    nombre: "",
    rut: "",
    telefono: "",
    email: "",
    password: "",
    aceptaPolitica: false,
    recibePromociones: false,
  });
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    servicioId: "",
    fecha: "",
    hora: "",
    duracionMin: "30",
  });

  const [clientToken, setClientTokenState] = useState<string | null>(
    getClientToken()
  );
  const [client, setClient] = useState<ClienteProfile | null>(
    getStoredClient() as ClienteProfile | null
  );
  const [checkingSession, setCheckingSession] = useState(Boolean(getClientToken()));
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [timesLoading, setTimesLoading] = useState(false);
  const [timesError, setTimesError] = useState<string | null>(null);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    const validateSession = async () => {
      const token = getClientToken();
      if (!token) {
        setCheckingSession(false);
        return;
      }

      try {
        const profile = (await getClienteMe(token)) as ClienteProfile;
        setClient(profile);
        setStoredClient(profile);
        setClientTokenState(token);
      } catch {
        clearClientSession();
        setClient(null);
        setClientTokenState(null);
      } finally {
        setCheckingSession(false);
      }
    };

    validateSession();
  }, []);

  useEffect(() => {
    const loadServices = async () => {
      setServicesLoading(true);
      setServicesError(null);
      try {
        const data = await listServices();
        const servicesArray = Array.isArray(data) ? data : [];
        const active = servicesArray.filter((service) => service.activo !== false);
        setServices(active);
        setBookingForm((prev) => ({
          ...prev,
          servicioId: prev.servicioId || (active[0] ? String(active[0].id) : ""),
        }));
      } catch {
        setServices([]);
        setServicesError("No se pudieron cargar los servicios");
      } finally {
        setServicesLoading(false);
      }
    };

    loadServices();
  }, []);

  useEffect(() => {
    const loadTimes = async () => {
      if (!bookingForm.fecha) {
        setAvailableTimes([]);
        return;
      }

      setTimesLoading(true);
      setTimesError(null);
      setBookingForm((prev) => ({ ...prev, hora: "" }));
      try {
        const horas = await getDisponibilidadPorFecha(bookingForm.fecha);
        setAvailableTimes(horas.map((hora) => hora.slice(0, 5)));
      } catch (error) {
        setAvailableTimes([]);
        setTimesError(
          getErrorMessage(error, "No pudimos cargar las horas disponibles.")
        );
      } finally {
        setTimesLoading(false);
      }
    };

    loadTimes();
  }, [bookingForm.fecha]);

  const selectedService = useMemo(
    () =>
      services.find((service) => String(service.id) === bookingForm.servicioId) ??
      null,
    [bookingForm.servicioId, services]
  );
  const selectedDate = useMemo(
    () => keyToDate(bookingForm.fecha),
    [bookingForm.fecha]
  );

  const isClientLoggedIn = Boolean(clientToken && client);
  const clientName = client?.nombre ?? "Cliente CQuezadaSkin";
  const clientEmail = client?.email ?? client?.correo ?? null;

  const authButtonText = authMode === "login" ? "Ingresar" : "Crear cuenta";

  const canSubmitAuth =
    authForm.email.trim() &&
    authForm.password &&
    (authMode === "login" ||
      (authForm.nombre.trim() &&
        authForm.telefono.trim() &&
        authForm.aceptaPolitica));

  const canSubmitBooking =
    isClientLoggedIn &&
    bookingForm.servicioId &&
    bookingForm.fecha &&
    bookingForm.hora &&
    bookingForm.duracionMin;

  const setAuthField = useCallback(
    <K extends keyof AuthForm>(field: K, value: AuthForm[K]) => {
      setAuthForm((prev) => ({
        ...prev,
        [field]:
          field === "telefono" && typeof value === "string"
            ? normalizePhoneDigits(value)
            : field === "rut" && typeof value === "string"
              ? formatRut(value)
            : value,
      }));
      setAuthError(null);
    },
    []
  );

  const setBookingField = useCallback(
    <K extends keyof BookingForm>(field: K, value: BookingForm[K]) => {
      setBookingForm((prev) => ({ ...prev, [field]: value }));
      setBookingError(null);
      setSuccessMessage(null);
    },
    []
  );

  const handleAuthSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmitAuth || authLoading) return;

    const email = authForm.email.trim();
    if (!isValidEmail(email)) {
      setAuthError(EMAIL_ERROR_MESSAGE);
      return;
    }

    const phoneDigits = normalizePhoneDigits(authForm.telefono);
    if (authMode === "register" && !isValidChileanMobile(phoneDigits)) {
      setAuthForm((prev) => ({ ...prev, telefono: phoneDigits }));
      setAuthError(PHONE_ERROR_MESSAGE);
      return;
    }

    const rut = formatRut(authForm.rut);
    if (authMode === "register") {
      if (!rut) {
        setAuthError(RUT_REQUIRED_MESSAGE);
        return;
      }

      if (!isValidRut(rut)) {
        setAuthForm((prev) => ({ ...prev, rut }));
        setAuthError(RUT_ERROR_MESSAGE);
        return;
      }
    }

    setAuthLoading(true);
    setAuthError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        email,
        password: authForm.password,
      };
      const response =
        authMode === "login"
          ? await loginCliente(payload)
          : await registerCliente({
              ...payload,
              nombre: authForm.nombre.trim(),
              telefono: `${CHILEAN_MOBILE_PREFIX}${phoneDigits}`,
              rut,
              acepta_politica: authForm.aceptaPolitica,
              recibe_promociones: authForm.recibePromociones,
            });

      if (!response.token) {
        throw new Error("No recibimos token de sesión del servidor.");
      }

      setClientToken(response.token);
      setClientTokenState(response.token);

      const profile =
        response.cliente ?? ((await getClienteMe(response.token)) as ClienteProfile);
      setClient(profile);
      setStoredClient(profile);
    } catch (error) {
      setAuthError(
        getAuthErrorMessage(
          error,
          authMode === "register"
            ? REGISTER_FALLBACK_ERROR
            : "No pudimos iniciar la sesión del cliente."
        )
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogoutClient = () => {
    clearClientSession();
    setClient(null);
    setClientTokenState(null);
    setAuthMode("login");
    setAuthError(null);
    setBookingError(null);
    setSuccessMessage(null);
    setAvailableTimes([]);
    setTimesError(null);
    setBookingForm({
      servicioId: "",
      fecha: "",
      hora: "",
      duracionMin: "30",
    });
  };

  const handleBookingSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmitBooking || bookingLoading) return;

    setBookingLoading(true);
    setBookingError(null);
    setSuccessMessage(null);

    try {
      await createReserva({
        servicio_id: Number(bookingForm.servicioId),
        fecha: bookingForm.fecha,
        hora: bookingForm.hora,
        duracion_min: Number(bookingForm.duracionMin),
      });
      setSuccessMessage(FINAL_SUCCESS_MESSAGE);
      setBookingForm((prev) => ({ ...prev, hora: "" }));
    } catch (error) {
      setBookingError(
        getErrorMessage(error, "No pudimos enviar tu solicitud de reserva.")
      );
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <section className="mx-auto w-[92%] max-w-6xl py-8 sm:py-12">
      <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#111111]/90 shadow-[0_24px_80px_rgba(0,0,0,0.48)]">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#00D1C1]/25 bg-[#00D1C1]/10 px-3 py-1.5 text-sm font-semibold text-[#20E0D0]">
              <Sparkles className="h-4 w-4" />
              Agenda online
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Reserva tu tratamiento en CQuezadaSkin
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#C9C9C9] sm:text-lg">
              Elige tu servicio, fecha y horario disponible. Constanza revisará
              tu solicitud y te contactará para confirmar los detalles.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm text-[#B8B8B8]">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#111414]/70 px-3 py-1.5">
                <MapPin className="h-4 w-4 text-[#00D1C1]" />
                Home studio en Quilpué
              </span>
              <span className="rounded-full border border-white/10 bg-[#111414]/70 px-3 py-1.5">
                Limpieza facial
              </span>
              <span className="rounded-full border border-white/10 bg-[#111414]/70 px-3 py-1.5">
                Microneedling
              </span>
              <span className="rounded-full border border-white/10 bg-[#111414]/70 px-3 py-1.5">
                Corporal
              </span>
            </div>
          </div>
          <div className="bg-[radial-gradient(circle_at_50%_28%,rgba(0,209,193,0.14),transparent_17rem)] p-5 pt-0 sm:p-8 sm:pt-0 lg:pt-8">
            <div className="flex h-full min-h-[13rem] flex-col items-center justify-center gap-5 rounded-[1.5rem] border border-[#00D1C1]/25 bg-[#0B0F0F]/82 p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_40px_rgba(0,209,193,0.12)] sm:min-h-[15rem] sm:p-6 lg:min-h-64">
              <img
                src={brandLogo}
                alt="Logo CQuezadaSkin"
                className="w-[min(72vw,210px)] rounded-2xl object-contain shadow-[0_0_34px_rgba(0,209,193,0.14)] sm:w-[240px] lg:w-[300px]"
                loading="eager"
              />
              <p className="max-w-sm text-sm leading-relaxed text-[#D6D6D6]">
                Una experiencia limpia, cálida y profesional para cuidar tu piel
                con orientación personalizada.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-2xl border-white/10 bg-[#121212]/92 shadow-[0_18px_60px_rgba(0,0,0,0.36)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              {isClientLoggedIn ? (
                <UserCheck className="h-5 w-5 text-[#00D1C1]" />
              ) : (
                <LogIn className="h-5 w-5 text-[#00D1C1]" />
              )}
              {isClientLoggedIn ? "Mi cuenta" : "Cliente"}
            </CardTitle>
            <CardDescription>
              {isClientLoggedIn
                ? "Gestiona tu sesión y revisa tus solicitudes."
                : "Tu sesión se validará antes de enviar la solicitud."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checkingSession ? (
              <div className="rounded-lg border border-white/10 bg-[#111414]/70 p-4 text-sm text-[#D6D6D6]">
                Validando sesión...
              </div>
            ) : isClientLoggedIn ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-[#181818] p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00D1C1] text-[#03110f]">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-white">
                          {clientName}
                        </p>
                        {clientEmail ? (
                          <p className="mt-1 flex items-center gap-2 truncate text-sm text-[#B8B8B8]">
                            <Mail className="h-4 w-4 shrink-0 text-[#00D1C1]" />
                            {clientEmail}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-[#B8B8B8]">
                            Cuenta cliente CQuezadaSkin
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#00D1C1]/25 bg-[#00D1C1]/10 px-3 py-1 text-sm font-medium text-[#20E0D0]">
                      <CheckCircle className="h-4 w-4" />
                      Sesión activa
                    </span>
                  </div>
                </div>

                <Button
                  asChild
                  className="w-full rounded-lg bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0]"
                >
                  <Link to="/mis-reservas">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Ver mis reservas
                  </Link>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-lg"
                  onClick={handleLogoutClient}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleAuthSubmit}>
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-[#0B0F0F] p-1">
                  <Button
                    type="button"
                    variant={authMode === "login" ? "default" : "ghost"}
                    className="rounded-md"
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError(null);
                    }}
                  >
                    Ingresar
                  </Button>
                  <Button
                    type="button"
                    variant={authMode === "register" ? "default" : "ghost"}
                    className="rounded-md"
                    onClick={() => {
                      setAuthMode("register");
                      setAuthError(null);
                    }}
                  >
                    Registro
                  </Button>
                </div>

                {authMode === "register" ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="nombre" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Nombre
                        </Label>
                        <Input
                          id="nombre"
                          value={authForm.nombre}
                          onChange={(event) =>
                            setAuthField("nombre", event.target.value)
                          }
                          className="h-11 rounded-lg"
                          autoComplete="name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rut" className="flex items-center gap-2">
                          <IdCard className="h-4 w-4" />
                          RUT
                        </Label>
                        <Input
                          id="rut"
                          value={authForm.rut}
                          onChange={(event) =>
                            setAuthField("rut", event.target.value)
                          }
                          className="h-11 rounded-lg"
                          placeholder="12.345.678-K"
                          autoComplete="off"
                          inputMode="text"
                          maxLength={12}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefono" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Teléfono
                        </Label>
                        <div className="flex h-11 overflow-hidden rounded-lg border border-white/10 bg-[#121212] focus-within:ring-[3px] focus-within:ring-[#00D1C1]/40">
                          <span className="flex shrink-0 items-center border-r border-white/10 bg-[#111414] px-3 text-sm font-medium text-[#D6D6D6]">
                            {CHILEAN_MOBILE_PREFIX}
                          </span>
                          <Input
                            id="telefono"
                            value={authForm.telefono}
                            onChange={(event) =>
                              setAuthField("telefono", event.target.value)
                            }
                            className="h-full rounded-none border-0 shadow-none focus-visible:ring-0"
                            autoComplete="tel-national"
                            inputMode="numeric"
                            maxLength={8}
                            pattern="[0-9]{8}"
                            placeholder="12345678"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-[#111414]/70 p-4 text-sm text-[#D6D6D6]">
                      Tus datos serán utilizados únicamente para gestionar tu
                      solicitud de reserva.
                    </div>
                  </>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Correo
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={authForm.email}
                    onChange={(event) => setAuthField("email", event.target.value)}
                    className="h-11 rounded-lg"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-password">Contrasena</Label>
                  <Input
                    id="client-password"
                    type="password"
                    value={authForm.password}
                    onChange={(event) =>
                      setAuthField("password", event.target.value)
                    }
                    className="h-11 rounded-lg"
                    autoComplete={
                      authMode === "login" ? "current-password" : "new-password"
                    }
                    required
                  />
                </div>

                {authError ? (
                  <Alert variant="destructive">
                    <AlertTitle>No pudimos continuar</AlertTitle>
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                ) : null}

                {authMode === "register" ? (
                  <div className="space-y-3 rounded-lg border border-white/10 bg-[#111414]/70 p-4">
                    <label className="flex items-start gap-3 text-sm text-[#C9C9C9]">
                      <input
                        type="checkbox"
                        checked={authForm.aceptaPolitica}
                        onChange={(event) =>
                          setAuthField("aceptaPolitica", event.target.checked)
                        }
                        className="mt-1 h-4 w-4 accent-[#00D1C1]"
                        required
                      />
                      <span>
                        Acepto la{" "}
                        <Link
                          className="text-[#00D1C1] underline-offset-4 hover:underline"
                          to="/privacidad"
                          target="_blank"
                        >
                          Política de Privacidad
                        </Link>
                        .
                      </span>
                    </label>

                    <label className="flex items-start gap-3 text-sm text-[#C9C9C9]">
                      <input
                        type="checkbox"
                        checked={authForm.recibePromociones}
                        onChange={(event) =>
                          setAuthField(
                            "recibePromociones",
                            event.target.checked
                          )
                        }
                        className="mt-1 h-4 w-4 accent-[#00D1C1]"
                      />
                      <span>Quiero recibir promociones</span>
                    </label>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  className="h-11 w-full rounded-lg bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0]"
                  disabled={!canSubmitAuth || authLoading}
                >
                  {authLoading ? "Procesando..." : authButtonText}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-white/10 bg-[#121212]/92 shadow-[0_18px_60px_rgba(0,0,0,0.36)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarDays className="h-5 w-5 text-[#00D1C1]" />
              Solicitud de reserva
            </CardTitle>
            <CardDescription>
              La reserva quedará como solicitada y será revisada por el equipo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleBookingSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Servicio</Label>
                  <Select
                    value={bookingForm.servicioId}
                    onValueChange={(value) =>
                      setBookingField("servicioId", value)
                    }
                    disabled={servicesLoading}
                  >
                    <SelectTrigger className="h-11 rounded-lg border-white/10 bg-[#121212] text-white">
                      <SelectValue
                        placeholder={
                          servicesLoading
                            ? "Cargando servicios..."
                            : "Selecciona un servicio"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={String(service.id)}>
                          {service.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedService ? (
                    <div className="rounded-2xl border border-white/10 bg-[#181818] p-4 text-sm text-[#C9C9C9]">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-white">
                            {selectedService.subtitulo || selectedService.nombre}
                          </p>
                          {selectedService.descripcion ? (
                            <p className="mt-1 leading-relaxed">
                              {selectedService.descripcion}
                            </p>
                          ) : null}
                        </div>
                        {formatPrice(selectedService.precio) ? (
                          <span className="w-fit rounded-full border border-[#00D1C1]/25 bg-[#00D1C1]/10 px-3 py-1 text-sm font-semibold text-[#20E0D0]">
                            {formatPrice(selectedService.precio)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  {servicesError ? (
                    <p className="text-sm text-red-300">{servicesError}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha" className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Fecha
                  </Label>
                  <Popover
                    open={datePickerOpen}
                    onOpenChange={setDatePickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        id="fecha"
                        type="button"
                        variant="outline"
                        className="h-11 w-full justify-start rounded-2xl border-white/10 bg-[#121212] text-left font-normal text-white shadow-sm hover:bg-[#181818]"
                      >
                        <CalendarDays className="mr-2 h-4 w-4 text-[#00D1C1]" />
                        <span
                          className={
                            bookingForm.fecha
                              ? "text-white"
                              : "text-[#8E8E8E]"
                          }
                        >
                          {formatDisplayDate(bookingForm.fecha)}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-auto rounded-lg p-0"
                    >
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        disabled={isPastDate}
                        onSelect={(date) => {
                          if (!date) return;
                          setBookingField("fecha", dateToKey(date));
                          setBookingField("hora", "");
                          setDatePickerOpen(false);
                        }}
                        captionLayout="dropdown"
                        startMonth={new Date()}
                        className="rounded-lg"
                      />
                    </PopoverContent>
                  </Popover>
                  <input
                    type="hidden"
                    name="fecha"
                    value={bookingForm.fecha}
                    min={todayKey()}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Duración
                  </Label>
                  <Select
                    value={bookingForm.duracionMin}
                    onValueChange={(value) =>
                      setBookingField(
                        "duracionMin",
                        value as BookingForm["duracionMin"]
                      )
                    }
                  >
                    <SelectTrigger className="h-11 rounded-lg border-white/10 bg-[#121212] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                      <SelectItem value="90">90 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Hora disponible</Label>
                  <Select
                    value={bookingForm.hora}
                    onValueChange={(value) => setBookingField("hora", value)}
                    disabled={
                      !bookingForm.fecha ||
                      timesLoading ||
                      availableTimes.length === 0
                    }
                  >
                    <SelectTrigger className="h-11 rounded-lg border-white/10 bg-[#121212] text-white">
                      <SelectValue
                        placeholder={
                          !bookingForm.fecha
                            ? "Primero selecciona fecha"
                            : timesLoading
                              ? "Cargando horas..."
                              : availableTimes.length === 0
                                ? "Sin horas disponibles para esta fecha"
                                : "Selecciona una hora"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimes.map((hora) => (
                        <SelectItem key={hora} value={hora}>
                          {timeLabel(hora)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {timesError ? (
                    <p className="text-sm text-red-300">{timesError}</p>
                  ) : bookingForm.fecha &&
                    !timesLoading &&
                    availableTimes.length === 0 ? (
                    <p className="text-sm text-[#20E0D0]">
                      Sin horas disponibles para esta fecha
                    </p>
                  ) : null}
                </div>
              </div>

              {!isClientLoggedIn ? (
                <div className="rounded-lg border border-[#00D1C1]/25 bg-[#00D1C1]/10 p-4 text-sm text-[#CFFCF8]">
                  Ingresa o crea tu cuenta de cliente para enviar la solicitud.
                </div>
              ) : null}

              {successMessage ? (
                <Alert className="rounded-lg border-[#00D1C1]/25 bg-[#00D1C1]/10">
                  <CheckCircle className="h-5 w-5 text-[#00D1C1]" />
                  <div className="ml-3">
                    <AlertTitle>Solicitud enviada</AlertTitle>
                    <AlertDescription className="text-[#CFFCF8]">
                      {successMessage}
                    </AlertDescription>
                  </div>
                </Alert>
              ) : null}

              {bookingError ? (
                <Alert variant="destructive">
                  <AlertTitle>No pudimos enviar la solicitud</AlertTitle>
                  <AlertDescription>{bookingError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="rounded-lg border border-white/10 bg-[#111414]/70 p-4">
                <label className="flex items-start gap-3 text-sm text-[#C9C9C9]">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 h-4 w-4 accent-[#00D1C1]"
                    disabled={bookingLoading}
                  />
                  <span>
                    Acepto los{" "}
                    <Link
                      className="text-[#00D1C1] underline-offset-4 hover:underline"
                      to="/terminos"
                      target="_blank"
                    >
                      Términos y Condiciones
                    </Link>{" "}
                    y la{" "}
                    <Link
                      className="text-[#00D1C1] underline-offset-4 hover:underline"
                      to="/privacidad"
                      target="_blank"
                    >
                      Política de Privacidad
                    </Link>
                    .
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-lg bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0] sm:w-auto sm:px-8"
                disabled={!canSubmitBooking || bookingLoading}
              >
                {bookingLoading ? "Enviando..." : "Enviar solicitud"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AgendarPage;
