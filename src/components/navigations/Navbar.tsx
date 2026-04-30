import React from "react";
import { DesktopNavbar } from "./DesktopNavbar";
import { MobileNavbar } from "./MobileNavbar";

export type NavItem = { label: string; to: string };

const NAV_ITEMS: NavItem[] = [
  { label: "Inicio", to: "/" },
  { label: "Servicios", to: "/servicios" },
  { label: "Especiales", to: "/empresas" },
  { label: "Instagram", to: "/eventos" },
  { label: "Agendar", to: "/agendar" },
  { label: "Mis reservas", to: "/mis-reservas" },
  { label: "Contacto", to: "/contacto" },
];

export const Navbar: React.FC = () => {
  return (
    <div className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#050505]/82 backdrop-blur-xl supports-[backdrop-filter]:bg-[#050505]/72">
      {/* Accesibilidad: salto rápido al contenido */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] rounded-xl border border-white/10 bg-[#121212] px-3 py-2 text-sm font-medium text-white shadow"
      >
        Saltar al contenido
      </a>

      <div className="w-full px-4 2xl:w-[80%] 2xl:px-0 2xl:mx-auto">
        <div className="h-16 flex items-center justify-between">
          {/* Desktop */}
          <div className="hidden md:flex w-full items-center justify-between">
            <DesktopNavbar items={NAV_ITEMS} />
          </div>

          {/* Mobile */}
          <div className="flex md:hidden w-full items-center justify-between">
            <MobileNavbar items={NAV_ITEMS} />
          </div>
        </div>
      </div>
    </div>
  );
};
