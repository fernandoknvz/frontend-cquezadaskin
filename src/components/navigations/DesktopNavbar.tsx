import React from "react";
import { NavLink, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, CalendarCheck2 } from "lucide-react";
import { siteConfig } from "@/config/site";
import type { NavItem } from "./Navbar";
import { NavbarBrand } from "./NavbarBrand";

type Props = {
  items: NavItem[];
  compact?: boolean;
};

export const DesktopNavbar: React.FC<Props> = ({ items, compact = false }) => {
  return (
    <>
      {/* Brand */}
      <NavbarBrand compact={compact} />

      {/* Nav */}
      <nav className="flex items-center gap-1" aria-label="Navegación principal">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              [
                "rounded-xl px-3 text-sm font-medium transition",
                compact ? "py-1.5" : "py-2",
                "text-[#6d554b]",
                "hover:bg-[#f8eee8] hover:text-[#3b302c]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c69a86] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf7]",
                isActive
                  ? "bg-[#f8eee8] text-[#9b6f5f]"
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
          className="hidden lg:inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#6d554b] transition hover:bg-[#f8eee8] hover:text-[#3b302c]"
          aria-label={`Llamar a ${siteConfig.name}`}
        >
          <Phone className="h-4 w-4" />
          <span>{siteConfig.phone}</span>
        </a>

        <Button
          asChild
          className={[
            "rounded-2xl shadow-sm transition-all duration-300",
            compact ? "h-9 px-3" : "h-10 px-4",
          ].join(" ")}
          style={{
            backgroundColor: "var(--brand-800)",
            color: "var(--brand-white)",
          }}
        >
          <Link
            to="/agendar"
            className="gap-2 font-semibold hover:bg-[#e8c2b5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c69a86] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf7]"
            aria-label="Reservar una hora"
          >
            <CalendarCheck2 className="h-4 w-4" />
            Reservar
          </Link>
        </Button>
      </div>
    </>
  );
};

export default DesktopNavbar;
