import React from "react";
import { Link } from "react-router-dom";
import { siteConfig } from "@/config/site";
import brandLogo from "@/assets/oficial_logo.png";

type Props = {
  compact?: boolean;
};

export const NavbarBrand: React.FC<Props> = ({ compact = false }) => {
  return (
    <Link to="/" className="group flex items-center gap-3" aria-label={`Ir al inicio de ${siteConfig.name}`}>
      <div
          className={[
            "relative flex items-center justify-center overflow-hidden rounded-xl border border-[var(--brand-100)] bg-white/82 p-1 shadow-[var(--shadow-soft)] transition-all duration-300 group-hover:border-[var(--brand-700)]",
            compact ? "h-10 w-10" : "h-12 w-12",
          ].join(" ")}
        aria-hidden="true"
      >
        <img
          src={brandLogo}
          alt=""
          className="h-full w-full object-contain object-center"
          loading="eager"
        />
      </div>

      <div className="leading-tight">
        <div
          className={[
            "brand-wordmark font-semibold leading-none text-[var(--brand-900)] transition-all duration-300",
            compact ? "text-base" : "text-[1.08rem]",
          ].join(" ")}
        >
          CQUEZADASKIN
        </div>
        <div
          className={[
            "mt-1 text-[11px] font-medium text-[var(--brand-700)] transition-all duration-300",
            compact ? "opacity-80" : "opacity-100",
          ].join(" ")}
        >
          Skincare facial y corporal
        </div>
      </div>
    </Link>
  );
};

export default NavbarBrand;
