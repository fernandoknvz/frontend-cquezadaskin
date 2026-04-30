import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  deleteCitaAdmin,
  listCitasAdmin,
  updateCitaAdmin,
  type AdminCita,
} from "@/services/adminCitasApi";

const STATUS_OPTIONS = ["pendiente", "confirmada", "cancelada"] as const;

// Extendemos el tipo para incluir los campos que sÃ­ vienen del backend
interface AdminCitaExtended extends AdminCita {
  cliente_id: number;
  servicio_id: number;
}

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CL");
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const toMinutes = (hhmmss?: string | null): number | null => {
  if (!hhmmss) return null;
  const parts = hhmmss.split(":").map(Number);
  const h = parts[0];
  const m = parts[1] ?? 0;
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const toHHMM = (minutes: number) =>
  `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`;

type CitaGroup = {
  key: string;
  cliente_id: number;
  servicio_id: number;
  fecha: string;
  estado: string;

  cliente: string;
  correo: string;
  telefono: string;
  servicio: string;

  startMin: number | null;
  endMin: number | null;
  duracionMin: number;

  ids: number[];
};

function groupCitas(citas: AdminCitaExtended[]): CitaGroup[] {
  const sorted = [...citas].sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? 1 : -1;
    if (a.cliente_id !== b.cliente_id) return a.cliente_id - b.cliente_id;
    if (a.servicio_id !== b.servicio_id) return a.servicio_id - b.servicio_id;

    const ha = toMinutes(a.hora) ?? 0;
    const hb = toMinutes(b.hora) ?? 0;
    return ha - hb;
  });

  const groups: CitaGroup[] = [];
  const STEP = 30;

  for (const cita of sorted) {
    const baseKey = `${cita.cliente_id}|${cita.servicio_id}|${cita.fecha}|${cita.estado}`;
    const hMin = toMinutes(cita.hora);

    const last = groups[groups.length - 1];

    const canAppend =
      last &&
      last.cliente_id === cita.cliente_id &&
      last.servicio_id === cita.servicio_id &&
      last.fecha === cita.fecha &&
      last.estado === cita.estado &&
      last.endMin != null &&
      hMin != null &&
      hMin === last.endMin;

    if (!last || !canAppend) {
      const startMin = hMin;
      const endMin = hMin != null ? hMin + STEP : null;

      groups.push({
        key: `${baseKey}|${groups.length}`,
        cliente_id: cita.cliente_id,
        servicio_id: cita.servicio_id,
        fecha: cita.fecha,
        estado: cita.estado,

        cliente: cita.cliente,
        correo: cita.correo,
        telefono: cita.telefono,
        servicio: cita.servicio,

        startMin,
        endMin,
        duracionMin: hMin != null ? STEP : 0,
        ids: [cita.id],
      });
    } else {
      last.ids.push(cita.id);
      last.duracionMin += STEP;
      last.endMin = (last.endMin ?? (hMin ?? 0)) + STEP;
    }
  }

  return groups;
}

export const AdminCitasSection = () => {
  const [citas, setCitas] = useState<AdminCitaExtended[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCitas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await listCitasAdmin()) as AdminCitaExtended[];
      setCitas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar citas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCitas();
  }, []);

  const grouped = useMemo(() => groupCitas(citas), [citas]);

  const handleStatusChange = async (group: CitaGroup, estado: string) => {
    setError(null);
    setMessage(null);

    try {
      await Promise.all(group.ids.map((id) => updateCitaAdmin(id, { estado })));

      setCitas((prev) =>
        prev.map((c) =>
          group.ids.includes(c.id) ? { ...c, estado } : c
        )
      );

      setMessage("Estado actualizado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar cita");
    }
  };

  const handleDelete = async (group: CitaGroup) => {
    const confirmed = window.confirm(
      group.ids.length > 1
        ? `Eliminar esta reserva completa? (${group.ids.length} bloques)`
        : "Eliminar esta cita?"
    );
    if (!confirmed) return;

    setError(null);
    setMessage(null);

    try {
      await Promise.all(group.ids.map((id) => deleteCitaAdmin(id)));

      setCitas((prev) => prev.filter((c) => !group.ids.includes(c.id)));

      setMessage("Cita eliminada");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar cita");
    }
  };

  return (
    <section className="premium-panel rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="premium-section-title text-3xl font-semibold">
            Citas agendadas
          </h2>
          <p className="mt-1 text-sm text-[#D6D6D6]">
            Actualiza estados o elimina citas.
          </p>
        </div>
        <Button variant="outline" onClick={loadCitas}>
          Actualizar lista
        </Button>
      </div>

      {message && (
        <div className="mt-4 rounded-2xl border border-[#00D1C1]/25 bg-[#00D1C1]/10 p-3 text-sm text-[#00D1C1]">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-3">
        {loading ? (
          <p className="text-sm text-[#A8A8A8]">Cargando citas...</p>
        ) : grouped.length === 0 ? (
          <p className="text-sm text-[#A8A8A8]">
            No hay citas registradas.
          </p>
        ) : (
          grouped.map((g) => {
            const hasTime =
              g.startMin != null && g.endMin != null;

            const timeLabel = hasTime
              ? g.duracionMin > 30
                ? `${toHHMM(g.startMin!)} - ${toHHMM(g.endMin!)} • ${g.duracionMin} min`
                : `${toHHMM(g.startMin!)}`
              : "";

            return (
              <div
                key={g.key}
                className="premium-card premium-card-hover flex flex-col gap-3 rounded-3xl p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h4 className="text-base font-semibold text-[#00D1C1]">
                    {g.cliente}
                  </h4>
                  <p className="text-sm text-[#D6D6D6]">
                    {g.servicio} • {formatDate(g.fecha)}{" "}
                    {timeLabel ? `• ${timeLabel}` : ""}
                  </p>
                  <p className="text-xs text-[#A8A8A8]">
                    {g.correo} • {g.telefono}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={g.estado}
                    onChange={(event) =>
                      handleStatusChange(g, event.target.value)
                    }
                    className="h-10 rounded-2xl border border-[#00D1C1]/35 bg-[#0B0F0F] px-3 text-sm font-medium text-white outline-none focus:border-[#20E0D0] focus:ring-2 focus:ring-[#00D1C1]/25"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <Button
                    variant="outline"
                    className="border-red-400/30 text-red-300 hover:bg-red-500/10 hover:text-red-300"
                    onClick={() => handleDelete(g)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default AdminCitasSection;
