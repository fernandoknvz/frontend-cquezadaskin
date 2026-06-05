export type ReservaTimeLike = {
  id: number | string;
  fecha: string;
  hora: string;
  hora_fin?: string | null;
  duracion_min?: number | string | null;
};

const minutesInDay = 24 * 60;

export const timeLabel = (value?: string | null) =>
  value ? value.slice(0, 5) : "Sin hora";

const timeToMinutes = (value?: string | null) => {
  if (!value) return null;
  const [hoursRaw, minutesRaw] = value.slice(0, 5).split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

const minutesToTime = (value: number) => {
  const normalized = ((value % minutesInDay) + minutesInDay) % minutesInDay;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export const addMinutesToTime = (time?: string | null, minutes = 30) => {
  const start = timeToMinutes(time);
  if (start === null) return null;
  return minutesToTime(start + minutes);
};

export const getReservaEndTime = (reserva: ReservaTimeLike) => {
  if (reserva.hora_fin) return timeLabel(reserva.hora_fin);

  const duration = Number(reserva.duracion_min);
  if (Number.isFinite(duration) && duration > 0) {
    return addMinutesToTime(reserva.hora, duration);
  }

  return null;
};

export const getReservaTimeRange = (reserva: ReservaTimeLike) => {
  const start = timeLabel(reserva.hora);
  const end = getReservaEndTime(reserva);
  return end && end !== start ? `${start} - ${end}` : start;
};

export const mergeReservaTimes = <T extends ReservaTimeLike>(
  current: T,
  incoming: T
): T => {
  const currentStart = timeToMinutes(current.hora);
  const incomingStart = timeToMinutes(incoming.hora);
  const currentEnd = timeToMinutes(getReservaEndTime(current));
  const incomingEnd =
    timeToMinutes(getReservaEndTime(incoming)) ??
    (incomingStart === null ? null : incomingStart + 30);

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
    fecha: current.fecha || incoming.fecha,
    hora,
    hora_fin: maxEnd === null ? current.hora_fin ?? incoming.hora_fin : minutesToTime(maxEnd),
    duracion_min: current.duracion_min ?? incoming.duracion_min,
  };
};

export const dedupeReservasById = <T extends ReservaTimeLike>(reservas: T[]) => {
  const byId = new Map<string, T>();
  const result: T[] = [];

  reservas.forEach((reserva) => {
    const key = String(reserva.id ?? "");
    if (!key) {
      result.push(reserva);
      return;
    }

    const existing = byId.get(key);
    if (!existing) {
      byId.set(key, reserva);
      result.push(reserva);
      return;
    }

    const merged = mergeReservaTimes(existing, reserva);
    byId.set(key, merged);
    const index = result.findIndex((item) => String(item.id ?? "") === key);
    if (index >= 0) result[index] = merged;
  });

  return result;
};
