import { apiFetch } from "@/services/apiClient";

export type DashboardOverview = {
  resumen?: {
    total_citas_mes?: number;
    total_clientes_8w?: number;
  };
  citas_por_estado_mes?: Array<{
    estado: string;
    total: number;
  }>;
  clientes_por_semana_8w?: Array<{
    semana: number | string;
    total: number;
  }>;
  citas_hoy?: Array<{
    id: number;
    hora: string;
    cliente: string;
    servicio: string;
    estado: string;
  }>;
  top_servicios_30d?: Array<{
    servicio_id: number;
    servicio_nombre: string;
    total: number;
  }>;
};

export const fetchDashboardOverview = () =>
  apiFetch<DashboardOverview>("/dashboard/overview");

export const fetchDashboardCitasHoy = () =>
  apiFetch<any[]>("/dashboard/citas-hoy");

export const fetchDashboardTopServicios = () =>
  apiFetch<any[]>("/dashboard/top-servicios");
