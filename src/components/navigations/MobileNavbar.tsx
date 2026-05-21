import React from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, CalendarDays, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";
import type { NavItem } from "./Navbar";
import brandLogo from "@/assets/logo_cquezadaskin.png";

type Props = {
  items: NavItem[];
};

export const MobileNavbar: React.FC<Props> = ({ items }) => {
  const [open, setOpen] = React.useState(false);
  const closeSheet = React.useCallback(() => setOpen(false), []);

  return (
    <>
      <Link to="/" className="flex min-w-0 items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#00D1C1]/35 bg-[#0B0F0F] shadow-[0_0_28px_rgba(0,209,193,0.14)]">
          <img src={brandLogo} alt="" className="h-full w-full object-cover object-center" />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="font-display truncate text-base font-semibold leading-none text-white">
            CQuezada<span className="text-[#00D1C1]">Skin</span>
          </div>
          <div className="truncate text-[11px] text-[#B8B8B8]">
            Facial y corporal
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <Button
          asChild
          size="sm"
          className="rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0]"
        >
          <Link to="/agendar" className="gap-2" aria-label="Reservar una hora">
            <CalendarDays className="h-4 w-4" />
            Reservar
          </Link>
        </Button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-2xl border-white/10 bg-[#111414] text-white hover:bg-[#00D1C1]/10"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-[320px] border-l border-white/10 bg-[#050505] p-0 text-white">
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#00D1C1]/35 bg-[#0B0F0F] shadow-[0_0_28px_rgba(0,209,193,0.14)]">
                  <img src={brandLogo} alt="" className="h-full w-full object-cover object-center" />
                </div>
                <div>
                  <div className="font-display text-lg font-semibold leading-none text-white">
                    CQuezada<span className="text-[#00D1C1]">Skin</span>
                  </div>
                  <div className="text-xs text-[#B8B8B8]">
                    Home studio en {siteConfig.address}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-[#111414] p-3 text-sm text-[#D6D6D6]">
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
                      "block rounded-xl px-4 py-3 text-sm font-medium transition",
                      "text-[#D6D6D6] hover:bg-[#00D1C1]/10 hover:text-white",
                      isActive ? "bg-[#00D1C1]/10 text-[#00D1C1]" : "",
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
                className="w-full rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0]"
              >
                <Link to="/agendar" className="gap-2" onClick={closeSheet}>
                  <CalendarDays className="h-4 w-4" />
                  Reservar ahora
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full rounded-2xl border-white/10 bg-[#111414] text-white hover:bg-[#00D1C1]/10"
              >
                <a href={siteConfig.phoneHref} className="gap-2">
                  <Phone className="h-4 w-4" />
                  Llamar
                </a>
              </Button>

              <div className="text-xs text-[#8E8E8E]">
                Horario: {siteConfig.schedule}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};
