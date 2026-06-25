import React from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, CalendarCheck2, Phone } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";
import type { NavItem } from "./Navbar";
import { NavbarBrand } from "./NavbarBrand";

type Props = {
  items: NavItem[];
  compact?: boolean;
};

export const MobileNavbar: React.FC<Props> = ({ items, compact = false }) => {
  const [open, setOpen] = React.useState(false);
  const closeSheet = React.useCallback(() => setOpen(false), []);

  return (
    <>
      <NavbarBrand compact={compact} />

      <div className="flex items-center gap-2">
        <Button
          asChild
          size="sm"
          className={[
            "rounded-2xl bg-[#f1d5cc] px-3 font-semibold text-[#4b3932] transition-all duration-300 hover:bg-[#e8c2b5]",
            compact ? "h-9" : "h-10",
          ].join(" ")}
        >
          <Link to="/agendar" className="gap-2" aria-label="Reservar una hora">
            <CalendarCheck2 className="h-4 w-4" />
            <span className="hidden min-[390px]:inline">Reservar</span>
          </Link>
        </Button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-2xl border-[#d9b8a8] bg-white text-[#4b3932] hover:bg-[#f8eee8]"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-[min(88vw,340px)] border-l border-[#ead3c7] bg-[#fffaf7] p-0 text-[#3b302c]">
            <VisuallyHidden>
              <SheetTitle>Menu de navegacion principal</SheetTitle>
            </VisuallyHidden>

            <div className="p-5">
              <NavbarBrand />

              <div className="mt-4 rounded-2xl border border-[#ead3c7] bg-white p-3 text-sm text-[#6d554b]">
                Tratamientos faciales y corporales en un espacio profesional,
                sobrio y fácil de agendar.
              </div>
            </div>

            <Separator className="bg-white/10" />

            <nav className="p-2" aria-label="Navegación principal móvil">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={closeSheet}
                  className={({ isActive }) =>
                    [
                      "block min-h-11 rounded-xl px-4 py-3 text-sm font-medium transition",
                      "text-[#6d554b] hover:bg-[#f8eee8] hover:text-[#3b302c]",
                      isActive ? "bg-[#f8eee8] text-[#9b6f5f]" : "",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <Separator className="bg-white/10" />

            <div className="space-y-3 p-5">
              <Button
                asChild
                className="w-full rounded-2xl bg-[#f1d5cc] font-semibold text-[#4b3932] hover:bg-[#e8c2b5]"
              >
                <Link to="/agendar" className="gap-2" onClick={closeSheet}>
                  <CalendarCheck2 className="h-4 w-4" />
                  Reservar ahora
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full rounded-2xl border-[#d9b8a8] bg-white text-[#4b3932] hover:bg-[#f8eee8]"
              >
                <a href={siteConfig.phoneHref} className="gap-2">
                  <Phone className="h-4 w-4" />
                  Llamar
                </a>
              </Button>

              <div className="text-xs text-[#7d6a61]">
                Horario: {siteConfig.schedule}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};
