import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  CalendarRange,
  CircleHelp,
  ClipboardList,
  Images,
  Sparkles,
  Star,
  UserCog,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdminAccountSection } from "@/features/admin/components/AdminAccountSection";
import { AdminCalendarioSection } from "@/features/admin/components/AdminCalendarioSection";
import { AdminClientesSection } from "@/features/admin/components/AdminClientesSection";
import { AdminDashboardSection } from "@/features/admin/components/AdminDashboardSection";
import { AdminFAQSection } from "@/features/admin/components/AdminFAQSection";
import { AdminHomeContentSection } from "@/features/admin/components/AdminHomeContentSection";
import { AdminInstagramSection } from "@/features/admin/components/AdminInstagramSection";
import { AdminReservasSection } from "@/features/admin/components/AdminReservasSection";
import { AdminServicesSection } from "@/features/admin/components/AdminServicesSection";
import { AdminValoracionesSection } from "@/features/admin/components/AdminValoracionesSection";
import { useAuth } from "@/features/auth/AuthContext";

type AdminSection =
  | "dashboard"
  | "calendario"
  | "reservas"
  | "clientes"
  | "servicios"
  | "faq"
  | "valoraciones"
  | "contenido"
  | "cuenta";

const getSectionTitle = (section: AdminSection) => {
  const titles: Record<AdminSection, string> = {
    dashboard: "Dashboard de citas",
    calendario: "Calendario",
    reservas: "Gestion de reservas",
    clientes: "Gestion de clientes",
    servicios: "Gestion de servicios",
    faq: "Gestion de FAQ",
    valoraciones: "Gestion de valoraciones",
    contenido: "Gestion de contenido",
    cuenta: "Gestion de cuenta",
  };

  return titles[section];
};

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection | null>(null);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="mx-auto w-[92%] max-w-full overflow-x-hidden py-8 text-white sm:py-10 lg:w-[90%] lg:px-4 lg:py-12 2xl:w-[80%]">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h1 className="premium-heading text-4xl font-semibold sm:text-5xl">
            Panel administrador
          </h1>
          <p className="mt-2 text-sm text-[#D6D6D6]">
            Bienvenido{" "}
            <span className="font-semibold text-[#00D1C1]">
              {user?.username}
            </span>
            . Rol: {user?.rol}
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Button variant="outline" className="rounded-2xl" asChild>
            <Link to="/">Ver sitio</Link>
          </Button>
          <Button
            className="rounded-2xl bg-[#00D1C1] text-[#03110f] hover:bg-[#20E0D0]"
            onClick={handleLogout}
          >
            Cerrar sesion
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6">
        {!activeSection ? (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <AdminCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Dashboard"
              description="Resumen de citas y servicios."
              onClick={() => setActiveSection("dashboard")}
            />
            <AdminCard
              icon={<CalendarRange className="h-6 w-6" />}
              title="Calendario"
              description="Visualiza reservas, disponibilidad y bloqueos."
              onClick={() => setActiveSection("calendario")}
            />
            <AdminCard
              icon={<ClipboardList className="h-6 w-6" />}
              title="Reservas"
              description="Gestiona solicitudes, estados y reagendamientos."
              onClick={() => setActiveSection("reservas")}
            />
            <AdminCard
              icon={<Users className="h-6 w-6" />}
              title="Clientes"
              description="Revisa datos, historial y notas administrativas."
              onClick={() => setActiveSection("clientes")}
            />
            <AdminCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Servicios"
              description="Administra servicios, precios e imagenes."
              onClick={() => setActiveSection("servicios")}
            />
            <AdminCard
              icon={<CircleHelp className="h-6 w-6" />}
              title="FAQ"
              description="Gestiona preguntas frecuentes publicas."
              onClick={() => setActiveSection("faq")}
            />
            <AdminCard
              icon={<Star className="h-6 w-6" />}
              title="Valoraciones"
              description="Modera testimonios y respuestas."
              onClick={() => setActiveSection("valoraciones")}
            />
            <AdminCard
              icon={<Images className="h-6 w-6" />}
              title="Contenido"
              description="Edita home, carousel e Instagram embeds."
              onClick={() => setActiveSection("contenido")}
            />
            <AdminCard
              icon={<UserCog className="h-6 w-6" />}
              title="Cuenta"
              description="Cambia correo y contrasena."
              onClick={() => setActiveSection("cuenta")}
            />
          </div>
        ) : (
          <div className="grid min-w-0 gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <h2 className="premium-section-title text-2xl font-semibold sm:text-3xl">
                {getSectionTitle(activeSection)}
              </h2>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setActiveSection(null)}
              >
                Volver al panel
              </Button>
            </div>

            {activeSection === "servicios" ? (
              <AdminServicesSection />
            ) : activeSection === "faq" ? (
              <AdminFAQSection />
            ) : activeSection === "valoraciones" ? (
              <AdminValoracionesSection />
            ) : activeSection === "calendario" ? (
              <AdminCalendarioSection />
            ) : activeSection === "contenido" ? (
              <div className="grid gap-6">
                <AdminHomeContentSection />
                <AdminInstagramSection />
              </div>
            ) : activeSection === "reservas" ? (
              <AdminReservasSection />
            ) : activeSection === "clientes" ? (
              <AdminClientesSection />
            ) : activeSection === "cuenta" ? (
              <AdminAccountSection />
            ) : (
              <AdminDashboardSection />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="premium-card premium-card-hover premium-focus min-h-28 min-w-0 rounded-2xl p-4 text-left hover:-translate-y-1 sm:rounded-3xl sm:p-6"
    >
      <div className="flex items-center gap-3">
        <span className="rounded-2xl border border-[#00D1C1]/25 bg-[#00D1C1]/10 p-3 text-[#00D1C1]">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="premium-section-title text-xl font-semibold sm:text-2xl">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[#D6D6D6]">{description}</p>
        </div>
      </div>
    </button>
  );
}
