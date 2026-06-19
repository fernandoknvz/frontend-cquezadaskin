import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  fetchDashboardOverview,
  type DashboardOverview,
} from "@/services/dashboardApi";

export const AdminDashboardSection = () => {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resumen = data?.resumen ?? {};
  const citasHoy = data?.citas_hoy ?? [];
  const topServicios = data?.top_servicios_30d ?? [];

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchDashboardOverview();
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const estadoTotal = useMemo(
    () =>
      (data?.citas_por_estado_mes ?? []).reduce(
        (acc, item) => acc + Number(item.total ?? 0),
        0
      ),
    [data?.citas_por_estado_mes]
  );

  return (
    <section className="premium-panel rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="premium-section-title text-3xl font-semibold">Dashboard</h2>
          <p className="mt-1 text-sm text-[#6d554b]">
            Resumen de citas, clientes y servicios.
          </p>
        </div>
        <Button variant="outline" onClick={loadData}>
          Actualizar
        </Button>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-300">{error}</p>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="premium-card rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c69a86]">Citas del mes</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {resumen.total_citas_mes ?? 0}
          </p>
          <p className="text-xs text-[#a8968d]">Mes actual</p>
        </div>
        <div className="premium-card rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c69a86]">Clientes nuevos</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {resumen.total_clientes_8w ?? 0}
          </p>
          <p className="text-xs text-[#a8968d]">Últimas 8 semanas</p>
        </div>
        <div className="premium-card rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c69a86]">Estados</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {estadoTotal}
          </p>
          <p className="text-xs text-[#a8968d]">Citas del mes</p>
        </div>
        <div className="premium-card rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c69a86]">Top servicios</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {topServicios.length}
          </p>
          <p className="text-xs text-[#a8968d]">Últimos 30 días</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="premium-card rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-[#c69a86]">Citas de hoy</h3>
            <span className="text-xs text-[#a8968d]">
              {citasHoy.length} citas
            </span>
          </div>
          <div className="mt-3 space-y-2 text-sm text-[#6d554b]">
            {loading ? (
              <p>Cargando...</p>
            ) : citasHoy.length === 0 ? (
              <p>No hay citas para hoy.</p>
            ) : (
              citasHoy.map((cita) => (
                <div
                  key={cita.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-[#fffaf7]/70 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-white">
                      {cita.cliente}
                    </p>
                    <p className="text-xs text-[#6d554b]">{cita.servicio}</p>
                  </div>
                  <div className="text-right text-xs text-[#a8968d]">
                    <div>{cita.hora}</div>
                    <div>{cita.estado}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="premium-card rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-[#c69a86]">
              Servicios más agendados
            </h3>
          </div>
          <div className="mt-3 space-y-2 text-sm text-[#6d554b]">
            {loading ? (
              <p>Cargando...</p>
            ) : topServicios.length === 0 ? (
              <p>Sin datos en los últimos 30 días.</p>
            ) : (
              topServicios.map((item) => (
                <div
                  key={item.servicio_id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-[#fffaf7]/70 px-3 py-2"
                >
                  <span className="text-white">
                    {item.servicio_nombre}
                  </span>
                  <span className="text-xs text-[#a8968d]">
                    {item.total} citas
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
