import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  CalendarClock,
  Eye,
  RefreshCw,
  RotateCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { AppModal } from "@/components/ui/AppModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import type { Pagination } from "@/services/adminClientesApi";
import {
  getReservaAdmin,
  listReservasAdmin,
  reagendarReservaAdmin,
  updateReservaEstadoAdmin,
  type ReservaAdmin,
  type ReservaEstado,
  type ReservasFilters,
} from "@/services/adminReservasApi";
import { getReservaTimeRange } from "@/lib/reservaTime";

const ESTADOS_RESERVA = [
  "solicitada",
  "pendiente",
  "confirmada",
  "cancelada",
  "completada",
  "reagendada",
] as const;

type ActionMode = "estado" | "reagendar" | null;

type EstadoForm = {
  estado: ReservaEstado;
  observacion_admin: string;
};

type ReagendarForm = {
  fecha: string;
  hora: string;
  observacion_admin: string;
};

const emptyPagination: Pagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getClienteEmail = (reserva: ReservaAdmin) =>
  reserva.cliente_email ?? reserva.cliente_correo ?? "";

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
  return "border-white/10 bg-[#0B0F0F] text-[#D6D6D6]";
};

const initialFilters: ReservasFilters = {
  estado: "",
  fecha_desde: "",
  fecha_hasta: "",
  search: "",
  page: 1,
  limit: 10,
};

export const AdminReservasSection = () => {
  const toast = useToast();
  const [reservas, setReservas] = useState<ReservaAdmin[]>([]);
  const [filters, setFilters] = useState<ReservasFilters>(initialFilters);
  const [pagination, setPagination] = useState<Pagination>(emptyPagination);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<ReservaAdmin | null>(
    null
  );
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [estadoForm, setEstadoForm] = useState<EstadoForm>({
    estado: "pendiente",
    observacion_admin: "",
  });
  const [reagendarForm, setReagendarForm] = useState<ReagendarForm>({
    fecha: "",
    hora: "",
    observacion_admin: "",
  });

  const loadReservas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listReservasAdmin(filters);
      setReservas(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setReservas([]);
      toast.error({
        title: "No se pudieron cargar las reservas",
        description:
          err instanceof Error ? err.message : "No se pudo cargar la informacion",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    loadReservas();
  }, [loadReservas]);

  const setFilter = <K extends keyof ReservasFilters>(
    field: K,
    value: ReservasFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  const handleFilterSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleSelectReserva = async (reserva: ReservaAdmin) => {
    setSelectedReserva(reserva);
    setDetailLoading(true);
    setActionMode(null);
    try {
      const detail = await getReservaAdmin(reserva.id);
      setSelectedReserva(detail);
      setEstadoForm({
        estado: detail.estado,
        observacion_admin: detail.observacion_admin ?? "",
      });
      setReagendarForm({
        fecha: detail.fecha?.slice(0, 10) ?? "",
        hora: detail.hora?.slice(0, 5) ?? "",
        observacion_admin: detail.observacion_admin ?? "",
      });
    } catch (err) {
      toast.error({
        title: "No se pudo cargar la reserva",
        description:
          err instanceof Error ? err.message : "No se pudo cargar la informacion",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const openEstadoAction = (reserva: ReservaAdmin, estado?: ReservaEstado) => {
    setSelectedReserva(reserva);
    setActionMode("estado");
    setEstadoForm({
      estado: estado ?? reserva.estado,
      observacion_admin: reserva.observacion_admin ?? "",
    });
  };

  const openReagendarAction = (reserva: ReservaAdmin) => {
    setSelectedReserva(reserva);
    setActionMode("reagendar");
    setReagendarForm({
      fecha: reserva.fecha?.slice(0, 10) ?? "",
      hora: reserva.hora?.slice(0, 5) ?? "",
      observacion_admin: reserva.observacion_admin ?? "",
    });
  };

  const handleUpdateEstado = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedReserva) return;

    setSaving(true);
    try {
      await updateReservaEstadoAdmin(selectedReserva.id, {
        estado: estadoForm.estado,
        observacion_admin: estadoForm.observacion_admin.trim(),
        motivo: estadoForm.observacion_admin.trim(),
      });
      toast.success({
        title:
          estadoForm.estado === "cancelada"
            ? "Reserva cancelada"
            : "Reserva actualizada",
        description: "Cambios guardados correctamente.",
      });
      setActionMode(null);
      await loadReservas();
      const detail = await getReservaAdmin(selectedReserva.id);
      setSelectedReserva(detail);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "No se pudo actualizar la reserva";
      toast.error({
        title: "No se pudo actualizar la reserva",
        description: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReagendar = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedReserva) return;

    setSaving(true);
    try {
      await reagendarReservaAdmin(selectedReserva.id, {
        fecha: reagendarForm.fecha,
        hora: reagendarForm.hora,
        observacion_admin: reagendarForm.observacion_admin.trim(),
        motivo: reagendarForm.observacion_admin.trim(),
      });
      toast.success({
        title: "Reserva reagendada",
        description: "Cambios guardados correctamente.",
      });
      setActionMode(null);
      await loadReservas();
      const detail = await getReservaAdmin(selectedReserva.id);
      setSelectedReserva(detail);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "No se pudo reagendar la reserva";
      toast.error({
        title: "No se pudo reagendar la reserva",
        description: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="premium-panel max-w-full overflow-hidden rounded-2xl p-4 sm:rounded-3xl sm:p-6">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="premium-section-title text-2xl font-semibold sm:text-3xl">
            Reservas
          </h2>
          <p className="mt-1 text-sm text-[#D6D6D6]">
            Filtra, revisa y actualiza solicitudes de reserva.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={loadReservas}
          disabled={loading}
        >
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Actualizar
        </Button>
      </div>

      <form
        className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto]"
        onSubmit={handleFilterSubmit}
      >
        <div className="relative min-w-0 sm:col-span-2 xl:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8E8E]" />
          <Input
            value={filters.search ?? ""}
            onChange={(event) => setFilter("search", event.target.value)}
            className="h-11 w-full rounded-2xl pl-10"
            placeholder="Buscar cliente, correo o servicio"
          />
        </div>
        <select
          value={filters.estado ?? ""}
          onChange={(event) => setFilter("estado", event.target.value)}
          className="h-11 w-full rounded-2xl border border-white/10 bg-[#0B0F0F] px-3 text-sm text-white outline-none focus:border-[#00D1C1]/70"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_RESERVA.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>
        <Input
          type="date"
          value={filters.fecha_desde ?? ""}
          onChange={(event) => setFilter("fecha_desde", event.target.value)}
          className="h-11 w-full rounded-2xl"
        />
        <Input
          type="date"
          value={filters.fecha_hasta ?? ""}
          onChange={(event) => setFilter("fecha_hasta", event.target.value)}
          className="h-11 w-full rounded-2xl"
        />
        <Button
          type="submit"
          className="w-full rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0]"
        >
          Filtrar
        </Button>
      </form>

      <div className="mt-6 grid gap-3 lg:hidden">
        {loading ? (
          <p className="rounded-2xl border border-white/10 bg-[#0B0F0F] p-4 text-sm text-[#A8A8A8]">
            Cargando...
          </p>
        ) : reservas.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#0B0F0F] p-4 text-sm text-[#A8A8A8]">
            No hay reservas para los filtros seleccionados
          </p>
        ) : (
          reservas.map((reserva) => (
            <article
              key={reserva.id}
              className="min-w-0 rounded-2xl border border-white/10 bg-[#111414]/70 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-base font-semibold text-white">
                    {reserva.cliente_nombre ?? "Cliente sin nombre"}
                  </h3>
                  <p className="mt-1 break-words text-sm text-[#D6D6D6]">
                    {reserva.servicio_nombre ?? "Servicio sin nombre"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getEstadoClass(
                    reserva.estado
                  )}`}
                >
                  {reserva.estado}
                </span>
              </div>

              <div className="mt-3 grid gap-1 text-sm text-[#D6D6D6]">
                <p>
                  {formatDate(reserva.fecha)} · {getReservaTimeRange(reserva)}
                </p>
                <p className="break-words">{getClienteEmail(reserva) || "Sin correo"}</p>
                <p className="break-words text-[#A8A8A8]">
                  {reserva.cliente_telefono ?? "Sin telefono"}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleSelectReserva(reserva)}
                >
                  <Eye className="h-4 w-4" />
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => openEstadoAction(reserva)}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Estado
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => openReagendarAction(reserva)}
                >
                  <RotateCw className="h-4 w-4" />
                  Reagendar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-red-400/30 text-red-300 hover:bg-red-500/10 hover:text-red-300"
                  onClick={() => openEstadoAction(reserva, "cancelada")}
                >
                  <XCircle className="h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="mt-6 hidden overflow-hidden rounded-2xl border border-white/10 lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-[940px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#0B0F0F] text-xs uppercase tracking-[0.14em] text-[#8E8E8E]">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-[#A8A8A8]" colSpan={6}>
                    Cargando...
                  </td>
                </tr>
              ) : reservas.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-[#A8A8A8]" colSpan={6}>
                    No hay reservas para los filtros seleccionados
                  </td>
                </tr>
              ) : (
                reservas.map((reserva) => (
                  <tr key={reserva.id} className="bg-[#111414]/50">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-white">
                        {reserva.cliente_nombre ?? "Cliente sin nombre"}
                      </p>
                      <p className="text-xs text-[#8E8E8E]">ID {reserva.id}</p>
                    </td>
                    <td className="px-4 py-4 text-[#D6D6D6]">
                      {reserva.servicio_nombre ?? "Servicio sin nombre"}
                    </td>
                    <td className="px-4 py-4 text-[#D6D6D6]">
                      <p>{formatDate(reserva.fecha)}</p>
                      <p className="text-xs text-[#8E8E8E]">
                        {getReservaTimeRange(reserva)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getEstadoClass(
                          reserva.estado
                        )}`}
                      >
                        {reserva.estado}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#D6D6D6]">
                      <p>{getClienteEmail(reserva) || "Sin correo"}</p>
                      <p className="text-xs text-[#8E8E8E]">
                        {reserva.cliente_telefono ?? "Sin teléfono"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectReserva(reserva)}
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEstadoAction(reserva, "confirmada")}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Confirmar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReagendarAction(reserva)}
                        >
                          <RotateCw className="h-4 w-4" />
                          Reagendar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-400/30 text-red-300 hover:bg-red-500/10 hover:text-red-300"
                          onClick={() => openEstadoAction(reserva, "cancelada")}
                        >
                          <XCircle className="h-4 w-4" />
                          Cancelar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm text-[#A8A8A8] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <span>
          Página {pagination.page} de {pagination.totalPages} · {pagination.total} registros
        </span>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1 || loading}
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                page: Math.max(1, Number(prev.page ?? 1) - 1),
              }))
            }
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages || loading}
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                page: Math.min(pagination.totalPages, Number(prev.page ?? 1) + 1),
              }))
            }
          >
            Siguiente
          </Button>
        </div>
      </div>

      <AppModal
        open={Boolean(selectedReserva)}
        title={selectedReserva ? `Reserva #${selectedReserva.id}` : "Reserva"}
        description="Revisa el detalle, cambia estado o reagenda sin salir del listado."
        onOpenChange={(open) => {
          if (!open && !saving) {
            setSelectedReserva(null);
            setActionMode(null);
          }
        }}
        className="w-[min(94vw,980px)]"
      >
        {selectedReserva ? (
        <div className="grid min-w-0 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="premium-card min-w-0 rounded-2xl p-4 sm:rounded-3xl sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-xl font-semibold text-[#00D1C1]">
                  Reserva #{selectedReserva.id}
                </h3>
                <p className="mt-1 break-words text-sm text-[#D6D6D6]">
                  {selectedReserva.cliente_nombre} · {selectedReserva.servicio_nombre}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => {
                  setSelectedReserva(null);
                  setActionMode(null);
                }}
              >
                Cerrar
              </Button>
            </div>

            {detailLoading ? (
              <p className="mt-4 text-sm text-[#A8A8A8]">Cargando detalle...</p>
            ) : (
              <div className="mt-5 grid gap-3 break-words text-sm text-[#D6D6D6]">
                <p>Fecha: {formatDate(selectedReserva.fecha)}</p>
                <p>Hora: {getReservaTimeRange(selectedReserva)}</p>
                <p>
                  Estado:{" "}
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${getEstadoClass(
                      selectedReserva.estado
                    )}`}
                  >
                    {selectedReserva.estado}
                  </span>
                </p>
                <p>Correo: {getClienteEmail(selectedReserva) || "Sin correo"}</p>
                <p>Teléfono: {selectedReserva.cliente_telefono ?? "Sin teléfono"}</p>
                <p>
                  Observación admin:{" "}
                  {selectedReserva.observacion_admin || "Sin observación"}
                </p>
              </div>
            )}
          </div>

          <div className="premium-card min-w-0 rounded-2xl p-4 sm:rounded-3xl sm:p-5">
            {!actionMode ? (
              <div>
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-[#00D1C1]" />
                  <h3 className="text-xl font-semibold text-white">
                    Acciones de reserva
                  </h3>
                </div>
                <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => openEstadoAction(selectedReserva)}
                  >
                    Cambiar estado
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openReagendarAction(selectedReserva)}
                  >
                    Reagendar
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-400/30 text-red-300 hover:bg-red-500/10 hover:text-red-300"
                    onClick={() => openEstadoAction(selectedReserva, "cancelada")}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : actionMode === "estado" ? (
              <form onSubmit={handleUpdateEstado}>
                <h3 className="text-xl font-semibold text-white">
                  Cambiar estado
                </h3>
                <div className="mt-5 grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="reserva-estado">Estado</Label>
                    <select
                      id="reserva-estado"
                      value={estadoForm.estado}
                      disabled={saving}
                      onChange={(event) =>
                        setEstadoForm((prev) => ({
                          ...prev,
                          estado: event.target.value,
                        }))
                      }
                      className="h-11 rounded-2xl border border-white/10 bg-[#0B0F0F] px-3 text-sm text-white outline-none focus:border-[#00D1C1]/70"
                    >
                      {ESTADOS_RESERVA.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reserva-observacion">Motivo / observación</Label>
                    <Textarea
                      id="reserva-observacion"
                      value={estadoForm.observacion_admin}
                      disabled={saving}
                      onChange={(event) =>
                        setEstadoForm((prev) => ({
                          ...prev,
                          observacion_admin: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap">
                  <Button
                    type="submit"
                    className="rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0]"
                    disabled={saving}
                  >
                    {saving ? "Guardando..." : "Confirmar"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => {
                      setActionMode(null);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleReagendar}>
                <h3 className="text-xl font-semibold text-white">
                  Reagendar reserva
                </h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="reagendar-fecha">Fecha</Label>
                    <Input
                      id="reagendar-fecha"
                      type="date"
                      value={reagendarForm.fecha}
                      disabled={saving}
                      onChange={(event) =>
                        setReagendarForm((prev) => ({
                          ...prev,
                          fecha: event.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reagendar-hora">Hora</Label>
                    <Input
                      id="reagendar-hora"
                      type="time"
                      value={reagendarForm.hora}
                      disabled={saving}
                      onChange={(event) =>
                        setReagendarForm((prev) => ({
                          ...prev,
                          hora: event.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="reagendar-motivo">Motivo</Label>
                    <Textarea
                      id="reagendar-motivo"
                      value={reagendarForm.observacion_admin}
                      disabled={saving}
                      onChange={(event) =>
                        setReagendarForm((prev) => ({
                          ...prev,
                          observacion_admin: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap">
                  <Button
                    type="submit"
                    className="rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0]"
                    disabled={saving}
                  >
                    {saving ? "Guardando..." : "Guardar reagendamiento"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => {
                      setActionMode(null);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
        ) : null}
      </AppModal>
    </section>
  );
};

export default AdminReservasSection;
