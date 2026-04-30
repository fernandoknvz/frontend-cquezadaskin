import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock, ClipboardList, LogIn } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getClientToken } from "@/services/clientAuthStorage";
import {
  listClienteReservas,
  type ClienteReserva,
} from "@/services/reservasApi";

const estadoMessages: Record<string, string> = {
  solicitada: "Solicitud recibida, pendiente de confirmación",
  confirmada: "Reserva confirmada",
  cancelada: "Reserva cancelada",
  pendiente: "Pendiente",
};

const estadoStyles: Record<string, string> = {
  solicitada: "border-[#00D1C1]/25 bg-[#00D1C1]/10 text-[#CFFCF8]",
  confirmada: "border-[#00D1C1]/25 bg-[#00D1C1]/10 text-[#CFFCF8]",
  cancelada: "border-red-400/30 bg-red-500/10 text-red-200",
  pendiente: "border-white/10 bg-[#0B0F0F] text-[#D6D6D6]",
};

type ReservaAgrupada = {
  key: string;
  servicio: string;
  fecha?: string;
  estado: string;
  startTime?: string;
  endTime?: string;
  duracionMin: number;
  createdAt?: string;
};

const formatDate = (value?: string) => {
  if (!value) return "Sin fecha";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatDateTime = (value?: string) => {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const timeToMinutes = (value?: string) => {
  if (!value) return null;
  const [hour, minute] = value.slice(0, 5).split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
};

const minutesToTime = (minutes: number) => {
  const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
  const minute = String(minutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
};

const getServicio = (reserva: ClienteReserva) =>
  reserva.servicio_nombre ??
  reserva.nombre_servicio ??
  reserva.servicio ??
  "Tratamiento CQuezadaSkin";

const getServicioKey = (reserva: ClienteReserva) =>
  String(reserva.servicio_id ?? getServicio(reserva)).toLowerCase();

const getCreatedAt = (reserva: ClienteReserva) =>
  reserva.created_at ?? reserva.fecha_creacion ?? reserva.createdAt;

const groupReservas = (reservas: ClienteReserva[]) => {
  const sorted = reservas
    .map((reserva, index) => ({ reserva, index }))
    .sort((a, b) => {
      const aKey = [
        getServicioKey(a.reserva),
        a.reserva.fecha ?? "",
        (a.reserva.estado ?? "pendiente").toLowerCase(),
      ].join("|");
      const bKey = [
        getServicioKey(b.reserva),
        b.reserva.fecha ?? "",
        (b.reserva.estado ?? "pendiente").toLowerCase(),
      ].join("|");

      if (aKey !== bKey) return aKey.localeCompare(bKey);
      return (
        (timeToMinutes(a.reserva.hora) ?? 0) -
        (timeToMinutes(b.reserva.hora) ?? 0)
      );
    });

  const groups: Array<
    ReservaAgrupada & {
      servicioKey: string;
      endMinutes: number | null;
    }
  > = [];

  for (const { reserva, index } of sorted) {
    const startMinutes = timeToMinutes(reserva.hora);
    const estado = (reserva.estado ?? "pendiente").toLowerCase();
    const servicioKey = getServicioKey(reserva);
    const last = groups[groups.length - 1];

    const canJoin =
      last &&
      startMinutes !== null &&
      last.endMinutes !== null &&
      last.servicioKey === servicioKey &&
      last.fecha === reserva.fecha &&
      last.estado === estado &&
      startMinutes === last.endMinutes;

    if (canJoin) {
      last.endMinutes = startMinutes + 30;
      last.endTime = minutesToTime(last.endMinutes);
      last.duracionMin += 30;

      const createdAt = getCreatedAt(reserva);
      if (createdAt && (!last.createdAt || createdAt < last.createdAt)) {
        last.createdAt = createdAt;
      }
      continue;
    }

    const endMinutes = startMinutes === null ? null : startMinutes + 30;
    groups.push({
      key: `${servicioKey}|${reserva.fecha ?? ""}|${estado}|${
        reserva.hora ?? index
      }`,
      servicioKey,
      servicio: getServicio(reserva),
      fecha: reserva.fecha,
      estado,
      startTime: startMinutes === null ? undefined : minutesToTime(startMinutes),
      endTime: endMinutes === null ? undefined : minutesToTime(endMinutes),
      endMinutes,
      duracionMin: 30,
      createdAt: getCreatedAt(reserva),
    });
  }

  return groups.map(({ servicioKey: _servicioKey, endMinutes: _endMinutes, ...group }) => group);
};

export const MisReservasPage: React.FC = () => {
  const [reservas, setReservas] = useState<ClienteReserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = useMemo(() => getClientToken(), []);
  const reservasAgrupadas = useMemo(() => groupReservas(reservas), [reservas]);

  useEffect(() => {
    const loadReservas = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await listClienteReservas(token);
        setReservas(Array.isArray(data) ? data : []);
      } catch (err) {
        setReservas([]);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar tus reservas"
        );
      } finally {
        setLoading(false);
      }
    };

    loadReservas();
  }, [token]);

  return (
    <section className="mx-auto w-[92%] max-w-5xl py-10 sm:py-14">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#00D1C1]">
          Área cliente
        </p>
        <h1 className="premium-heading mt-2 text-4xl font-semibold text-white sm:text-6xl">
          Mis solicitudes
        </h1>
        <p className="mt-3 text-base text-[#D6D6D6] sm:text-lg">
          Revisa el estado de tus solicitudes y reservas en CQuezadaSkin.
        </p>
      </header>

      <div className="mt-8">
        {!token ? (
          <Card className="rounded-lg border-white/10 bg-[#121212]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <LogIn className="h-5 w-5 text-[#00D1C1]" />
                Inicia sesión como cliente
              </CardTitle>
              <CardDescription>
                Necesitas ingresar en el flujo de agenda para ver tus
                solicitudes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                className="rounded-lg bg-[#00D1C1] text-[#03110f] hover:bg-[#20E0D0]"
              >
                <Link to="/agendar">Ir a agendar</Link>
              </Button>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="rounded-lg border border-white/10 bg-[#121212] p-6 text-sm text-[#B8B8B8]">
            Cargando tus solicitudes...
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>No pudimos cargar tus solicitudes</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : reservasAgrupadas.length === 0 ? (
          <Card className="rounded-lg border-white/10 bg-[#121212]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ClipboardList className="h-5 w-5 text-[#00D1C1]" />
                Aún no tienes solicitudes
              </CardTitle>
              <CardDescription>
                Cuando envíes una solicitud de reserva, aparecerá en esta vista.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                className="rounded-lg bg-[#00D1C1] text-[#03110f] hover:bg-[#20E0D0]"
              >
                <Link to="/agendar">Enviar una solicitud</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reservasAgrupadas.map((reserva) => {
              const estadoText = estadoMessages[reserva.estado] ?? "Pendiente";
              const estadoClass =
                estadoStyles[reserva.estado] ?? estadoStyles.pendiente;

              return (
                <Card
                  key={reserva.key}
                  className="rounded-lg border-white/10 bg-[#121212]"
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-white">
                          {reserva.servicio}
                        </h2>
                        <div className="mt-3 grid gap-2 text-sm text-[#D6D6D6] sm:grid-cols-2">
                          <p className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-[#00D1C1]" />
                            {formatDate(reserva.fecha)}
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#00D1C1]" />
                            {reserva.startTime && reserva.endTime
                              ? `${reserva.startTime} a ${reserva.endTime}`
                              : "Sin hora"}
                          </p>
                        </div>
                        <p className="mt-3 text-sm font-medium text-[#D6D6D6]">
                          Duración: {reserva.duracionMin} min
                        </p>
                        <p className="mt-3 text-sm text-[#A8A8A8]">
                          Creada: {formatDateTime(reserva.createdAt)}
                        </p>
                      </div>

                      <div
                        className={`w-fit rounded-full border px-3 py-1 text-sm font-medium ${estadoClass}`}
                      >
                        {estadoText}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default MisReservasPage;
