import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Eye,
  Pencil,
  RefreshCw,
  RotateCw,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";

import { AppModal } from "@/components/ui/AppModal";
import { Button } from "@/components/ui/button";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getClienteAdmin,
  listClientesAdmin,
  patchClienteAdmin,
  updateClienteAdmin,
  type ClienteAdmin,
  type ClienteReservaResumen,
  type Pagination,
} from "@/services/adminClientesApi";
import { reagendarReservaAdmin } from "@/services/adminReservasApi";

type ClienteFormState = {
  nombre: string;
  email: string;
  telefono: string;
  notas_admin: string;
  activo: boolean;
};
type ModalFeedback = {
  tone: "success" | "error" | "info";
  message: string;
} | null;

type ReagendarFormState = {
  fecha: string;
  hora: string;
  motivo: string;
};

type ReagendarModalState = {
  reserva: ClienteReservaResumen;
  form: ReagendarFormState;
  feedback: ModalFeedback;
  saving: boolean;
};

const emptyPagination: Pagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

const getClienteEmail = (cliente: ClienteAdmin) =>
  cliente.email ?? cliente.correo ?? "";

const isClienteActivo = (cliente: ClienteAdmin) => {
  if (typeof cliente.activo === "boolean") return cliente.activo;
  if (typeof cliente.activo === "number") return cliente.activo === 1;
  if (typeof cliente.activo === "string") {
    return cliente.activo === "1" || cliente.activo.toLowerCase() === "true";
  }
  return true;
};

const formatDate = (value?: string | null) => {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeDateInput = (value?: string | null) => {
  if (!value) return "";
  return value.includes("T") ? value.slice(0, 10) : value;
};

const normalizeTimeInput = (value?: string | null) => {
  if (!value) return "";
  return value.slice(0, 5);
};

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const mapToForm = (cliente: ClienteAdmin): ClienteFormState => ({
  nombre: cliente.nombre ?? "",
  email: getClienteEmail(cliente),
  telefono: cliente.telefono ?? "",
  notas_admin: cliente.notas_admin ?? "",
  activo: isClienteActivo(cliente),
});

export const AdminClientesSection = () => {
  const [clientes, setClientes] = useState<ClienteAdmin[]>([]);
  const [pagination, setPagination] = useState<Pagination>(emptyPagination);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [modalFeedback, setModalFeedback] = useState<ModalFeedback>(null);
  const [selectedCliente, setSelectedCliente] = useState<ClienteAdmin | null>(
    null
  );
  const [form, setForm] = useState<ClienteFormState | null>(null);
  const [reagendarModal, setReagendarModal] =
    useState<ReagendarModalState | null>(null);

  const loadClientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listClientesAdmin({
        search: search.trim(),
        page,
        limit: pagination.limit,
        sort: "created_at",
        direction: "desc",
      });
      setClientes(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setClientes([]);
      setError(
        err instanceof Error ? err.message : "No se pudo cargar la información"
      );
    } finally {
      setLoading(false);
    }
  }, [page, pagination.limit, search]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  const selectedStats = useMemo(
    () => [
      {
        label: "Total reservas",
        value: selectedCliente?.total_reservas ?? 0,
      },
      {
        label: "Confirmadas",
        value: selectedCliente?.reservas_confirmadas ?? 0,
      },
      {
        label: "Canceladas",
        value: selectedCliente?.reservas_canceladas ?? 0,
      },
    ],
    [selectedCliente]
  );

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    loadClientes();
  };

  const handleSelectCliente = async (cliente: ClienteAdmin) => {
    setSelectedCliente(cliente);
    setForm(mapToForm(cliente));
    setDetailLoading(true);
    setModalFeedback(null);
    setError(null);
    setMessage(null);
    try {
      const detail = await getClienteAdmin(cliente.id);
      setSelectedCliente(detail);
      setForm(mapToForm(detail));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar la información"
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshSelectedCliente = useCallback(
    async (clienteId: ClienteAdmin["id"]) => {
      const detail = await getClienteAdmin(clienteId);
      setSelectedCliente(detail);
      setForm(mapToForm(detail));
      await loadClientes();
      return detail;
    },
    [loadClientes]
  );

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCliente || !form) return;

    setSaving(true);
    setModalFeedback(null);
    setError(null);
    setMessage(null);
    try {
      await updateClienteAdmin(selectedCliente.id, {
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        correo: form.email.trim(),
        telefono: form.telefono.trim(),
        notas_admin: form.notas_admin.trim(),
        activo: form.activo,
      });
      const updated = await getClienteAdmin(selectedCliente.id);
      setSelectedCliente(updated);
      setForm(mapToForm(updated));
      setMessage("Cliente actualizado correctamente");
      setModalFeedback({
        tone: "success",
        message: "Cambios guardados correctamente.",
      });
      await wait(900);
      setSelectedCliente(null);
      setForm(null);
      setModalFeedback(null);
      await loadClientes();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "No se pudo actualizar el cliente";
      setModalFeedback({ tone: "error", message: errorMessage });
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (cliente: ClienteAdmin) => {
    const nextActivo = !isClienteActivo(cliente);
    setError(null);
    setMessage(null);
    try {
      await patchClienteAdmin(cliente.id, { activo: nextActivo });
      setMessage("Cliente actualizado correctamente");
      await loadClientes();
      if (selectedCliente?.id === cliente.id) {
        const detail = await getClienteAdmin(cliente.id);
        setSelectedCliente(detail);
        setForm(mapToForm(detail));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo actualizar el cliente"
      );
    }
  };

  const openReagendarReserva = (reserva: ClienteReservaResumen) => {
    setReagendarModal({
      reserva,
      form: {
        fecha: normalizeDateInput(reserva.fecha),
        hora: normalizeTimeInput(reserva.hora),
        motivo: "",
      },
      feedback: null,
      saving: false,
    });
  };

  const setReagendarField = <K extends keyof ReagendarFormState>(
    field: K,
    value: ReagendarFormState[K]
  ) => {
    setReagendarModal((prev) =>
      prev
        ? {
            ...prev,
            form: {
              ...prev.form,
              [field]: value,
            },
          }
        : prev
    );
  };

  const handleReagendarReserva = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCliente || !reagendarModal) return;

    const { reserva, form: reagendarForm } = reagendarModal;

    setReagendarModal((prev) =>
      prev ? { ...prev, feedback: null, saving: true } : prev
    );
    setError(null);
    setMessage(null);

    try {
      const motivo = reagendarForm.motivo.trim();
      await reagendarReservaAdmin(reserva.id, {
        fecha: reagendarForm.fecha,
        hora: reagendarForm.hora,
        motivo,
        observacion_admin: motivo,
      });
      setReagendarModal((prev) =>
        prev
          ? {
              ...prev,
              feedback: {
                tone: "success",
                message: "Reagendamiento guardado correctamente.",
              },
              saving: false,
            }
          : prev
      );
      await wait(900);
      setReagendarModal(null);
      await refreshSelectedCliente(selectedCliente.id);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "No se pudo reagendar la reserva";
      setReagendarModal((prev) =>
        prev
          ? {
              ...prev,
              feedback: { tone: "error", message: errorMessage },
              saving: false,
            }
          : prev
      );
    }
  };

  const setFormField = <K extends keyof ClienteFormState>(
    field: K,
    value: ClienteFormState[K]
  ) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  return (
    <section className="premium-panel max-w-full overflow-hidden rounded-2xl p-4 sm:rounded-3xl sm:p-6">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="premium-section-title text-2xl font-semibold sm:text-3xl">
            Clientes
          </h2>
          <p className="mt-1 text-sm text-[#D6D6D6]">
            Busca, revisa y actualiza datos administrativos de clientes.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={loadClientes}
          disabled={loading}
        >
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Actualizar
        </Button>
      </div>

      <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleSearchSubmit}>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8E8E]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 w-full rounded-2xl pl-10"
            placeholder="Buscar por nombre, email o teléfono"
          />
        </div>
        <Button
          type="submit"
          className="w-full rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0] sm:w-auto"
        >
          Buscar
        </Button>
      </form>

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

      <div className="mt-6 grid gap-3 md:hidden">
        {loading ? (
          <p className="rounded-2xl border border-white/10 bg-[#0B0F0F] p-4 text-sm text-[#A8A8A8]">
            Cargando...
          </p>
        ) : clientes.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#0B0F0F] p-4 text-sm text-[#A8A8A8]">
            No hay clientes registrados
          </p>
        ) : (
          clientes.map((cliente) => (
            <article
              key={cliente.id}
              className="min-w-0 rounded-2xl border border-white/10 bg-[#111414]/70 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-base font-semibold text-white">
                    {cliente.nombre || "Cliente sin nombre"}
                  </h3>
                  <p className="mt-1 break-words text-xs text-[#8E8E8E]">
                    {cliente.rut ?? "Sin RUT"}
                  </p>
                </div>
                <span
                  className={[
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                    isClienteActivo(cliente)
                      ? "border-[#00D1C1]/30 bg-[#00D1C1]/10 text-[#20E0D0]"
                      : "border-red-400/30 bg-red-500/10 text-red-200",
                  ].join(" ")}
                >
                  {isClienteActivo(cliente) ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="mt-3 grid gap-1 text-sm text-[#D6D6D6]">
                <p className="break-words">
                  {getClienteEmail(cliente) || "Sin correo"}
                </p>
                <p className="break-words text-[#A8A8A8]">
                  {cliente.telefono ?? "Sin telefono"}
                </p>
                <p className="break-words text-xs text-[#8E8E8E]">
                  {cliente.notas_admin || "Sin notas"}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleSelectCliente(cliente)}
                >
                  <Eye className="h-4 w-4" />
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleToggleActivo(cliente)}
                >
                  {isClienteActivo(cliente) ? (
                    <UserX className="h-4 w-4" />
                  ) : (
                    <UserCheck className="h-4 w-4" />
                  )}
                  {isClienteActivo(cliente) ? "Desactivar" : "Activar"}
                </Button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="mt-6 hidden overflow-hidden rounded-2xl border border-white/10 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#0B0F0F] text-xs uppercase tracking-[0.14em] text-[#8E8E8E]">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Notas</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-[#A8A8A8]" colSpan={5}>
                    Cargando...
                  </td>
                </tr>
              ) : clientes.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-[#A8A8A8]" colSpan={5}>
                    No hay clientes registrados
                  </td>
                </tr>
              ) : (
                clientes.map((cliente) => (
                  <tr key={cliente.id} className="bg-[#111414]/50">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-white">{cliente.nombre}</p>
                      <p className="text-xs text-[#8E8E8E]">{cliente.rut ?? "Sin RUT"}</p>
                    </td>
                    <td className="px-4 py-4 text-[#D6D6D6]">
                      <p>{getClienteEmail(cliente) || "Sin correo"}</p>
                      <p className="text-xs text-[#8E8E8E]">{cliente.telefono ?? "Sin teléfono"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={[
                          "rounded-full border px-3 py-1 text-xs font-semibold",
                          isClienteActivo(cliente)
                            ? "border-[#00D1C1]/30 bg-[#00D1C1]/10 text-[#20E0D0]"
                            : "border-red-400/30 bg-red-500/10 text-red-200",
                        ].join(" ")}
                      >
                        {isClienteActivo(cliente) ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-4 text-[#A8A8A8]">
                      {cliente.notas_admin || "Sin notas"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectCliente(cliente)}
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActivo(cliente)}
                        >
                          {isClienteActivo(cliente) ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
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
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages || loading}
            onClick={() =>
              setPage((current) => Math.min(pagination.totalPages, current + 1))
            }
          >
            Siguiente
          </Button>
        </div>
      </div>

      <AppModal
        open={Boolean(selectedCliente && form)}
        title="Detalle de cliente"
        description="Revisa el historial y actualiza los datos administrativos."
        onOpenChange={(open) => {
          if (!open && !saving) {
            setSelectedCliente(null);
            setForm(null);
            setModalFeedback(null);
          }
        }}
        className="w-[min(94vw,980px)]"
      >
        {selectedCliente && form ? (
        <div className="grid min-w-0 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="premium-card min-w-0 rounded-2xl p-4 sm:rounded-3xl sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-xl font-semibold text-[#00D1C1]">
                  {selectedCliente.nombre}
                </h3>
                <p className="mt-1 break-words text-sm text-[#D6D6D6]">
                  {getClienteEmail(selectedCliente) || "Sin correo"} ·{" "}
                  {selectedCliente.telefono ?? "Sin teléfono"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setSelectedCliente(null)}
              >
                Cerrar
              </Button>
            </div>

            {detailLoading ? (
              <p className="mt-4 text-sm text-[#A8A8A8]">Cargando detalle...</p>
            ) : (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {selectedStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/10 bg-[#0B0F0F]/70 p-3">
                      <p className="text-xs text-[#8E8E8E]">{stat.label}</p>
                      <p className="mt-1 text-2xl font-semibold text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-2 text-sm text-[#D6D6D6]">
                  <p>Última reserva: {formatDate(selectedCliente.ultima_reserva)}</p>
                  <p>Próxima reserva: {formatDate(selectedCliente.proxima_reserva)}</p>
                </div>

                <div className="mt-5">
                  <h4 className="text-sm font-semibold text-white">
                    Reservas recientes
                  </h4>
                  <div className="mt-2 grid gap-2">
                    {(selectedCliente.reservas_recientes ?? []).length === 0 ? (
                      <p className="text-sm text-[#8E8E8E]">
                        No se encontraron resultados
                      </p>
                    ) : (
                      selectedCliente.reservas_recientes?.map((reserva) => (
                        <div
                          key={reserva.id}
                          className="flex min-w-0 flex-col gap-3 rounded-2xl border border-white/10 bg-[#0B0F0F]/70 px-3 py-2 text-sm text-[#D6D6D6] sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <span className="break-words font-medium text-white">
                              {reserva.servicio_nombre ?? "Servicio"}
                            </span>{" "}
                          · {formatDate(reserva.fecha)} {reserva.hora ?? ""} ·{" "}
                            {reserva.estado ?? "pendiente"}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full shrink-0 sm:w-auto"
                            onClick={() => openReagendarReserva(reserva)}
                          >
                            <RotateCw className="h-4 w-4" />
                            Reagendar
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <form className="premium-card min-w-0 rounded-2xl p-4 sm:rounded-3xl sm:p-5" onSubmit={handleSave}>
            <div className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-[#00D1C1]" />
              <h3 className="text-xl font-semibold text-white">Editar cliente</h3>
            </div>

            {modalFeedback ? (
              <InlineFeedback
                tone={modalFeedback.tone}
                message={modalFeedback.message}
                className="mt-4"
              />
            ) : null}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="cliente-nombre">Nombre</Label>
                <Input
                  id="cliente-nombre"
                  value={form.nombre}
                  disabled={saving}
                  onChange={(event) => setFormField("nombre", event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cliente-email">Email / correo</Label>
                <Input
                  id="cliente-email"
                  type="email"
                  value={form.email}
                  disabled={saving}
                  onChange={(event) => setFormField("email", event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cliente-telefono">Teléfono</Label>
                <Input
                  id="cliente-telefono"
                  value={form.telefono}
                  disabled={saving}
                  onChange={(event) => setFormField("telefono", event.target.value)}
                />
              </div>
              <label className="mt-7 inline-flex items-center gap-2 text-sm text-[#D6D6D6]">
                <input
                  type="checkbox"
                  checked={form.activo}
                  disabled={saving}
                  onChange={(event) => setFormField("activo", event.target.checked)}
                />
                Cliente activo
              </label>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="cliente-notas">Notas admin</Label>
                <Textarea
                  id="cliente-notas"
                  value={form.notas_admin}
                  disabled={saving}
                  onChange={(event) =>
                    setFormField("notas_admin", event.target.value)
                  }
                  className="min-h-28"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="mt-5 w-full rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0] sm:w-auto"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        </div>
        ) : null}
      </AppModal>

      <AppModal
        open={Boolean(reagendarModal)}
        title="Reagendar reserva"
        description="Actualiza la fecha y hora sin salir de la ficha del cliente."
        onOpenChange={(open) => {
          if (!open && !reagendarModal?.saving) {
            setReagendarModal(null);
          }
        }}
        className="w-[min(94vw,560px)]"
      >
        {reagendarModal ? (
          <form className="grid gap-4" onSubmit={handleReagendarReserva}>
            <div className="rounded-2xl border border-[#00D1C1]/20 bg-[#061817]/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#20E0D0]">
                Reserva actual
              </p>
              <p className="mt-2 break-words text-base font-semibold text-white">
                {reagendarModal.reserva.servicio_nombre ?? "Servicio"}
              </p>
              <p className="mt-1 text-sm text-[#D6D6D6]">
                {formatDate(reagendarModal.reserva.fecha)}{" "}
                {reagendarModal.reserva.hora ?? ""}
              </p>
            </div>

            {reagendarModal.feedback ? (
              <InlineFeedback
                tone={reagendarModal.feedback.tone}
                message={reagendarModal.feedback.message}
              />
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="cliente-reagendar-fecha">Nueva fecha</Label>
                <Input
                  id="cliente-reagendar-fecha"
                  type="date"
                  value={reagendarModal.form.fecha}
                  disabled={reagendarModal.saving}
                  required
                  onChange={(event) =>
                    setReagendarField("fecha", event.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cliente-reagendar-hora">Nueva hora</Label>
                <Input
                  id="cliente-reagendar-hora"
                  type="time"
                  value={reagendarModal.form.hora}
                  disabled={reagendarModal.saving}
                  required
                  onChange={(event) =>
                    setReagendarField("hora", event.target.value)
                  }
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="cliente-reagendar-motivo">Motivo opcional</Label>
                <Textarea
                  id="cliente-reagendar-motivo"
                  value={reagendarModal.form.motivo}
                  disabled={reagendarModal.saving}
                  className="min-h-24"
                  placeholder="Ej: solicitud del cliente"
                  onChange={(event) =>
                    setReagendarField("motivo", event.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid gap-2 sm:flex sm:flex-row-reverse sm:justify-start">
              <Button
                type="submit"
                className="w-full rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0] sm:w-auto"
                disabled={reagendarModal.saving}
              >
                {reagendarModal.saving
                  ? "Guardando..."
                  : "Guardar reagendamiento"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={reagendarModal.saving}
                onClick={() => setReagendarModal(null)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : null}
      </AppModal>
    </section>
  );
};

export default AdminClientesSection;
