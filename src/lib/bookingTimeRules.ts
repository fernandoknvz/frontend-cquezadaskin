export const MIN_BOOKING_LEAD_MINUTES = 60;

export const SAME_DAY_BOOKING_LEAD_MESSAGE =
  "Para reservas de hoy debes seleccionar un horario con al menos 1 hora de anticipación";

const pad = (value: number) => String(value).padStart(2, "0");

export const getTodayKey = (now = new Date()) =>
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

export const keyToLocalDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

export const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

export const isPastDateKey = (fecha: string, now = new Date()) => {
  const date = keyToLocalDate(fecha);
  if (!date) return true;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
};

export const isBookableDateTime = (
  fecha: string,
  hora: string,
  now = new Date()
) => {
  if (!fecha || !hora || isPastDateKey(fecha, now)) return false;
  if (fecha !== getTodayKey(now)) return true;

  const minutes = timeToMinutes(hora);
  if (minutes === null) return false;

  const thresholdMinutes =
    now.getHours() * 60 + now.getMinutes() + MIN_BOOKING_LEAD_MINUTES;
  return minutes >= thresholdMinutes;
};

export const getBookableTimesForDate = (
  fecha: string,
  horas: string[],
  now = new Date()
) => {
  if (!fecha || isPastDateKey(fecha, now)) return [];

  const normalizedTimes = horas.map((hora) => hora.slice(0, 5));
  if (fecha !== getTodayKey(now)) return normalizedTimes;

  return normalizedTimes.filter((hora) => isBookableDateTime(fecha, hora, now));
};

export const getMinimumBookableTimeForDate = (fecha: string, now = new Date()) => {
  if (fecha !== getTodayKey(now)) return undefined;

  const thresholdMinutes =
    now.getHours() * 60 + now.getMinutes() + MIN_BOOKING_LEAD_MINUTES;
  if (thresholdMinutes >= 24 * 60) return "23:59";

  return `${pad(Math.floor(thresholdMinutes / 60))}:${pad(
    thresholdMinutes % 60
  )}`;
};
