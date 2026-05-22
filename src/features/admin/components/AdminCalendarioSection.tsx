import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CalendarDays,
  Clock,
  Eye,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createBloqueo,
  createDisponibilidad,
  deleteBloqueo,
  deleteDisponibilidad,
  getCalendarioDia,
  getCalendarioSemana,
  getDisponibilidad,
  updateDisponibilidad,
  type CalendarioEvento,
  type DisponibilidadAdmin,
} from "@/services/adminCalendarioApi";

const ESTADOS_RESERVA = [
  "solicitada",
  "pendiente",
  "confirmada",
  "cancelada",
  "completada",
  "reagendada",
] as const;

type VistaCalendario = "dia" | "semana";
type PanelMode = "disponibilidad" | "bloqueo" | null;

type DisponibilidadForm = {
  fecha: string;
  hora: string;
  disponible: boolean;
  motivo: string;
};

type BloqueoForm = {
  fecha: string;
  hora: string;
  motivo: string;
};

const pad = (value: number) => String(value).padStart(2, "0");

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const todayKey = () => toDateKey(new Date());

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(date.getDate() + amount);
  return next;
};

const parseDateKey = (dateKey: string) => {
  const date = new Date(`${dateKey}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const startOfWeek = (dateKey: string) => {
  const date = parseDateKey(dateKey);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(date, diff);
};

const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha";
  const date = parseDateKey(value.slice(0, 10));
  return date.toLocaleDateString("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};

const formatFullDate = (value: string) =>
  parseDateKey(value).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const timeLabel = (value?: string | null) =>
  value ? value.slice(0, 5) : "Sin hora";

const normalizeText = (value?: string | null) => value?.toLowerCase() ?? "";

const isBloqueo = (item: DisponibilidadAdmin) =>
  normalizeText(item.tipo) === "bloqueo" || item.disponible === false;

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
  isBloqueo(item)
    ? "border-red-400/30 bg-red-500/10 text-red-200"
    : "border-[#00D1C1]/30 bg-[#00D1C1]/10 text-[#20E0D0]";

const sortByHour = <T extends { hora: string }>(items: T[]) =>
  [...items].sort((a, b) => timeLabel(a.hora).localeCompare(timeLabel(b.hora)));

const getEventoContacto = (evento: CalendarioEvento) =>
  evento.cliente_email ?? evento.cliente_correo ?? evento.cliente_telefono ?? "";

export const AdminCalendarioSection = () => {
  const [vista, setVista] = useState<VistaCalendario>("dia");
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
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [disponibilidadForm, setDisponibilidadForm] =
    useState<DisponibilidadForm>({
      fecha: todayKey(),
      hora: "10:00",
      disponible: true,
      motivo: "",
    });
  const [bloqueoForm, setBloqueoForm] = useState<BloqueoForm>({
    fecha: todayKey(),
    hora: "10:00",
    motivo: "",
  });

  const weekDays = useMemo(() => {
    const start = startOfWeek(fecha);
    return Array.from({ length: 7 }, (_, index) => toDateKey(addDays(start, index)));
  }, [fecha]);

  const range = useMemo(() => {
    if (vista === "dia") {
      return { fecha_desde: fecha, fecha_hasta: fecha };
    }
    return {
      fecha_desde: weekDays[0],
      fecha_hasta: weekDays[weekDays.length - 1],
    };
  }, [fecha, vista, weekDays]);

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
    setError(null);
    try {
      const [eventosResponse, disponibilidadResponse] = await Promise.all([
        vista === "dia" ? getCalendarioDia(fecha) : getCalendarioSemana(fecha),
        getDisponibilidad(range),
      ]);
      setEventos(eventosResponse);
      setDisponibilidad(disponibilidadResponse);
    } catch (err) {
      setEventos([]);
      setDisponibilidad([]);
      setError(
        err instanceof Error ? err.message : "No se pudo cargar el calendario"
      );
    } finally {
      setLoading(false);
    }
  }, [fecha, range, vista]);

  useEffect(() => {
    loadCalendario();
  }, [loadCalendario]);

  const eventosByDate = useMemo(() => {
    const groups = new Map<string, CalendarioEvento[]>();
    filteredEventos.forEach((evento) => {
      const key = evento.fecha.slice(0, 10);
      groups.set(key, [...(groups.get(key) ?? []), evento]);
    });
    return groups;
  }, [filteredEventos]);

  const disponibilidadByDate = useMemo(() => {
    const groups = new Map<string, DisponibilidadAdmin[]>();
    disponibilidad.forEach((item) => {
      const key = item.fecha.slice(0, 10);
      groups.set(key, [...(groups.get(key) ?? []), item]);
    });
    return groups;
  }, [disponibilidad]);

  const dayEventos = sortByHour(eventosByDate.get(fecha) ?? []);
  const dayDisponibilidad = sortByHour(disponibilidadByDate.get(fecha) ?? []);

  const openDisponibilidadPanel = () => {
    setEditingDisponibilidad(null);
    setPanelMode("disponibilidad");
    setMessage(null);
    setError(null);
    setDisponibilidadForm((prev) => ({ ...prev, fecha }));
  };

  const openBloqueoPanel = () => {
    setEditingDisponibilidad(null);
    setPanelMode("bloqueo");
    setMessage(null);
    setError(null);
    setBloqueoForm((prev) => ({ ...prev, fecha }));
  };

  const openEditDisponibilidad = (item: DisponibilidadAdmin) => {
    setEditingDisponibilidad(item);
    setPanelMode("disponibilidad");
    setMessage(null);
    setError(null);
    setDisponibilidadForm({
      fecha: item.fecha.slice(0, 10),
      hora: timeLabel(item.hora),
      disponible: item.disponible !== false,
      motivo: item.motivo ?? "",
    });
  };

  const handleCreateDisponibilidad = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload = {
        fecha: disponibilidadForm.fecha,
        hora: disponibilidadForm.hora,
        disponible: disponibilidadForm.disponible,
        motivo: disponibilidadForm.motivo.trim(),
      };

      if (editingDisponibilidad) {
        await updateDisponibilidad(editingDisponibilidad.id, payload);
        setMessage("Disponibilidad actualizada correctamente");
      } else {
        await createDisponibilidad({ ...payload, tipo: "disponibilidad" });
        setMessage("Disponibilidad creada correctamente");
      }
      setEditingDisponibilidad(null);
      setPanelMode(null);
      await loadCalendario();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar la disponibilidad"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBloqueo = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await createBloqueo({
        fecha: bloqueoForm.fecha,
        hora: bloqueoForm.hora,
        motivo: bloqueoForm.motivo.trim(),
      });
      setMessage("Horario bloqueado correctamente");
      setPanelMode(null);
      await loadCalendario();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo bloquear el horario"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDisponibilidad = async (item: DisponibilidadAdmin) => {
    const label = isBloqueo(item) ? "bloqueo" : "disponibilidad";
    const confirmed = window.confirm(`¿Eliminar este ${label}?`);
    if (!confirmed) return;

    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      if (isBloqueo(item)) {
        await deleteBloqueo(item.id);
        setMessage("Bloqueo eliminado correctamente");
      } else {
        await deleteDisponibilidad(item.id);
        setMessage("Disponibilidad eliminada correctamente");
      }
      await loadCalendario();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo eliminar el horario"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="premium-panel rounded-3xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="premium-section-title text-3xl font-semibold">
            Calendario
          </h2>
          <p className="mt-1 text-sm text-[#D6D6D6]">
            Visualiza reservas, disponibilidad y bloqueos por día o semana.
          </p>
        </div>
        <Button variant="outline" onClick={loadCalendario} disabled={loading}>
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Actualizar
        </Button>
      </div>

      <div className="mt-6 grid gap-3 xl:grid-cols-[0.8fr_0.8fr_0.9fr_auto_auto_auto]">
        <Input
          type="date"
          value={fecha}
          onChange={(event) => setFecha(event.target.value)}
          className="h-11 rounded-2xl"
        />
        <select
          value={vista}
          onChange={(event) => setVista(event.target.value as VistaCalendario)}
          className="h-11 rounded-2xl border border-white/10 bg-[#0B0F0F] px-3 text-sm text-white outline-none focus:border-[#00D1C1]/70"
        >
          <option value="dia">Día</option>
          <option value="semana">Semana</option>
        </select>
        <select
          value={estado}
          onChange={(event) => setEstado(event.target.value)}
          className="h-11 rounded-2xl border border-white/10 bg-[#0B0F0F] px-3 text-sm text-white outline-none focus:border-[#00D1C1]/70"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_RESERVA.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <Button variant="outline" onClick={() => setFecha(todayKey())}>
          Hoy
        </Button>
        <Button
          className="rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0]"
          onClick={openDisponibilidadPanel}
        >
          <Plus className="h-4 w-4" />
          Crear disponibilidad
        </Button>
        <Button variant="outline" onClick={openBloqueoPanel}>
          <LockKeyhole className="h-4 w-4" />
          Bloquear horario
        </Button>
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border border-[#00D1C1]/25 bg-[#00D1C1]/10 p-3 text-sm text-[#00D1C1]">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error === "Acceso denegado" ? "Acceso denegado" : error}
        </div>
      ) : null}

      {panelMode ? (
        <div className="mt-6 premium-card rounded-3xl p-5">
          {panelMode === "disponibilidad" ? (
            <form onSubmit={handleCreateDisponibilidad}>
              <h3 className="text-xl font-semibold text-white">
                {editingDisponibilidad
                  ? "Editar disponibilidad"
                  : "Crear disponibilidad"}
              </h3>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="grid gap-2">
                  <Label htmlFor="disponibilidad-fecha">Fecha</Label>
                  <Input
                    id="disponibilidad-fecha"
                    type="date"
                    value={disponibilidadForm.fecha}
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
                  <Label htmlFor="disponibilidad-hora">Hora</Label>
                  <Input
                    id="disponibilidad-hora"
                    type="time"
                    value={disponibilidadForm.hora}
                    onChange={(event) =>
                      setDisponibilidadForm((prev) => ({
                        ...prev,
                        hora: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="disponibilidad-estado">Estado</Label>
                  <select
                    id="disponibilidad-estado"
                    value={disponibilidadForm.disponible ? "true" : "false"}
                    onChange={(event) =>
                      setDisponibilidadForm((prev) => ({
                        ...prev,
                        disponible: event.target.value === "true",
                      }))
                    }
                    className="h-11 rounded-2xl border border-white/10 bg-[#0B0F0F] px-3 text-sm text-white outline-none focus:border-[#00D1C1]/70"
                  >
                    <option value="true">Disponible</option>
                    <option value="false">No disponible</option>
                  </select>
                </div>
                <div className="grid gap-2 md:col-span-2 xl:col-span-1">
                  <Label htmlFor="disponibilidad-motivo">Motivo</Label>
                  <Input
                    id="disponibilidad-motivo"
                    value={disponibilidadForm.motivo}
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
              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  type="submit"
                  className="rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0]"
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar disponibilidad"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingDisponibilidad(null);
                    setPanelMode(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateBloqueo}>
              <h3 className="text-xl font-semibold text-white">
                Bloquear horario
              </h3>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="bloqueo-fecha">Fecha</Label>
                  <Input
                    id="bloqueo-fecha"
                    type="date"
                    value={bloqueoForm.fecha}
                    onChange={(event) =>
                      setBloqueoForm((prev) => ({
                        ...prev,
                        fecha: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bloqueo-hora">Hora</Label>
                  <Input
                    id="bloqueo-hora"
                    type="time"
                    value={bloqueoForm.hora}
                    onChange={(event) =>
                      setBloqueoForm((prev) => ({
                        ...prev,
                        hora: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bloqueo-motivo">Motivo</Label>
                  <Input
                    id="bloqueo-motivo"
                    value={bloqueoForm.motivo}
                    onChange={(event) =>
                      setBloqueoForm((prev) => ({
                        ...prev,
                        motivo: event.target.value,
                      }))
                    }
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  type="submit"
                  className="rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0]"
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Bloquear horario"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPanelMode(null)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : null}

      {vista === "dia" ? (
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
      ) : (
        <WeekView
          days={weekDays}
          eventosByDate={eventosByDate}
          disponibilidadByDate={disponibilidadByDate}
          loading={loading}
          saving={saving}
          onSelectEvento={setSelectedEvento}
          onEditDisponibilidad={openEditDisponibilidad}
          onDeleteDisponibilidad={handleDeleteDisponibilidad}
        />
      )}

      {selectedEvento ? (
        <div className="mt-6 premium-card rounded-3xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-[#00D1C1]">
                Reserva #{selectedEvento.id}
              </h3>
              <p className="mt-1 text-sm text-[#D6D6D6]">
                {formatFullDate(selectedEvento.fecha.slice(0, 10))} ·{" "}
                {timeLabel(selectedEvento.hora)}
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
              Observación admin:{" "}
              {selectedEvento.observacion_admin || "Sin observación"}
            </p>
          </div>
          <p className="mt-4 text-xs text-[#8E8E8E]">
            Para cambiar estados o reagendar, usa la sección Reservas.
          </p>
        </div>
      ) : null}
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
    <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="premium-card rounded-3xl p-5">
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

      <div className="premium-card rounded-3xl p-5">
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

function WeekView({
  days,
  eventosByDate,
  disponibilidadByDate,
  loading,
  saving,
  onSelectEvento,
  onEditDisponibilidad,
  onDeleteDisponibilidad,
}: {
  days: string[];
  eventosByDate: Map<string, CalendarioEvento[]>;
  disponibilidadByDate: Map<string, DisponibilidadAdmin[]>;
  loading: boolean;
  saving: boolean;
  onSelectEvento: (evento: CalendarioEvento) => void;
  onEditDisponibilidad: (item: DisponibilidadAdmin) => void;
  onDeleteDisponibilidad: (item: DisponibilidadAdmin) => void;
}) {
  return (
    <div className="mt-6 overflow-x-auto">
      <div className="grid min-w-[1080px] grid-cols-7 gap-3">
        {days.map((day) => {
          const dayEventos = sortByHour(eventosByDate.get(day) ?? []);
          const dayDisponibilidad = sortByHour(
            disponibilidadByDate.get(day) ?? []
          );

          return (
            <div key={day} className="premium-card rounded-3xl p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#00D1C1]">
                {formatDate(day)}
              </h3>
              <div className="mt-4 grid gap-3">
                {loading ? (
                  <p className="text-xs text-[#A8A8A8]">Cargando...</p>
                ) : dayEventos.length === 0 ? (
                  <p className="rounded-2xl border border-white/10 bg-[#0B0F0F] p-3 text-xs text-[#8E8E8E]">
                    Sin reservas
                  </p>
                ) : (
                  dayEventos.map((evento) => (
                    <ReservaCard
                      key={`${evento.id}-${evento.fecha}-${evento.hora}`}
                      evento={evento}
                      compact
                      onSelect={onSelectEvento}
                    />
                  ))
                )}
                <DisponibilidadList
                  items={dayDisponibilidad}
                  loading={false}
                  saving={saving}
                  compact
                  onEdit={onEditDisponibilidad}
                  onDelete={onDeleteDisponibilidad}
                />
              </div>
            </div>
          );
        })}
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
    <article className="rounded-2xl border border-white/10 bg-[#0B0F0F] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">
            {timeLabel(evento.hora)} · {evento.cliente_nombre ?? "Cliente sin nombre"}
          </p>
          <p className="mt-1 text-xs text-[#A8A8A8]">
            {evento.servicio_nombre ?? "Servicio sin nombre"}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getEstadoClass(
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
        className="mt-3"
        onClick={() => onSelect(evento)}
      >
        <Eye className="h-4 w-4" />
        Ver detalle
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
      <p className="mt-5 rounded-2xl border border-white/10 bg-[#0B0F0F] p-4 text-sm text-[#A8A8A8]">
        Sin disponibilidad registrada
      </p>
    );
  }

  return (
    <div className={compact ? "grid gap-2" : "mt-5 grid gap-3"}>
      {items.map((item) => (
        <div
          key={`${item.id}-${item.fecha}-${item.hora}`}
          className="rounded-2xl border border-white/10 bg-[#0B0F0F] p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-white">
              {timeLabel(item.hora)}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getDisponibilidadClass(
                item
              )}`}
            >
              {isBloqueo(item) ? "bloqueo" : "disponible"}
            </span>
          </div>
          {item.motivo ? (
            <p className="mt-2 text-xs text-[#A8A8A8]">{item.motivo}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {!isBloqueo(item) ? (
              <Button
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => onEdit(item)}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              className="border-red-400/30 text-red-300 hover:bg-red-500/10 hover:text-red-300"
              disabled={saving}
              onClick={() => onDelete(item)}
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminCalendarioSection;
