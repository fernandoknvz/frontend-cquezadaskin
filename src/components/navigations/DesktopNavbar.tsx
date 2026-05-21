import React from "react";
import { NavLink, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, CalendarDays } from "lucide-react";
import { siteConfig } from "@/config/site";
import type { NavItem } from "./Navbar";
import { NavbarBrand } from "./NavbarBrand";

type Props = {
  items: NavItem[];
};

export const DesktopNavbar: React.FC<Props> = ({ items }) => {
  return (
    <>
      {/* Brand */}
      <NavbarBrand />

      {/* Nav */}
      <nav className="flex items-center gap-1" aria-label="Navegación principal">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              [
                "rounded-xl px-3 py-2 text-sm font-medium transition",
                "text-[#D6D6D6]",
                "hover:bg-[#00D1C1]/10 hover:text-white",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1C1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]",
                isActive
                  ? "bg-[#00D1C1]/10 text-[#00D1C1]"
                  : "",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <a
          href={siteConfig.phoneHref}
          className="hidden lg:inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#D6D6D6] transition hover:bg-[#00D1C1]/10 hover:text-white"
          aria-label={`Llamar a ${siteConfig.name}`}
        >
          <Phone className="h-4 w-4" />
          <span>{siteConfig.phone}</span>
        </a>

        <Button
          asChild
          className="rounded-2xl shadow-sm"
          style={{
            backgroundColor: "#00D1C1",
            color: "#03110f",
          }}
        >
          <Link
            to="/agendar"
            className="gap-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20E0D0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
            aria-label="Reservar una hora"
          >
            <CalendarDays className="h-4 w-4" />
            Reservar
          </Link>
        </Button>
      </div>
    </>
  );
};

export default DesktopNavbar;
