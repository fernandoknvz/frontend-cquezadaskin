import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Ban,
  CalendarDays,
  Clock,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Settings2,
  Unlock,
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
  getCalendario,
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

type CalendarMode = "dia" | "semana";
type PanelMode = "disponibilidad" | "habilitar-dia" | null;
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

type DaySummary = {
  disponibles: number;
  bloqueados: number;
  solicitadas: number;
  confirmadas: number;
  reservas: number;
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

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getWeekDays = (dateKey: string) => {
  const date = parseDateKey(dateKey);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = addDays(date, mondayOffset);
  return Array.from({ length: 7 }, (_, index) => toDateKey(addDays(monday, index)));
};

const formatShortDate = (value: string) =>
  parseDateKey(value).toLocaleDateString("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

const getDateRangeLabel = (days: string[]) => {
  const first = days[0] ?? "";
  const last = days[days.length - 1] ?? "";
  return first && last ? `${formatShortDate(first)} - ${formatShortDate(last)}` : "";
};

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
  isTruthyFlag(item.ocupada);

const isBloqueo = (item: DisponibilidadAdmin) =>
  !isOcupado(item) &&
  (normalizeText(item.tipo) === "bloqueo" ||
    normalizeText(item.estado) === "bloqueado" ||
    normalizeText(item.estado) === "no_disponible" ||
    normalizeText(item.estado) === "no disponible");

const isDisponible = (item: DisponibilidadAdmin) =>
  !isOcupado(item) && !isBloqueo(item);

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

const getDisponibilidadStatusLabel = (
  item: DisponibilidadAdmin,
  evento?: CalendarioEvento
) => {
  if (isOcupado(item)) {
    const estado = normalizeText(evento?.estado);
    if (estado === "confirmada") return "Confirmado";
    if (estado === "solicitada" || estado === "pendiente") return "Solicitado";
    if (estado) return evento?.estado ?? "Reservado";
    return "Reservado";
  }

  return isBloqueo(item) ? "Bloqueado" : "Disponible";
};

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

const getDaySummary = (
  eventos: CalendarioEvento[],
  disponibilidad: DisponibilidadAdmin[]
): DaySummary => ({
  disponibles: disponibilidad.filter(isDisponible).length,
  bloqueados: disponibilidad.filter(isBloqueo).length,
  solicitadas: eventos.filter((evento) => {
    const estado = normalizeText(evento.estado);
    return estado === "solicitada" || estado === "pendiente";
  }).length,
  confirmadas: eventos.filter(
    (evento) => normalizeText(evento.estado) === "confirmada"
  ).length,
  reservas: eventos.filter(isActiveEvento).length,
});

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
  const [mode, setMode] = useState<CalendarMode>("dia");
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<AdminNotification | null>(
    null
  );
  const [modalFeedback, setModalFeedback] = useState<ModalFeedback>(null);
  const [disponibilidadForm, setDisponibilidadForm] =
    useState<DisponibilidadForm>({
      fecha: todayKey(),
      horaInicio: "10:00",
      horaFin: "19:00",
      intervaloMinutos: 30,
      disponible: true,
      motivo: "",
    });

  const clearNotification = useCallback(() => setNotification(null), []);

  const showToast = useCallback((notificationData: AdminNotification) => {
    setNotification(notificationData);
  }, []);

  const weekDays = useMemo(() => getWeekDays(fecha), [fecha]);
  const range = useMemo(
    () =>
      mode === "semana"
        ? {
            fecha_desde: weekDays[0],
            fecha_hasta: weekDays[weekDays.length - 1],
          }
        : { fecha_desde: fecha, fecha_hasta: fecha },
    [fecha, mode, weekDays]
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
      const calendarioRequest =
        mode === "semana" ? getCalendario(range) : getCalendarioDia(fecha);
      const [eventosResponse, disponibilidadResponse] = await Promise.all([
        calendarioRequest,
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
  }, [fecha, mode, range, showToast]);

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
  const dayRawDisponibilidad = sortByHour(disponibilidadByDate.get(fecha) ?? []);
  const dayDisponibilidad = dedupeDisponibilidadForDisplay(
    dayRawDisponibilidad
  );
  const eventById = useMemo(() => {
    const map = new Map<string, CalendarioEvento>();
    eventos.forEach((evento) => map.set(String(evento.id), evento));
    return map;
  }, [eventos]);
  const daySummary = useMemo(
    () => getDaySummary(dayEventos, dayDisponibilidad),
    [dayDisponibilidad, dayEventos]
  );
  const weekSummaries = useMemo(
    () =>
      weekDays.map((day) => {
        const dayEvents = sortByHour(eventosByDate.get(day) ?? []);
        const dayItems = dedupeDisponibilidadForDisplay(
          sortByHour(disponibilidadByDate.get(day) ?? [])
        );
        return {
          date: day,
          eventos: dayEvents,
          disponibilidad: dayItems,
          summary: getDaySummary(dayEvents, dayItems),
        };
      }),
    [disponibilidadByDate, eventosByDate, weekDays]
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
  const openDisponibilidadPanel = (nextPanelMode: PanelMode = "disponibilidad") => {
    setEditingDisponibilidad(null);
    setPanelMode(nextPanelMode);
    setModalFeedback(null);
    clearNotification();
    setDisponibilidadForm({
      fecha: normalizeAvailabilityDateForApi(fecha) || fecha,
      horaInicio: nextPanelMode === "habilitar-dia" ? "10:00" : "10:00",
      horaFin: nextPanelMode === "habilitar-dia" ? "19:00" : "12:00",
      intervaloMinutos: 30,
      disponible: true,
      motivo: nextPanelMode === "habilitar-dia" ? "Dia habilitado" : "",
    });
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
        if (panelMode === "habilitar-dia") {
          const confirmed = window.confirm(
            `Habilitar ${formatFullDate(disponibilidadApiDate)} de ${disponibilidadApiStartTime} a ${disponibilidadApiEndTime} cada ${disponibilidadForm.intervaloMinutos} minutos?`
          );
          if (!confirmed) return;
        }

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
          title:
            panelMode === "habilitar-dia"
              ? "Dia habilitado"
              : "Disponibilidad creada",
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

  const handleBloquearDia = async (dateKey = fecha) => {
    const dayItems = disponibilidadByDate.get(dateKey) ?? [];
    const candidates = dayItems.filter(isDisponible);
    const reservedCount = dayItems.filter(isOcupado).length;

    if (candidates.length === 0) {
      showToast({
        variant: "info",
        title: "Sin horarios disponibles",
        description:
          reservedCount > 0
            ? "El dia solo tiene reservas o bloqueos. No se tocaron reservas existentes."
            : "No hay disponibilidad libre para bloquear en este dia.",
      });
      return;
    }

    const confirmed = window.confirm(
      "Esto bloqueara los horarios disponibles del dia, pero no eliminara reservas existentes."
    );
    if (!confirmed) return;

    setSaving(true);
    setActionLoading(`bloquear-${dateKey}`);
    clearNotification();
    try {
      await Promise.all(
        candidates.map((item) =>
          updateDisponibilidad(item.id, {
            fecha: normalizeAvailabilityDateForApi(item.fecha) || dateKey,
            hora: normalizeAvailabilityTimeForApi(item.hora) || timeLabel(item.hora),
            disponible: false,
            tipo: "bloqueo",
            motivo: item.motivo ?? "Dia bloqueado",
          })
        )
      );
      showToast({
        variant: "success",
        title: "Dia bloqueado",
        description: `${candidates.length} horario${
          candidates.length === 1 ? "" : "s"
        } disponible${candidates.length === 1 ? "" : "s"} bloqueado${
          candidates.length === 1 ? "" : "s"
        }. Las reservas existentes no se modificaron.`,
      });
      await loadCalendario();
    } catch (err) {
      showToast({
        variant: "error",
        title: "No se pudo bloquear el dia",
        description:
          err instanceof Error ? err.message : "Intenta actualizar nuevamente.",
      });
    } finally {
      setSaving(false);
      setActionLoading(null);
    }
  };

  const handleHabilitarSemana = async () => {
    const start = "10:00";
    const end = "19:00";
    const interval: AvailabilityInterval = 30;
    const validation = generateAvailabilitySlots(start, end, interval);
    if (validation.error) {
      showToast({
        variant: "error",
        title: "Rango invalido",
        description: validation.error,
      });
      return;
    }

    const confirmed = window.confirm(
      `Habilitar la semana ${getDateRangeLabel(
        weekDays
      )} de ${start} a ${end} cada ${interval} minutos?`
    );
    if (!confirmed) return;

    setSaving(true);
    setActionLoading("habilitar-semana");
    clearNotification();
    try {
      const responses = await Promise.all(
        weekDays.map((day) =>
          createDisponibilidadBulk({
            fecha: day,
            hora_inicio: start,
            hora_fin: end,
            intervalo_minutos: interval,
            estado: "disponible",
            motivo: "Semana habilitada",
          })
        )
      );
      const creados = responses.reduce(
        (total, response) => total + Number(response.creados ?? 0),
        0
      );
      const omitidos = responses.reduce(
        (total, response) => total + Number(response.omitidos ?? 0),
        0
      );
      showToast({
        variant: "success",
        title: "Semana habilitada",
        description: `${creados} horarios creados. ${omitidos} omitidos por duplicados o restricciones.`,
      });
      await loadCalendario();
    } catch (err) {
      showToast({
        variant: "error",
        title: "No se pudo habilitar la semana",
        description:
          err instanceof Error ? err.message : "Intenta actualizar nuevamente.",
      });
    } finally {
      setSaving(false);
      setActionLoading(null);
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
      <div className="flex flex-col items-stretch gap-3 xl:flex-row xl:flex-wrap xl:items-start xl:justify-between">
        <div className="min-w-0">
          <h2 className="premium-section-title text-2xl font-semibold sm:text-3xl">
            Calendario
          </h2>
          <p className="mt-1 text-sm text-[#D6D6D6]">
            Gestiona reservas, disponibilidad y bloqueos sin mezclar horarios libres con citas reales.
          </p>
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          <Button
            type="button"
            variant={mode === "dia" ? "default" : "outline"}
            className={mode === "dia" ? "bg-[#00D1C1] text-[#03110f]" : ""}
            onClick={() => setMode("dia")}
          >
            Vista dia
          </Button>
          <Button
            type="button"
            variant={mode === "semana" ? "default" : "outline"}
            className={mode === "semana" ? "bg-[#00D1C1] text-[#03110f]" : ""}
            onClick={() => setMode("semana")}
          >
            Vista semana
          </Button>
        </div>
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
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={loadCalendario}
          disabled={loading}
        >
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refrescar
        </Button>
      </div>

      {mode === "dia" ? (
        <DaySummaryCards summary={daySummary} />
      ) : null}

      <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:flex xl:flex-wrap xl:items-center">
        <Button
          className="w-full min-w-0 rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0] xl:w-auto"
          onClick={() => openDisponibilidadPanel("habilitar-dia")}
          disabled={saving}
        >
          <Unlock className="h-4 w-4" />
          Habilitar dia
        </Button>
        <Button
          className="w-full min-w-0 xl:w-auto"
          variant="outline"
          onClick={() => handleBloquearDia(fecha)}
          disabled={saving}
        >
          <Ban className="h-4 w-4" />
          Bloquear dia
        </Button>
        <Button
          className="w-full min-w-0 xl:w-auto"
          variant="outline"
          onClick={() => openDisponibilidadPanel("disponibilidad")}
          disabled={saving}
        >
          <Plus className="h-4 w-4" />
          Crear horario
        </Button>
        {mode === "semana" ? (
          <Button
            className="w-full min-w-0 xl:w-auto"
            variant="outline"
            onClick={handleHabilitarSemana}
            disabled={saving}
          >
            <Settings2 className="h-4 w-4" />
            {actionLoading === "habilitar-semana"
              ? "Habilitando..."
              : "Habilitar esta semana"}
          </Button>
        ) : null}
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
        title={
          editingDisponibilidad
            ? "Editar disponibilidad"
            : panelMode === "habilitar-dia"
              ? "Habilitar dia completo"
              : "Crear horario personalizado"
        }
        description="Guarda disponibilidad sin modificar reservas existentes."
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
            <form onSubmit={handleCreateDisponibilidad}>
              <h3 className="text-xl font-semibold text-white">
                {editingDisponibilidad
                  ? "Editar disponibilidad"
                  : panelMode === "habilitar-dia"
                    ? "Habilitar dia"
                    : "Crear horario"}
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
        </div>
        ) : null}
      </AppModal>

      {mode === "dia" ? (
        <DayView
          date={fecha}
          eventos={dayEventos}
          disponibilidad={dayDisponibilidad}
          eventById={eventById}
          loading={loading}
          saving={saving}
          onSelectEvento={setSelectedEvento}
          onEditDisponibilidad={openEditDisponibilidad}
          onDeleteDisponibilidad={handleDeleteDisponibilidad}
        />
      ) : (
        <WeekView
          days={weekSummaries}
          loading={loading}
          saving={saving}
          actionLoading={actionLoading}
          onOpenDay={(dateKey) => {
            setFecha(dateKey);
            setMode("dia");
          }}
          onBlockDay={handleBloquearDia}
        />
      )}

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

function DaySummaryCards({ summary }: { summary: DaySummary }) {
  const items = [
    {
      label: "Disponibles",
      value: summary.disponibles,
      className: "border-[#00D1C1]/25 bg-[#00D1C1]/10 text-[#20E0D0]",
    },
    {
      label: "Bloqueados",
      value: summary.bloqueados,
      className: "border-red-400/25 bg-red-500/10 text-red-200",
    },
    {
      label: "Solicitadas",
      value: summary.solicitadas,
      className: "border-sky-300/25 bg-sky-400/10 text-sky-200",
    },
    {
      label: "Confirmadas",
      value: summary.confirmadas,
      className: "border-emerald-300/25 bg-emerald-400/10 text-emerald-200",
    },
  ];

  return (
    <div className="mt-5 grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-2xl border p-4 ${item.className}`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em]">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function WeekView({
  days,
  loading,
  saving,
  actionLoading,
  onOpenDay,
  onBlockDay,
}: {
  days: {
    date: string;
    eventos: CalendarioEvento[];
    disponibilidad: DisponibilidadAdmin[];
    summary: DaySummary;
  }[];
  loading: boolean;
  saving: boolean;
  actionLoading: string | null;
  onOpenDay: (date: string) => void;
  onBlockDay: (date: string) => void;
}) {
  if (loading) {
    return (
      <div className="mt-6 rounded-2xl border border-white/10 bg-[#0B0F0F] p-4 text-sm text-[#A8A8A8]">
        Cargando semana...
      </div>
    );
  }

  return (
    <div className="mt-6 grid min-w-0 gap-3 lg:grid-cols-2 2xl:grid-cols-4">
      {days.map((day) => (
        <article
          key={day.date}
          className="min-w-0 rounded-2xl border border-white/10 bg-[#0B0F0F] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold capitalize text-white">
                {formatShortDate(day.date)}
              </h3>
              <p className="mt-1 text-xs text-[#8E8E8E]">
                {day.summary.reservas} reservas
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-[#111414] px-2 py-1 text-xs text-[#D6D6D6]">
              {day.disponibilidad.length} slots
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <MetricPill label="Disponibles" value={day.summary.disponibles} />
            <MetricPill label="Bloqueados" value={day.summary.bloqueados} />
            <MetricPill label="Reservas" value={day.summary.reservas} />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onOpenDay(day.date)}
            >
              Abrir dia
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-red-400/30 text-red-300 hover:bg-red-500/10 hover:text-red-300"
              disabled={saving}
              onClick={() => onBlockDay(day.date)}
            >
              {actionLoading === `bloquear-${day.date}` ? "Bloqueando..." : "Bloquear"}
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111414] p-2">
      <p className="text-[11px] leading-4 text-[#8E8E8E]">{label}</p>
      <p className="mt-1 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

function DayView({
  date,
  eventos,
  disponibilidad,
  eventById,
  loading,
  saving,
  onSelectEvento,
  onEditDisponibilidad,
  onDeleteDisponibilidad,
}: {
  date: string;
  eventos: CalendarioEvento[];
  disponibilidad: DisponibilidadAdmin[];
  eventById: Map<string, CalendarioEvento>;
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
          <h3 className="text-xl font-semibold capitalize text-white">
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
          <h3 className="text-xl font-semibold text-white">Gestion de horarios</h3>
        </div>
        <DisponibilidadList
          items={disponibilidad}
          eventById={eventById}
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
  eventById,
  loading,
  saving,
  compact = false,
  onEdit,
  onDelete,
}: {
  items: DisponibilidadAdmin[];
  eventById: Map<string, CalendarioEvento>;
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
          {(() => {
            const evento = item.reserva_id
              ? eventById.get(String(item.reserva_id))
              : undefined;

            return (
              <>
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
              {evento ? (
                <p className="mt-0.5 truncate text-xs text-[#A8A8A8]">
                  {evento.cliente_nombre ?? "Cliente sin nombre"} -{" "}
                  {evento.servicio_nombre ?? "Servicio sin nombre"}
                </p>
              ) : null}
            </div>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getDisponibilidadClass(
                item
              )}`}
            >
              {getDisponibilidadStatusLabel(item, evento)}
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
              </>
            );
          })()}
        </div>
      ))}
    </div>
  );
}

export default AdminCalendarioSection;
