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
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    let animationFrame = 0;

    const readWindowScroll = () =>
      window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

    const updateScrolled = (event?: Event) => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);

      animationFrame = window.requestAnimationFrame(() => {
        const target = event?.target;
        const targetScroll =
          target instanceof Element || target instanceof Document
            ? "scrollTop" in target
              ? Number(target.scrollTop)
              : 0
            : 0;

        setIsScrolled(Math.max(readWindowScroll(), targetScroll) > 8);
      });
    };

    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    document.addEventListener("scroll", updateScrolled, true);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", updateScrolled);
      document.removeEventListener("scroll", updateScrolled, true);
    };
  }, []);

  return (
    <div
      className={[
        "w-full border-b transition-all duration-300 ease-out supports-[backdrop-filter]:backdrop-blur-xl",
        isScrolled
          ? "border-[#e2c3b6] bg-[#fffaf7]/96 shadow-[0_16px_38px_rgba(80,55,45,0.10)] supports-[backdrop-filter]:bg-[#fffaf7]/88"
          : "border-[#ead3c7]/80 bg-[#fffaf7]/82 supports-[backdrop-filter]:bg-[#fffaf7]/68",
      ].join(" ")}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] rounded-xl border border-[#ead3c7] bg-white px-3 py-2 text-sm font-medium text-[#3b302c] shadow"
      >
        Saltar al contenido
      </a>

      <div className="w-full px-4 2xl:mx-auto 2xl:w-[80%] 2xl:px-0">
        <div className="flex h-16 items-center justify-between">
          <div className="hidden w-full items-center justify-between md:flex">
            <DesktopNavbar items={NAV_ITEMS} compact={isScrolled} />
          </div>

          <div className="flex w-full items-center justify-between md:hidden">
            <MobileNavbar items={NAV_ITEMS} compact={isScrolled} />
          </div>
        </div>
      </div>
    </div>
  );
};
