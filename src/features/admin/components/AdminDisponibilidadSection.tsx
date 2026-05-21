import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createDisponibilidad,
  deleteDisponibilidad,
  listSlotsDisponibles,
  type DisponibilidadSlot,
} from "@/services/disponibilidadApi";

/**
 * ====== CONFIG HORARIA (ADMIN) ======
 * Step: 30 min
 * Bloques: 10:00-14:00 y 15:00-20:00.
 */
const STEP_MINUTES = 30;

const pad2 = (n: number) => String(n).padStart(2, "0");

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const toHHMM = (totalMinutes: number) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${pad2(h)}:${pad2(m)}`;
};

const buildTimeOptions = (ranges: Array<{ start: string; end: string }>, stepMin: number) => {
  const out: string[] = [];
  for (const r of ranges) {
    const start = toMinutes(r.start);
    const end = toMinutes(r.end);
    for (let t = start; t <= end; t += stepMin) {
      out.push(toHHMM(t));
    }
  }
  // de-dup (por si rangos se pisan)
  return Array.from(new Set(out));
};

const TIME_OPTIONS = buildTimeOptions(
  [
    { start: "10:00", end: "14:00" }, // incluye 14:00
    { start: "15:00", end: "20:00" }, // incluye 20:00
  ],
  STEP_MINUTES
);

const WEEKDAYS = [
  { label: "Lun", value: 1 },
  { label: "Mar", value: 2 },
  { label: "Mie", value: 3 },
  { label: "Jue", value: 4 },
  { label: "Vie", value: 5 },
  { label: "Sab", value: 6 },
];

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateInput = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
};

const buildDateRange = (start: string, end: string, weekdays: number[]): string[] => {
  const startDate = parseDateInput(start);
  const endDate = parseDateInput(end);
  if (!startDate || !endDate || startDate > endDate) {
    return [];
  }

  const result: string[] = [];
  const cursor = new Date(startDate.getTime());
  while (cursor <= endDate) {
    const day = cursor.getDay();
    if (weekdays.includes(day)) {
      result.push(formatDateInput(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
};

export const AdminDisponibilidadSection = () => {
  const today = new Date();
  const defaultEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14);

  const [desde, setDesde] = useState(formatDateInput(today));
  const [hasta, setHasta] = useState(formatDateInput(defaultEnd));
  const [weekdays, setWeekdays] = useState<number[]>(WEEKDAYS.map((day) => day.value));
  const [hours, setHours] = useState<string[]>(TIME_OPTIONS);
  const [slots, setSlots] = useState<DisponibilidadSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedDates = useMemo(() => buildDateRange(desde, hasta, weekdays), [desde, hasta, weekdays]);
  const totalSlots = selectedDates.length * hours.length;

  const groupedSlots = useMemo(() => {
    const map = new Map<string, DisponibilidadSlot[]>();
    slots.forEach((slot) => {
      const list = map.get(slot.fecha) ?? [];
      list.push(slot);
      map.set(slot.fecha, list);
    });

    // ordena por hora para que se vea consistente
    return Array.from(map.entries()).map(([fecha, items]) => ({
      fecha,
      items: items.slice().sort((a, b) => toMinutes(a.hora) - toMinutes(b.hora)),
    }));
  }, [slots]);

  const toggleWeekday = (value: number) => {
    setWeekdays((prev) => (prev.includes(value) ? prev.filter((day) => day !== value) : [...prev, value]));
  };

  const toggleHour = (value: string) => {
    setHours((prev) => (prev.includes(value) ? prev.filter((hour) => hour !== value) : [...prev, value]));
  };

  const normalizeHours = (items: DisponibilidadSlot[]) => {
    const merged = new Set<string>();
    items.forEach((slot) => merged.add(slot.hora));
    return Array.from(merged).sort((a, b) => toMinutes(a) - toMinutes(b));
  };

  const handleDayToggle = async (fecha: string, active: boolean) => {
    const group = groupedSlots.find((item) => item.fecha === fecha);

    // Si el día ya tiene slots, alternamos esas horas existentes; si no, usamos todas las opciones.
    const hoursList = group ? normalizeHours(group.items) : TIME_OPTIONS;

    if (hoursList.length === 0) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const payload = { fechas: [fecha], horas: hoursList };
      const result = active ? await createDisponibilidad(payload) : await deleteDisponibilidad(payload);
      setMessage(active ? `Dia habilitado (${result.total})` : `Dia bloqueado (${result.total})`);
      await loadSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar dia");
    } finally {
      setLoading(false);
    }
  };

  const handleSlotToggle = async (slot: DisponibilidadSlot) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const payload = { fechas: [slot.fecha], horas: [slot.hora] };
      const isActive = Number(slot.activo) === 1;
      if (isActive) {
        await deleteDisponibilidad(payload);
      } else {
        await createDisponibilidad(payload);
      }
      setMessage(isActive ? "Hora bloqueada" : "Hora habilitada");
      await loadSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar horario");
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = useCallback(async () => {
    if (!desde || !hasta) {
      setError("Debes definir un rango de fechas.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const data = await listSlotsDisponibles(desde, hasta, true);
      setSlots(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar disponibilidad");
    } finally {
      setLoading(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const handleSave = async () => {
    if (selectedDates.length === 0 || hours.length === 0) {
      setError("Selecciona fechas y horas validas.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await createDisponibilidad({ fechas: selectedDates, horas: hours });
      setMessage(`Horarios habilitados: ${result.total}`);
      await loadSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar horarios");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (selectedDates.length === 0 || hours.length === 0) {
      setError("Selecciona fechas y horas validas.");
      return;
    }
    const confirmed = window.confirm("Eliminar horarios seleccionados?");
    if (!confirmed) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await deleteDisponibilidad({ fechas: selectedDates, horas: hours });
      setMessage(`Horarios bloqueados: ${result.total}`);
      await loadSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar horarios");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="premium-panel rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="premium-section-title text-3xl font-semibold">Disponibilidad</h2>
          <p className="mt-1 text-sm text-[#D6D6D6]">Agrega o elimina horarios por rango de fechas y horas.</p>
        </div>
        <Button variant="outline" onClick={loadSlots} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar listado
        </Button>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="dispo-desde" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Desde
            </Label>
            <Input id="dispo-desde" type="date" value={desde} onChange={(event) => setDesde(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dispo-hasta" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Hasta
            </Label>
            <Input id="dispo-hasta" type="date" value={hasta} onChange={(event) => setHasta(event.target.value)} />
          </div>
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Dias disponibles
          </Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => {
              const active = weekdays.includes(day.value);
              return (
                <button
                  type="button"
                  key={day.value}
                  className={`rounded-2xl border px-3 py-1 text-sm ${
                    active ? "border-[#00D1C1]/45 bg-[#00D1C1]/10 text-[#20E0D0] shadow-[0_0_18px_rgba(0,209,193,0.10)]" : "border-white/10 bg-[#0B0F0F] text-[#D6D6D6]"
                  }`}
                  onClick={() => toggleWeekday(day.value)}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horas disponibles
          </Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {TIME_OPTIONS.map((time) => {
              const active = hours.includes(time);
              return (
                <button
                  type="button"
                  key={time}
                  className={`rounded-2xl border px-3 py-1 text-sm ${
                    active ? "border-[#00D1C1]/45 bg-[#00D1C1]/10 text-[#20E0D0] shadow-[0_0_18px_rgba(0,209,193,0.10)]" : "border-white/10 bg-[#0B0F0F] text-[#D6D6D6]"
                  }`}
                  onClick={() => toggleHour(time)}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            className="rounded-2xl bg-[#00D1C1] text-[#03110f] hover:bg-[#20E0D0]"
            onClick={handleSave}
            disabled={loading}
          >
            Habilitar horarios ({totalSlots})
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-red-400/30 text-red-300 hover:bg-red-500/10"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Bloquear horarios
          </Button>
        </div>

        {message ? (
          <div className="rounded-2xl border border-[#00D1C1]/25 bg-[#00D1C1]/10 p-3 text-sm text-[#00D1C1]">{message}</div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
        ) : null}
      </div>

      <div className="mt-8 grid gap-4">
        {groupedSlots.length === 0 ? (
          <p className="text-sm text-[#A8A8A8]">No hay horarios cargados.</p>
        ) : (
          groupedSlots.map((group) => {
            const hasActive = group.items.some((slot) => Number(slot.activo) === 1);
            return (
              <div key={group.fecha} className="premium-card premium-card-hover rounded-3xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-[#00D1C1]">{group.fecha}</h4>
                    <p className="text-xs text-[#D6D6D6]">{hasActive ? "Dia con horarios activos" : "Dia bloqueado"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleDayToggle(group.fecha, true)}
                      disabled={loading}
                    >
                      Habilitar dia
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-red-400/30 text-red-300 hover:bg-red-500/10"
                      onClick={() => handleDayToggle(group.fecha, false)}
                      disabled={loading}
                    >
                      Bloquear dia
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {group.items.map((slot) => {
                    const ocupada = Number(slot.ocupada) === 1;
                    const activa = Number(slot.activo) === 1;
                    const label = ocupada ? "Ocupada" : activa ? "Disponible" : "Bloqueada";
                    const color = ocupada
                      ? "bg-[#00D1C1]/10 text-[#20E0D0]"
                      : activa
                      ? "bg-[#00D1C1]/10 text-[#00D1C1]"
                      : "border border-white/10 bg-[#0B0F0F] text-[#D6D6D6]";
                    return (
                      <button
                        type="button"
                        key={`${group.fecha}-${slot.hora}`}
                        onClick={() => handleSlotToggle(slot)}
                        disabled={loading}
                        className={`rounded-2xl px-3 py-1 text-xs ${color}`}
                        title="Click para alternar"
                      >
                        {slot.hora} • {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default AdminDisponibilidadSection;
