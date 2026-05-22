import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Eye, Pencil, RefreshCw, Search, UserCheck, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getClienteAdmin,
  listClientesAdmin,
  patchClienteAdmin,
  updateClienteAdmin,
  type ClienteAdmin,
  type Pagination,
} from "@/services/adminClientesApi";

type ClienteFormState = {
  nombre: string;
  email: string;
  telefono: string;
  notas_admin: string;
  activo: boolean;
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
  const [selectedCliente, setSelectedCliente] = useState<ClienteAdmin | null>(
    null
  );
  const [form, setForm] = useState<ClienteFormState | null>(null);

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

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCliente || !form) return;

    setSaving(true);
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
      await loadClientes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo actualizar el cliente"
      );
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

  const setFormField = <K extends keyof ClienteFormState>(
    field: K,
    value: ClienteFormState[K]
  ) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  return (
    <section className="premium-panel rounded-3xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="premium-section-title text-3xl font-semibold">
            Clientes
          </h2>
          <p className="mt-1 text-sm text-[#D6D6D6]">
            Busca, revisa y actualiza datos administrativos de clientes.
          </p>
        </div>
        <Button variant="outline" onClick={loadClientes} disabled={loading}>
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Actualizar
        </Button>
      </div>

      <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleSearchSubmit}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8E8E]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 rounded-2xl pl-10"
            placeholder="Buscar por nombre, email o teléfono"
          />
        </div>
        <Button
          type="submit"
          className="rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0]"
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

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#A8A8A8]">
        <span>
          Página {pagination.page} de {pagination.totalPages} · {pagination.total} registros
        </span>
        <div className="flex gap-2">
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

      {selectedCliente && form ? (
        <div className="mt-8 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="premium-card rounded-3xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-[#00D1C1]">
                  {selectedCliente.nombre}
                </h3>
                <p className="mt-1 text-sm text-[#D6D6D6]">
                  {getClienteEmail(selectedCliente) || "Sin correo"} ·{" "}
                  {selectedCliente.telefono ?? "Sin teléfono"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedCliente(null)}>
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
                          className="rounded-2xl border border-white/10 bg-[#0B0F0F]/70 px-3 py-2 text-sm text-[#D6D6D6]"
                        >
                          <span className="font-medium text-white">
                            {reserva.servicio_nombre ?? "Servicio"}
                          </span>{" "}
                          · {formatDate(reserva.fecha)} {reserva.hora ?? ""} ·{" "}
                          {reserva.estado ?? "pendiente"}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <form className="premium-card rounded-3xl p-5" onSubmit={handleSave}>
            <div className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-[#00D1C1]" />
              <h3 className="text-xl font-semibold text-white">Editar cliente</h3>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="cliente-nombre">Nombre</Label>
                <Input
                  id="cliente-nombre"
                  value={form.nombre}
                  onChange={(event) => setFormField("nombre", event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cliente-email">Email / correo</Label>
                <Input
                  id="cliente-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setFormField("email", event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cliente-telefono">Teléfono</Label>
                <Input
                  id="cliente-telefono"
                  value={form.telefono}
                  onChange={(event) => setFormField("telefono", event.target.value)}
                />
              </div>
              <label className="mt-7 inline-flex items-center gap-2 text-sm text-[#D6D6D6]">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(event) => setFormField("activo", event.target.checked)}
                />
                Cliente activo
              </label>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="cliente-notas">Notas admin</Label>
                <Textarea
                  id="cliente-notas"
                  value={form.notas_admin}
                  onChange={(event) =>
                    setFormField("notas_admin", event.target.value)
                  }
                  className="min-h-28"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="mt-5 rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0]"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        </div>
      ) : null}
    </section>
  );
};

export default AdminClientesSection;
