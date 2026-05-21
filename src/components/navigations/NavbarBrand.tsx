import React from "react";
import { Link } from "react-router-dom";
import { siteConfig } from "@/config/site";
import brandLogo from "@/assets/logo_cquezadaskin.png";

export const NavbarBrand: React.FC = () => {
  return (
    <Link to="/" className="group flex items-center gap-3" aria-label={`Ir al inicio de ${siteConfig.name}`}>
      <div
        className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[#00D1C1]/35 bg-[#0B0F0F] shadow-[0_0_30px_rgba(0,209,193,0.16)] transition group-hover:border-[#00D1C1]/70 group-hover:shadow-[0_0_34px_rgba(0,209,193,0.24)]"
        aria-hidden="true"
      >
        <img
          src={brandLogo}
          alt=""
          className="h-full w-full object-cover object-center"
          loading="eager"
        />
      </div>

      <div className="leading-tight">
        <div className="font-display text-[1.05rem] font-semibold leading-none text-white">
          CQuezada
          <span className="font-bold text-[#00D1C1]">Skin</span>
        </div>
        <div className="mt-1 text-[11px] font-medium text-[#D6D6D6]">
          Skincare facial y corporal
        </div>
      </div>
    </Link>
  );
};

export default NavbarBrand;
