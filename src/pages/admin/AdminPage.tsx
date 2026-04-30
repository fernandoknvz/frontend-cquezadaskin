import { useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, CalendarDays, Clock, Images, Instagram, Sparkles, UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdminDashboardSection } from "@/features/admin/components/AdminDashboardSection";
import { AdminInstagramSection } from "@/features/admin/components/AdminInstagramSection";
import { AdminHomeContentSection } from "@/features/admin/components/AdminHomeContentSection";
import { AdminServicesSection } from "@/features/admin/components/AdminServicesSection";
import { AdminCitasSection } from "@/features/admin/components/AdminCitasSection";
import { AdminDisponibilidadSection } from "@/features/admin/components/AdminDisponibilidadSection";
import { AdminAccountSection } from "@/features/admin/components/AdminAccountSection";
import { useAuth } from "@/features/auth/AuthContext";

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<
    "dashboard" | "citas" | "disponibilidad" | "servicios" | "instagram" | "home" | "cuenta" |  null
  >(null);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="mx-auto w-[90%] 2xl:w-[80%] px-4 py-12 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="premium-heading text-4xl font-semibold sm:text-5xl">
            Panel Administrativo
          </h1>
          <p className="mt-2 text-sm text-[#D6D6D6]">
            Bienvenido <span className="font-semibold text-[#00D1C1]">{user?.username}</span>. Rol: {user?.rol}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-2xl"
            asChild
          >
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
            <button
              type="button"
              onClick={() => setActiveSection("dashboard")}
              className="premium-card premium-card-hover premium-focus rounded-3xl p-6 text-left hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-2xl border border-[#00D1C1]/25 bg-[#00D1C1]/10 p-3 text-[#00D1C1]">
                  <BarChart3 className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="premium-section-title text-2xl font-semibold">
                    Dashboard
                  </h2>
                  <p className="mt-1 text-sm text-[#D6D6D6]">
                    Resumen de citas y servicios.
                  </p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("citas")}
              className="premium-card premium-card-hover premium-focus rounded-3xl p-6 text-left hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-2xl border border-[#00D1C1]/25 bg-[#00D1C1]/10 p-3 text-[#00D1C1]">
                  <CalendarDays className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="premium-section-title text-2xl font-semibold">
                    Citas agendadas
                  </h2>
                  <p className="mt-1 text-sm text-[#D6D6D6]">
                    Administra visitas y estados.
                  </p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("disponibilidad")}
              className="premium-card premium-card-hover premium-focus rounded-3xl p-6 text-left hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-2xl border border-[#00D1C1]/25 bg-[#00D1C1]/10 p-3 text-[#00D1C1]">
                  <Clock className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="premium-section-title text-2xl font-semibold">
                    Disponibilidad
                  </h2>
                  <p className="mt-1 text-sm text-[#D6D6D6]">
                    Gestiona días y horas disponibles.
                  </p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("servicios")}
              className="premium-card premium-card-hover premium-focus rounded-3xl p-6 text-left hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-[#00D1C1]/15 p-3 text-[#20E0D0]">
                  <Sparkles className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="premium-section-title text-2xl font-semibold">
                    Servicios
                  </h2>
                  <p className="mt-1 text-sm text-[#D6D6D6]">
                    Administra servicios, precios e imágenes.
                  </p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("instagram")}
              className="premium-card premium-card-hover premium-focus rounded-3xl p-6 text-left hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-2xl border border-[#00D1C1]/25 bg-[#00D1C1]/10 p-3 text-[#00D1C1]">
                  <Instagram className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="premium-section-title text-2xl font-semibold">
                    Instagram embeds
                  </h2>
                  <p className="mt-1 text-sm text-[#D6D6D6]">
                    Agrega o edita iframes de Instagram.
                  </p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("home")}
              className="premium-card premium-card-hover premium-focus rounded-3xl p-6 text-left hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-2xl border border-[#00D1C1]/25 bg-[#00D1C1]/10 p-3 text-[#00D1C1]">
                  <Images className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="premium-section-title text-2xl font-semibold">
                    Home / Carousel
                  </h2>
                  <p className="mt-1 text-sm text-[#D6D6D6]">
                    Edita textos e imágenes del home.
                  </p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("cuenta")}
              className="premium-card premium-card-hover premium-focus rounded-3xl p-6 text-left hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-2xl border border-[#00D1C1]/25 bg-[#00D1C1]/10 p-3 text-[#00D1C1]">
                  <UserCog className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="premium-section-title text-2xl font-semibold">Cuenta</h2>
                  <p className="mt-1 text-sm text-[#D6D6D6]">
                    Cambia correo y contraseña.
                  </p>
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="premium-section-title text-3xl font-semibold">
                {activeSection === "servicios"
                  ? "Gestion de servicios"
                  : activeSection === "home"
                    ? "Gestion del home"
                    : activeSection === "instagram"
                      ? "Gestion de Instagram"
                      : activeSection === "disponibilidad"
                      ? "Gestion de disponibilidad"
                    : activeSection === "citas"
                      ? "Gestion de citas"
                      : activeSection === "cuenta"
                        ? "Gestion de cuenta"
                        : "Dashboard de citas"}
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
