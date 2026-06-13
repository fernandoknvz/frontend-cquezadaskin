import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CalendarDays,
  Clock,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { AppModal } from "@/components/ui/AppModal";
import { Button } from "@/components/ui/button";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NotificationToast } from "@/components/ui/notification-toast";
import {
  createDisponibilidadBulk,
  deleteBloqueo,
  deleteDisponibilidad,
  getCalendarioDia,
  getDisponibilidad,
  updateDisponibilidad,
  type CalendarioEvento,
  type DisponibilidadAdmin,
} from "@/services/adminCalendarioApi";
import {
  addMinutesToTime,
  getReservaEndTime,
  getReservaTimeRange,
  timeLabel,
} from "@/lib/reservaTime";
import {
  AVAILABILITY_INTERVALS,
  generateAvailabilitySlots,
  normalizeAvailabilityDateForApi,
  normalizeAvailabilityTimeForApi,
  type AvailabilityInterval,
} from "@/lib/availabilitySlots";

const ESTADOS_RESERVA = [
  "solicitada",
  "pendiente",
  "confirmada",
  "cancelada",
  "completada",
  "reagendada",
] as const;

type PanelMode = "disponibilidad" | null;
type ModalFeedback = {
  tone: "success" | "error" | "info";
  message: string;
} | null;
type AdminNotification = {
  variant: "success" | "error" | "warning" | "info";
  title: string;
  description: string;
};

type DisponibilidadForm = {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  intervaloMinutos: AvailabilityInterval;
  disponible: boolean;
  motivo: string;
};

const pad = (value: number) => String(value).padStart(2, "0");

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const todayKey = () => toDateKey(new Date());

const parseDateKey = (dateKey: string) => {
  const date = new Date(`${dateKey}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const formatFullDate = (value: string) =>
  parseDateKey(value).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const normalizeText = (value?: string | null) => value?.toLowerCase() ?? "";

const isReservedEstado = (value?: string | null) => {
  const normalized = normalizeText(value);
  return (
    normalized === "reservado" ||
    normalized === "reservada" ||
    normalized === "ocupado" ||
    normalized === "ocupada" ||
    normalized === "reservada/ocupada"
  );
};

const isTruthyFlag = (value: unknown) =>
  value === true ||
  value === 1 ||
  (typeof value === "string" &&
    ["1", "true", "si", "yes"].includes(value.toLowerCase()));

const hasReservaId = (item: DisponibilidadAdmin) =>
  item.reserva_id !== null &&
  item.reserva_id !== undefined &&
  String(item.reserva_id) !== "";

const isOcupado = (item: DisponibilidadAdmin) =>
  isReservedEstado(item.estado) ||
  hasReservaId(item) ||
  isTruthyFlag(item.ocupado) ||
  isTruthyFlag(item.ocupada) ||
  (item.disponible === false && normalizeText(item.tipo) !== "bloqueo");

const isBloqueo = (item: DisponibilidadAdmin) =>
  !isOcupado(item) &&
  (normalizeText(item.tipo) === "bloqueo" ||
    normalizeText(item.estado) === "bloqueado" ||
    normalizeText(item.estado) === "no_disponible" ||
    normalizeText(item.estado) === "no disponible");

const getEstadoClass = (estado: string) => {
  const normalized = estado.toLowerCase();
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

const getDisponibilidadClass = (item: DisponibilidadAdmin) =>
  isOcupado(item)
    ? "border-amber-300/35 bg-amber-400/10 text-amber-200"
    : isBloqueo(item)
    ? "border-red-400/30 bg-red-500/10 text-red-200"
    : "border-[#00D1C1]/30 bg-[#00D1C1]/10 text-[#20E0D0]";

const sortByHour = <T extends { hora: string }>(items: T[]) =>
  [...items].sort((a, b) => timeLabel(a.hora).localeCompare(timeLabel(b.hora)));

const timeToMinutes = (value?: string | null) => {
  if (!value) return null;
  const [hoursRaw, minutesRaw] = timeLabel(value).split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

const getDisplayEndTime = (item: DisponibilidadAdmin) =>
  item.hora_fin ? timeLabel(item.hora_fin) : addMinutesToTime(item.hora, 30);

const mergeDisponibilidadReservaSlots = (
  current: DisponibilidadAdmin,
  incoming: DisponibilidadAdmin
): DisponibilidadAdmin => {
  const currentStart = timeToMinutes(current.hora);
  const incomingStart = timeToMinutes(incoming.hora);
  const currentEnd = timeToMinutes(getDisplayEndTime(current));
  const incomingEnd = timeToMinutes(getDisplayEndTime(incoming));
  const hora =
    currentStart === null || (incomingStart !== null && incomingStart < currentStart)
      ? incoming.hora
      : current.hora;
  const maxEnd =
    currentEnd === null || (incomingEnd !== null && incomingEnd > currentEnd)
      ? incomingEnd
      : currentEnd;

  return {
    ...current,
    ...incoming,
    hora,
    hora_fin:
      maxEnd === null
        ? current.hora_fin ?? incoming.hora_fin
        : addMinutesToTime("00:00", maxEnd),
    motivo: current.motivo ?? incoming.motivo,
  };
};

const dedupeDisponibilidadForDisplay = (items: DisponibilidadAdmin[]) => {
  const reservasById = new Map<string, DisponibilidadAdmin>();
  const result: DisponibilidadAdmin[] = [];

  items.forEach((item) => {
    if (!isOcupado(item) || !hasReservaId(item)) {
      result.push(item);
      return;
    }

    const key = String(item.reserva_id);
    const existing = reservasById.get(key);
    if (!existing) {
      reservasById.set(key, item);
      result.push(item);
      return;
    }

    const merged = mergeDisponibilidadReservaSlots(existing, item);
    reservasById.set(key, merged);
    const index = result.findIndex((candidate) => String(candidate.reserva_id) === key);
    if (index >= 0) result[index] = merged;
  });

  return result;
};

const getEventoContacto = (evento: CalendarioEvento) =>
  evento.cliente_email ?? evento.cliente_correo ?? evento.cliente_telefono ?? "";

const isActiveEvento = (evento: CalendarioEvento) =>
  normalizeText(evento.estado) !== "cancelada";

const getSlotKey = (fecha: string, hora: string) =>
  `${normalizeAvailabilityDateForApi(fecha) || fecha.slice(0, 10)}-${timeLabel(
    normalizeAvailabilityTimeForApi(hora) || hora
  )}`;

const getReservaCoveredSlots = (evento: CalendarioEvento) => {
  const start = timeToMinutes(evento.hora);
  const end = timeToMinutes(getReservaEndTime(evento));
  if (start === null) return [timeLabel(evento.hora)];

  const normalizedEnd = end !== null && end > start ? end : start + 30;
  const slots: string[] = [];
  for (let current = start; current < normalizedEnd; current += 30) {
    slots.push(timeLabel(addMinutesToTime("00:00", current) ?? evento.hora));
  }
  return slots;
};

const getRequestStatus = (error: unknown) =>
  error instanceof Error
    ? (error as Error & { status?: number }).status
    : undefined;

const getAvailabilitySaveErrorMessage = (
  error: unknown,
  endpointUnavailableMessage?: string
) => {
  const status = getRequestStatus(error);
  if (endpointUnavailableMessage && (status === 404 || status === 405)) {
    return endpointUnavailableMessage;
  }

  return error instanceof Error
    ? error.message
    : "No se pudo guardar la disponibilidad";
};

export const AdminCalendarioSection = () => {
  const [fecha, setFecha] = useState(todayKey());
  const [estado, setEstado] = useState("");
  const [eventos, setEventos] = useState<CalendarioEvento[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadAdmin[]>(
    []
  );
  const [selectedEvento, setSelectedEvento] = useState<CalendarioEvento | null>(
    null
  );
  const [editingDisponibilidad, setEditingDisponibilidad] =
    useState<DisponibilidadAdmin | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<AdminNotification | null>(
    null
  );
  const [modalFeedback, setModalFeedback] = useState<ModalFeedback>(null);
  const [disponibilidadForm, setDisponibilidadForm] =
    useState<DisponibilidadForm>({
      fecha: todayKey(),
      horaInicio: "10:00",
      horaFin: "12:00",
      intervaloMinutos: 30,
      disponible: true,
      motivo: "",
    });

  const clearNotification = useCallback(() => setNotification(null), []);

  const showToast = useCallback((notificationData: AdminNotification) => {
    setNotification(notificationData);
  }, []);

  const range = useMemo(
    () => ({ fecha_desde: fecha, fecha_hasta: fecha }),
    [fecha]
  );

  const filteredEventos = useMemo(
    () =>
      eventos.filter((evento) => {
        if (!estado) return true;
        return normalizeText(evento.estado) === estado;
      }),
    [estado, eventos]
  );

  const loadCalendario = useCallback(async () => {
    setLoading(true);
    try {
      const [eventosResponse, disponibilidadResponse] = await Promise.all([
        getCalendarioDia(fecha),
        getDisponibilidad(range),
      ]);
      setEventos(eventosResponse);
      setDisponibilidad(disponibilidadResponse);
    } catch (err) {
      setEventos([]);
      setDisponibilidad([]);
      showToast({
        variant: "error",
        title: "No se pudo cargar el calendario",
        description:
          err instanceof Error ? err.message : "Intenta actualizar nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  }, [fecha, range, showToast]);

  useEffect(() => {
    loadCalendario();
  }, [loadCalendario]);

  const eventosByDate = useMemo(() => {
    const groups = new Map<string, CalendarioEvento[]>();
    filteredEventos.forEach((evento) => {
      const key =
        normalizeAvailabilityDateForApi(evento.fecha) || evento.fecha.slice(0, 10);
      groups.set(key, [...(groups.get(key) ?? []), evento]);
    });
    return groups;
  }, [filteredEventos]);

  const activeEventosBySlot = useMemo(() => {
    const groups = new Map<string, CalendarioEvento>();
    eventos.forEach((evento) => {
      if (!isActiveEvento(evento)) return;
      getReservaCoveredSlots(evento).forEach((hora) => {
        groups.set(getSlotKey(evento.fecha, hora), evento);
      });
    });
    return groups;
  }, [eventos]);

  const disponibilidadSegura = useMemo(
    () =>
      disponibilidad.map((item) => {
        const evento = activeEventosBySlot.get(getSlotKey(item.fecha, item.hora));
        if (!evento) return item;

        return {
          ...item,
          disponible: false,
          estado: "reservado",
          ocupado: true,
          reserva_id: evento.id,
          motivo: item.motivo ?? "Reserva activa",
        };
      }),
    [activeEventosBySlot, disponibilidad]
  );

  const disponibilidadByDate = useMemo(() => {
    const groups = new Map<string, DisponibilidadAdmin[]>();
    disponibilidadSegura.forEach((item) => {
      const key =
        normalizeAvailabilityDateForApi(item.fecha) || item.fecha.slice(0, 10);
      groups.set(key, [...(groups.get(key) ?? []), item]);
    });
    return groups;
  }, [disponibilidadSegura]);

  const dayEventos = sortByHour(eventosByDate.get(fecha) ?? []);
  const dayDisponibilidad = dedupeDisponibilidadForDisplay(
    sortByHour(disponibilidadByDate.get(fecha) ?? [])
  );
  const disponibilidadSlotsByDate = useMemo(() => {
    const groups = new Map<string, Set<string>>();
    disponibilidadSegura.forEach((item) => {
      const key =
        normalizeAvailabilityDateForApi(item.fecha) || item.fecha.slice(0, 10);
      const slots = groups.get(key) ?? new Set<string>();
      slots.add(normalizeAvailabilityTimeForApi(item.hora) || timeLabel(item.hora));
      groups.set(key, slots);
    });
    return groups;
  }, [disponibilidadSegura]);
  const reservaSlotsByDate = useMemo(() => {
    const groups = new Map<string, Set<string>>();
    eventos.forEach((evento) => {
      if (!isActiveEvento(evento)) return;
      const key =
        normalizeAvailabilityDateForApi(evento.fecha) || evento.fecha.slice(0, 10);
      const slots = groups.get(key) ?? new Set<string>();
      getReservaCoveredSlots(evento).forEach((hora) => {
        slots.add(normalizeAvailabilityTimeForApi(hora) || timeLabel(hora));
      });
      groups.set(key, slots);
    });
    return groups;
  }, [eventos]);
  const slotValidation = useMemo(
    () =>
      generateAvailabilitySlots(
        disponibilidadForm.horaInicio,
        disponibilidadForm.horaFin,
        disponibilidadForm.intervaloMinutos
      ),
    [
      disponibilidadForm.horaFin,
      disponibilidadForm.horaInicio,
      disponibilidadForm.intervaloMinutos,
    ]
  );
  const disponibilidadApiDate = normalizeAvailabilityDateForApi(
    disponibilidadForm.fecha
  );
  const disponibilidadApiStartTime = normalizeAvailabilityTimeForApi(
    disponibilidadForm.horaInicio
  );
  const disponibilidadApiEndTime = normalizeAvailabilityTimeForApi(
    disponibilidadForm.horaFin
  );
  const existingSlotsForDate =
    disponibilidadSlotsByDate.get(disponibilidadApiDate) ?? new Set<string>();
  const reservedSlotsForDate =
    reservaSlotsByDate.get(disponibilidadApiDate) ?? new Set<string>();
  const clientDuplicatedSlots = slotValidation.slots.filter((slot) =>
    existingSlotsForDate.has(slot)
  );
  const clientReservedSlots = slotValidation.slots.filter((slot) =>
    reservedSlotsForDate.has(slot)
  );
  const clientCreatableSlots = slotValidation.slots.filter(
    (slot) => !existingSlotsForDate.has(slot) && !reservedSlotsForDate.has(slot)
  );
  const isBulkCreate = panelMode === "disponibilidad" && !editingDisponibilidad;
  const disponibilidadSubmitDisabled =
    saving ||
    (isBulkCreate &&
      (Boolean(slotValidation.error) ||
        !disponibilidadApiDate ||
        !disponibilidadApiStartTime ||
        !disponibilidadApiEndTime ||
        clientCreatableSlots.length === 0));
  const selectedDayHasAvailability = dayDisponibilidad.length > 0;

  const openDisponibilidadPanel = () => {
    if (selectedDayHasAvailability) {
      showToast({
        variant: "info",
        title: "El dia ya tiene horarios",
        description:
          "Edita o elimina horarios existentes, o selecciona otro dia para crear disponibilidad.",
      });
      return;
    }

    setEditingDisponibilidad(null);
    setPanelMode("disponibilidad");
    setModalFeedback(null);
    clearNotification();
    setDisponibilidadForm((prev) => ({
      ...prev,
      fecha: normalizeAvailabilityDateForApi(fecha) || fecha,
      horaInicio: prev.horaInicio || "10:00",
      horaFin: prev.horaFin || "12:00",
    }));
  };

  const openEditDisponibilidad = (item: DisponibilidadAdmin) => {
    setEditingDisponibilidad(item);
    setPanelMode("disponibilidad");
    setModalFeedback(null);
    clearNotification();
    setDisponibilidadForm({
      fecha: normalizeAvailabilityDateForApi(item.fecha) || item.fecha.slice(0, 10),
      horaInicio: normalizeAvailabilityTimeForApi(item.hora) || timeLabel(item.hora),
      horaFin: normalizeAvailabilityTimeForApi(item.hora) || timeLabel(item.hora),
      intervaloMinutos: 30,
      disponible: item.disponible !== false,
      motivo: item.motivo ?? "",
    });
  };

  const handleCreateDisponibilidad = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingDisponibilidad && disponibilidadSubmitDisabled) {
      setModalFeedback({
        tone: "error",
        message:
          slotValidation.error ??
          (!disponibilidadApiDate
            ? "Ingresa una fecha valida para continuar."
            : null) ??
          (!disponibilidadApiStartTime || !disponibilidadApiEndTime
            ? "Ingresa horas validas para continuar."
            : null) ??
          "No hay horarios nuevos para crear en este rango.",
      });
      return;
    }

    setSaving(true);
    setModalFeedback(null);
    clearNotification();
    try {
      if (editingDisponibilidad) {
        if (!disponibilidadApiDate || !disponibilidadApiStartTime) {
          setModalFeedback({
            tone: "error",
            message: "Fecha y hora validas son requeridas.",
          });
          return;
        }

        const payload = {
          fecha: disponibilidadApiDate,
          hora: disponibilidadApiStartTime,
          disponible: disponibilidadForm.disponible,
          motivo: disponibilidadForm.motivo.trim(),
        };
        await updateDisponibilidad(editingDisponibilidad.id, payload);
        showToast({
          variant: "success",
          title: "Disponibilidad actualizada",
          description: "El horario quedo guardado en el calendario.",
        });
      } else {
        const response = await createDisponibilidadBulk({
          fecha: disponibilidadApiDate,
          hora_inicio: disponibilidadApiStartTime,
          hora_fin: disponibilidadApiEndTime,
          intervalo_minutos: disponibilidadForm.intervaloMinutos,
          estado: disponibilidadForm.disponible
            ? "disponible"
            : "no_disponible",
          motivo: disponibilidadForm.motivo.trim(),
        });
        const backendOmitidos = Number(response.omitidos ?? 0);
        const omitidos = Math.max(
          backendOmitidos,
          clientDuplicatedSlots.length + clientReservedSlots.length
        );
        const detail =
          omitidos > 0
            ? ` ${omitidos} horario${omitidos === 1 ? "" : "s"} omitido${
                omitidos === 1 ? "" : "s"
              }.`
            : "";
        const messageText =
          response.mensaje ??
          `Disponibilidad creada correctamente.${detail}`;
        showToast({
          variant: "success",
          title: "Disponibilidad creada",
          description: messageText,
        });
      }
      setEditingDisponibilidad(null);
      setPanelMode(null);
      setModalFeedback(null);
      await loadCalendario();
    } catch (err) {
      const errorMessage = getAvailabilitySaveErrorMessage(
        err,
        !editingDisponibilidad
          ? "El endpoint de creacion masiva aun no esta disponible en backend."
          : undefined
      );
      showToast({
        variant: "error",
        title: "No se pudo guardar",
        description: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDisponibilidad = async (item: DisponibilidadAdmin) => {
    if (isOcupado(item)) {
      showToast({
        variant: "warning",
        title: "Horario reservado",
        description:
          "Este horario tiene una reserva activa. Gestiona la reserva antes de modificar su disponibilidad.",
      });
      return;
    }

    const label = isBloqueo(item) ? "bloqueo" : "disponibilidad";
    const confirmed = window.confirm(`Eliminar este ${label}?`);
    if (!confirmed) return;

    setSaving(true);
    clearNotification();
    try {
      if (isBloqueo(item)) {
        await deleteBloqueo(item.id);
        showToast({
          variant: "success",
          title: "Bloqueo eliminado",
          description: "El horario se elimino del calendario.",
        });
      } else {
        await deleteDisponibilidad(item.id);
        showToast({
          variant: "success",
          title: "Disponibilidad eliminada",
          description: "El horario se elimino del calendario.",
        });
      }
      await loadCalendario();
    } catch (err) {
      showToast({
        variant: "error",
        title: "No se pudo eliminar",
        description:
          err instanceof Error ? err.message : "No se pudo eliminar el horario",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="premium-panel max-w-full min-w-0 rounded-2xl p-4 sm:rounded-3xl sm:p-6">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="premium-section-title text-2xl font-semibold sm:text-3xl">
            Calendario
          </h2>
          <p className="mt-1 text-sm text-[#D6D6D6]">
            Visualiza reservas, disponibilidad y bloqueos por dia.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={loadCalendario}
          disabled={loading}
        >
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Actualizar
        </Button>
      </div>

      <div className="mt-6 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:flex xl:flex-wrap xl:items-center">
        <Input
          type="date"
          value={fecha}
          onChange={(event) => setFecha(event.target.value)}
          className="h-11 w-full min-w-0 rounded-2xl xl:w-[11rem]"
        />
        <select
          value={estado}
          onChange={(event) => setEstado(event.target.value)}
          className="h-11 w-full min-w-0 rounded-2xl border border-white/10 bg-[#0B0F0F] px-3 text-sm text-white outline-none focus:border-[#00D1C1]/70 xl:w-[13rem]"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_RESERVA.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <Button className="w-full min-w-0 xl:w-auto" variant="outline" onClick={() => setFecha(todayKey())}>
          Hoy
        </Button>
      </div>

      <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 xl:flex xl:flex-wrap xl:items-center">
        <Button
          className="w-full min-w-0 rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0] xl:w-auto"
          onClick={openDisponibilidadPanel}
          disabled={selectedDayHasAvailability}
          title={
            selectedDayHasAvailability
              ? "El dia seleccionado ya tiene horarios"
              : "Crear horarios nuevos para el dia seleccionado"
          }
        >
          <Plus className="h-4 w-4" />
          Crear disponibilidad
        </Button>
      </div>

      {notification ? (
        <NotificationToast
          key={`${notification.variant}-${notification.title}-${notification.description}`}
          variant={notification.variant}
          title={notification.title}
          description={notification.description}
          onClose={clearNotification}
        />
      ) : null}

      <AppModal
        open={Boolean(panelMode)}
        title={editingDisponibilidad ? "Editar disponibilidad" : "Crear disponibilidad"}
        description="Guarda el horario sin perder el contexto del calendario."
        onOpenChange={(open) => {
          if (!open && !saving) {
            setEditingDisponibilidad(null);
            setPanelMode(null);
            setModalFeedback(null);
          }
        }}
        className="w-[min(94vw,920px)]"
      >
        {panelMode ? (
        <div>
          {panelMode === "disponibilidad" ? (
            <form onSubmit={handleCreateDisponibilidad}>
              <h3 className="text-xl font-semibold text-white">
                {editingDisponibilidad
                  ? "Editar disponibilidad"
                  : "Crear disponibilidad"}
              </h3>
              {modalFeedback ? (
                <InlineFeedback
                  tone={modalFeedback.tone}
                  message={modalFeedback.message}
                  className="mt-4"
                />
              ) : saving ? (
                <InlineFeedback
                  tone="info"
                  message="Guardando cambios..."
                  className="mt-4"
                />
              ) : null}
              <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="grid gap-2">
                  <Label htmlFor="disponibilidad-fecha">Fecha</Label>
                  <Input
                    id="disponibilidad-fecha"
                    type="date"
                    value={disponibilidadForm.fecha}
                    disabled={saving}
                    onChange={(event) =>
                      setDisponibilidadForm((prev) => ({
                        ...prev,
                        fecha: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="disponibilidad-hora-inicio">
                    {editingDisponibilidad ? "Hora" : "Hora inicio"}
                  </Label>
                  <Input
                    id="disponibilidad-hora-inicio"
                    type="time"
                    value={disponibilidadForm.horaInicio}
                    disabled={saving}
                    onChange={(event) =>
                      setDisponibilidadForm((prev) => ({
                        ...prev,
                        horaInicio: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                {!editingDisponibilidad ? (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="disponibilidad-hora-fin">
                        Hora termino
                      </Label>
                      <Input
                        id="disponibilidad-hora-fin"
                        type="time"
                        value={disponibilidadForm.horaFin}
                        disabled={saving}
                        onChange={(event) =>
                          setDisponibilidadForm((prev) => ({
                            ...prev,
                            horaFin: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="disponibilidad-intervalo">
                        Intervalo
                      </Label>
                      <select
                        id="disponibilidad-intervalo"
                        value={disponibilidadForm.intervaloMinutos}
                        disabled={saving}
                        onChange={(event) =>
                          setDisponibilidadForm((prev) => ({
                            ...prev,
                            intervaloMinutos: Number(
                              event.target.value
                            ) as AvailabilityInterval,
                          }))
                        }
                        className="h-11 w-full min-w-0 rounded-2xl border border-white/10 bg-[#0B0F0F] px-3 text-sm text-white outline-none focus:border-[#00D1C1]/70"
                      >
                        {AVAILABILITY_INTERVALS.map((interval) => (
                          <option key={interval} value={interval}>
                            {interval} minutos
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : null}
                <div className="grid gap-2">
                  <Label htmlFor="disponibilidad-estado">Estado</Label>
                  <select
                    id="disponibilidad-estado"
                    value={disponibilidadForm.disponible ? "true" : "false"}
                    disabled={saving}
                    onChange={(event) =>
                      setDisponibilidadForm((prev) => ({
                        ...prev,
                        disponible: event.target.value === "true",
                      }))
                    }
                    className="h-11 rounded-2xl border border-white/10 bg-[#0B0F0F] px-3 text-sm text-white outline-none focus:border-[#00D1C1]/70"
                  >
                    <option value="true">Disponible</option>
                    <option value="false">No disponible / bloqueado</option>
                  </select>
                </div>
                <div className="grid gap-2 sm:col-span-2 xl:col-span-3">
                  <Label htmlFor="disponibilidad-motivo">Motivo</Label>
                  <Input
                    id="disponibilidad-motivo"
                    value={disponibilidadForm.motivo}
                    disabled={saving}
                    onChange={(event) =>
                      setDisponibilidadForm((prev) => ({
                        ...prev,
                        motivo: event.target.value,
                      }))
                    }
                    placeholder="Opcional"
                  />
                </div>
              </div>
              {!editingDisponibilidad ? (
                <div className="mt-5 grid gap-3 rounded-2xl border border-[#00D1C1]/20 bg-[#00D1C1]/10 p-4 text-sm text-[#D6D6D6]">
                  <p className="font-semibold text-[#20E0D0]">
                    {slotValidation.error
                      ? slotValidation.error
                      : `Se crearan ${clientCreatableSlots.length} horarios entre ${disponibilidadForm.horaInicio} y ${disponibilidadForm.horaFin}.`}
                  </p>
                  {!slotValidation.error ? (
                    <p className="text-xs leading-5 text-[#A8A8A8]">
                      Total calculado: {slotValidation.slots.length}. Duplicados
                      omitidos: {clientDuplicatedSlots.length}. Con reserva
                      existente: {clientReservedSlots.length}.
                    </p>
                  ) : null}
                  {clientDuplicatedSlots.length > 0 ? (
                    <p className="break-words text-xs text-amber-200">
                      Duplicados detectados: {clientDuplicatedSlots.join(", ")}.
                    </p>
                  ) : null}
                  {clientReservedSlots.length > 0 ? (
                    <p className="break-words text-xs text-red-200">
                      No se modificaran horarios con reserva:{" "}
                      {clientReservedSlots.join(", ")}.
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap">
                <Button
                  type="submit"
                  className="rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0]"
                  disabled={disponibilidadSubmitDisabled}
                >
                  {saving ? "Guardando..." : "Guardar disponibilidad"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => {
                    setEditingDisponibilidad(null);
                    setPanelMode(null);
                    setModalFeedback(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : null}
        </div>
        ) : null}
      </AppModal>

      <DayView
        date={fecha}
        eventos={dayEventos}
        disponibilidad={dayDisponibilidad}
        loading={loading}
        saving={saving}
        onSelectEvento={setSelectedEvento}
        onEditDisponibilidad={openEditDisponibilidad}
        onDeleteDisponibilidad={handleDeleteDisponibilidad}
      />

      <AppModal
        open={Boolean(selectedEvento)}
        title={selectedEvento ? `Reserva #${selectedEvento.id}` : "Reserva"}
        description="Detalle de la reserva seleccionada en calendario."
        onOpenChange={(open) => {
          if (!open) setSelectedEvento(null);
        }}
      >
        {selectedEvento ? (
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-[#00D1C1]">
                Reserva #{selectedEvento.id}
              </h3>
              <p className="mt-1 text-sm text-[#D6D6D6]">
                {formatFullDate(selectedEvento.fecha.slice(0, 10))} -{" "}
                {getReservaTimeRange(selectedEvento)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedEvento(null)}
            >
              Cerrar
            </Button>
          </div>
          <div className="mt-5 grid gap-3 text-sm text-[#D6D6D6] md:grid-cols-2">
            <p>Cliente: {selectedEvento.cliente_nombre ?? "Cliente sin nombre"}</p>
            <p>Servicio: {selectedEvento.servicio_nombre ?? "Servicio sin nombre"}</p>
            <p>Contacto: {getEventoContacto(selectedEvento) || "Sin contacto"}</p>
            <p>
              Estado:{" "}
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${getEstadoClass(
                  selectedEvento.estado
                )}`}
              >
                {selectedEvento.estado}
              </span>
            </p>
            <p className="md:col-span-2">
              Observacion admin:{" "}
              {selectedEvento.observacion_admin || "Sin observacion"}
            </p>
          </div>
          <p className="mt-4 text-xs text-[#8E8E8E]">
            Para cambiar estados o reagendar, usa la seccion Reservas.
          </p>
        </div>
        ) : null}
      </AppModal>
    </section>
  );
};

function DayView({
  date,
  eventos,
  disponibilidad,
  loading,
  saving,
  onSelectEvento,
  onEditDisponibilidad,
  onDeleteDisponibilidad,
}: {
  date: string;
  eventos: CalendarioEvento[];
  disponibilidad: DisponibilidadAdmin[];
  loading: boolean;
  saving: boolean;
  onSelectEvento: (evento: CalendarioEvento) => void;
  onEditDisponibilidad: (item: DisponibilidadAdmin) => void;
  onDeleteDisponibilidad: (item: DisponibilidadAdmin) => void;
}) {
  return (
    <div className="mt-6 grid min-w-0 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="premium-card min-w-0 rounded-2xl p-4 sm:rounded-3xl sm:p-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[#00D1C1]" />
          <h3 className="text-xl font-semibold text-white">
            {formatFullDate(date)}
          </h3>
        </div>
        <div className="mt-5 grid gap-3">
          {loading ? (
            <p className="text-sm text-[#A8A8A8]">Cargando...</p>
          ) : eventos.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-[#0B0F0F] p-4 text-sm text-[#A8A8A8]">
              No hay reservas para esta fecha
            </p>
          ) : (
            eventos.map((evento) => (
              <ReservaCard
                key={`${evento.id}-${evento.fecha}-${evento.hora}`}
                evento={evento}
                onSelect={onSelectEvento}
              />
            ))
          )}
        </div>
      </div>

      <div className="premium-card min-w-0 rounded-2xl p-4 sm:rounded-3xl sm:p-5">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#00D1C1]" />
          <h3 className="text-xl font-semibold text-white">Horarios</h3>
        </div>
        <DisponibilidadList
          items={disponibilidad}
          loading={loading}
          saving={saving}
          onEdit={onEditDisponibilidad}
          onDelete={onDeleteDisponibilidad}
        />
      </div>
    </div>
  );
}

function ReservaCard({
  evento,
  compact = false,
  onSelect,
}: {
  evento: CalendarioEvento;
  compact?: boolean;
  onSelect: (evento: CalendarioEvento) => void;
}) {
  return (
    <article
      className={
        compact
          ? "min-w-0 rounded-xl border border-white/10 bg-[#0B0F0F] p-2.5"
          : "min-w-0 rounded-2xl border border-white/10 bg-[#0B0F0F] p-4"
      }
    >
      <div
        className={
          compact
            ? "grid gap-2"
            : "flex flex-wrap items-start justify-between gap-3"
        }
      >
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold leading-5 text-white">
            {getReservaTimeRange(evento)} - {evento.cliente_nombre ?? "Cliente sin nombre"}
          </p>
          <p className="mt-1 break-words text-xs text-[#A8A8A8]">
            {evento.servicio_nombre ?? "Servicio sin nombre"}
          </p>
        </div>
        <span
          className={`w-fit rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getEstadoClass(
            evento.estado
          )}`}
        >
          {evento.estado}
        </span>
      </div>
      {!compact ? (
        <div className="mt-3 grid gap-1 text-xs text-[#A8A8A8]">
          <span>{getEventoContacto(evento) || "Sin contacto"}</span>
          {evento.observacion_admin ? <span>{evento.observacion_admin}</span> : null}
        </div>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        title="Ver detalle de reserva"
        aria-label="Ver detalle de reserva"
        className={
          compact
            ? "mt-2 h-8 w-8 rounded-full px-0"
            : "mt-3 w-full sm:w-auto"
        }
        onClick={() => onSelect(evento)}
      >
        <Eye className="h-4 w-4" />
        <span className={compact ? "sr-only" : ""}>Ver detalle</span>
      </Button>
    </article>
  );
}

function DisponibilidadList({
  items,
  loading,
  saving,
  compact = false,
  onEdit,
  onDelete,
}: {
  items: DisponibilidadAdmin[];
  loading: boolean;
  saving: boolean;
  compact?: boolean;
  onEdit: (item: DisponibilidadAdmin) => void;
  onDelete: (item: DisponibilidadAdmin) => void;
}) {
  if (loading) {
    return <p className="mt-5 text-sm text-[#A8A8A8]">Cargando...</p>;
  }

  if (items.length === 0) {
    return (
      <p
        className={
          compact
            ? "rounded-xl border border-white/10 bg-[#0B0F0F] p-2.5 text-xs text-[#A8A8A8]"
            : "mt-5 rounded-2xl border border-white/10 bg-[#0B0F0F] p-4 text-sm text-[#A8A8A8]"
        }
      >
        No hay horarios creados para este dia. Usa Crear disponibilidad para agregar bloques horarios.
      </p>
    );
  }

  return (
    <div className={compact ? "grid gap-1.5" : "mt-5 grid gap-2.5"}>
      {items.map((item) => (
        <div
          key={`${item.id}-${item.fecha}-${item.hora}`}
          className={`rounded-xl border bg-[#0B0F0F] p-2.5 ${
            isOcupado(item)
              ? "border-amber-300/25"
              : isBloqueo(item)
              ? "border-red-400/20"
              : "border-[#00D1C1]/20"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="block text-sm font-semibold leading-5 text-white">
                {item.hora_fin && timeLabel(item.hora_fin) !== timeLabel(item.hora)
                  ? `${timeLabel(item.hora)} - ${timeLabel(item.hora_fin)}`
                  : timeLabel(item.hora)}
              </span>
              {item.motivo ? (
                <p className="mt-0.5 truncate text-xs text-[#A8A8A8]">
                  {item.motivo}
                </p>
              ) : null}
            </div>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getDisponibilidadClass(
                item
              )}`}
            >
              {isOcupado(item)
                ? "reservado"
                : isBloqueo(item)
                  ? "bloqueo"
                  : "disponible"}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-end gap-1.5">
            {!isBloqueo(item) && !isOcupado(item) ? (
              <Button
                variant="outline"
                size="sm"
                title="Editar horario"
                aria-label="Editar horario"
                className="h-8 w-8 rounded-full px-0 sm:w-auto sm:px-2.5"
                disabled={saving}
                onClick={() => onEdit(item)}
              >
                <Pencil className="h-4 w-4" />
                <span className={compact ? "hidden 2xl:inline" : "hidden sm:inline"}>
                  Editar
                </span>
              </Button>
            ) : null}
            {!isOcupado(item) ? (
              <Button
                variant="outline"
                size="sm"
                title="Eliminar horario"
                aria-label="Eliminar horario"
                className="h-8 w-8 rounded-full border-red-400/30 px-0 text-red-300 hover:bg-red-500/10 hover:text-red-300 sm:w-auto sm:px-2.5"
                disabled={saving}
                onClick={() => onDelete(item)}
              >
                <Trash2 className="h-4 w-4" />
                <span className={compact ? "hidden 2xl:inline" : "hidden sm:inline"}>
                  Eliminar
                </span>
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminCalendarioSection;
