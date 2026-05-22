import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Clock,
  Images,
  Instagram,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdminAccountSection } from "@/features/admin/components/AdminAccountSection";
import { AdminCitasSection } from "@/features/admin/components/AdminCitasSection";
import { AdminClientesSection } from "@/features/admin/components/AdminClientesSection";
import { AdminDashboardSection } from "@/features/admin/components/AdminDashboardSection";
import { AdminDisponibilidadSection } from "@/features/admin/components/AdminDisponibilidadSection";
import { AdminHomeContentSection } from "@/features/admin/components/AdminHomeContentSection";
import { AdminInstagramSection } from "@/features/admin/components/AdminInstagramSection";
import { AdminReservasSection } from "@/features/admin/components/AdminReservasSection";
import { AdminServicesSection } from "@/features/admin/components/AdminServicesSection";
import { useAuth } from "@/features/auth/AuthContext";

type AdminSection =
  | "dashboard"
  | "reservas"
  | "clientes"
  | "citas"
  | "disponibilidad"
  | "servicios"
  | "instagram"
  | "home"
  | "cuenta";

const getSectionTitle = (section: AdminSection) => {
  const titles: Record<AdminSection, string> = {
    dashboard: "Dashboard de citas",
    reservas: "Gestión de reservas",
    clientes: "Gestión de clientes",
    citas: "Gestión de citas",
    disponibilidad: "Gestión de disponibilidad",
    servicios: "Gestión de servicios",
    instagram: "Gestión de Instagram",
    home: "Gestión del home",
    cuenta: "Gestión de cuenta",
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
    <div className="mx-auto w-[90%] px-4 py-12 text-white 2xl:w-[80%]">
      <div className="flex flex-wrap items-center justify-between gap-4">
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
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl" asChild>
            <Link to="/">Ver sitio</Link>
          </Button>
          <Button
            className="rounded-2xl bg-[#00D1C1] text-[#03110f] hover:bg-[#20E0D0]"
            onClick={handleLogout}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6">
        {!activeSection ? (
          <div className="grid gap-4 md:grid-cols-2">
            <AdminCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Dashboard"
              description="Resumen de citas y servicios."
              onClick={() => setActiveSection("dashboard")}
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
              icon={<CalendarDays className="h-6 w-6" />}
              title="Citas agendadas"
              description="Gestión anterior de citas por bloques."
              onClick={() => setActiveSection("citas")}
            />
            <AdminCard
              icon={<Clock className="h-6 w-6" />}
              title="Disponibilidad"
              description="Gestiona días y horas disponibles."
              onClick={() => setActiveSection("disponibilidad")}
            />
            <AdminCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Servicios"
              description="Administra servicios, precios e imágenes."
              onClick={() => setActiveSection("servicios")}
            />
            <AdminCard
              icon={<Instagram className="h-6 w-6" />}
              title="Instagram embeds"
              description="Agrega o edita iframes de Instagram."
              onClick={() => setActiveSection("instagram")}
            />
            <AdminCard
              icon={<Images className="h-6 w-6" />}
              title="Home / Carousel"
              description="Edita textos e imágenes del home."
              onClick={() => setActiveSection("home")}
            />
            <AdminCard
              icon={<UserCog className="h-6 w-6" />}
              title="Cuenta"
              description="Cambia correo y contraseña."
              onClick={() => setActiveSection("cuenta")}
            />
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="premium-section-title text-3xl font-semibold">
                {getSectionTitle(activeSection)}
              </h2>
              <Button variant="outline" onClick={() => setActiveSection(null)}>
                Volver al panel
              </Button>
            </div>

            {activeSection === "servicios" ? (
              <AdminServicesSection />
            ) : activeSection === "home" ? (
              <AdminHomeContentSection />
            ) : activeSection === "instagram" ? (
              <AdminInstagramSection />
            ) : activeSection === "disponibilidad" ? (
              <AdminDisponibilidadSection />
            ) : activeSection === "reservas" ? (
              <AdminReservasSection />
            ) : activeSection === "clientes" ? (
              <AdminClientesSection />
            ) : activeSection === "citas" ? (
              <AdminCitasSection />
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
      className="premium-card premium-card-hover premium-focus rounded-3xl p-6 text-left hover:-translate-y-1"
    >
      <div className="flex items-center gap-3">
        <span className="rounded-2xl border border-[#00D1C1]/25 bg-[#00D1C1]/10 p-3 text-[#00D1C1]">
          {icon}
        </span>
        <div>
          <h2 className="premium-section-title text-2xl font-semibold">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[#D6D6D6]">{description}</p>
        </div>
      </div>
    </button>
  );
}
