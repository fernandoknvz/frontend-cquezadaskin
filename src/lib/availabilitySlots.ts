export const AVAILABILITY_INTERVALS = [15, 30, 45, 60] as const;

export type AvailabilityInterval = (typeof AVAILABILITY_INTERVALS)[number];

export type AvailabilitySlotValidation = {
  slots: string[];
  error: string | null;
};

const API_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const VISUAL_DATE_PATTERN = /^(\d{2})[-/](\d{2})[-/](\d{4})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const toMinutes = (time: string) => {
  const match = TIME_PATTERN.exec(time);
  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
};

const toTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const isAvailabilityInterval = (
  value: number
): value is AvailabilityInterval =>
  AVAILABILITY_INTERVALS.includes(value as AvailabilityInterval);

export const normalizeAvailabilityDateForApi = (date: string) => {
  const value = date.trim();
  if (API_DATE_PATTERN.test(value)) return value;

  const visualMatch = VISUAL_DATE_PATTERN.exec(value);
  if (visualMatch) {
    const [, day, month, year] = visualMatch;
    return `${year}-${month}-${day}`;
  }

  const isoDate = value.slice(0, 10);
  return API_DATE_PATTERN.test(isoDate) ? isoDate : "";
};

export const normalizeAvailabilityTimeForApi = (time: string) => {
  const value = time.trim().slice(0, 5);
  return TIME_PATTERN.test(value) ? value : "";
};

export const generateAvailabilitySlots = (
  startTime: string,
  endTime: string,
  intervalMinutes: number
): AvailabilitySlotValidation => {
  const normalizedStartTime = normalizeAvailabilityTimeForApi(startTime);
  const normalizedEndTime = normalizeAvailabilityTimeForApi(endTime);
  const start = toMinutes(normalizedStartTime);
  const end = toMinutes(normalizedEndTime);

  if (start === null || end === null) {
    return { slots: [], error: "Ingresa horas validas para continuar." };
  }

  if (!isAvailabilityInterval(intervalMinutes)) {
    return { slots: [], error: "Selecciona un intervalo permitido." };
  }

  if (end <= start) {
    return {
      slots: [],
      error: "La hora de termino debe ser mayor que la hora de inicio.",
    };
  }

  const slots: string[] = [];
  for (let current = start; current < end; current += intervalMinutes) {
    slots.push(toTime(current));
  }

  return { slots, error: null };
};
