import React from "react";
import { Link } from "react-router-dom";
import { siteConfig } from "@/config/site";

type Props = {
  compact?: boolean;
};

export const NavbarBrand: React.FC<Props> = ({ compact = false }) => {
  return (
    <Link
      to="/"
      className="group inline-flex min-w-0 items-center py-1"
      aria-label={`Ir al inicio de ${siteConfig.name}`}
    >
      <div className="min-w-0 leading-tight">
        <div
          className={[
            "brand-wordmark truncate font-semibold leading-none text-[var(--brand-900)] transition-all duration-300",
            compact ? "text-[1.02rem]" : "text-[1.14rem]",
          ].join(" ")}
        >
          CQUEZADASKIN
        </div>
      </div>
    </Link>
  );
};

export default NavbarBrand;
