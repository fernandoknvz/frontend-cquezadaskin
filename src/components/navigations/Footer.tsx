import React from "react";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, MapPin, Instagram } from "lucide-react";
import { siteConfig } from "@/config/site";
import NavbarBrand from "./NavbarBrand";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/10 bg-[#050505]">
      <div className="w-full px-4 py-10 2xl:mx-auto 2xl:w-[80%] 2xl:px-0">
        <div className="mx-auto grid gap-10 md:grid-cols-3 lg:w-[90%] 2xl:w-[80%]">
          <div className="md:col-span-1">
            <NavbarBrand />

            <p className="mt-4 text-sm leading-relaxed text-[#B8B8B8]">
              Tratamientos faciales y corporales en home studio, con una
              experiencia profesional, limpia y enfocada en tu piel.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Ayuda</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link className="text-[#B8B8B8] hover:text-[#00D1C1]" to="/contacto">
                  Contacto
                </Link>
              </li>
              <li>
                <Link className="text-[#B8B8B8] hover:text-[#00D1C1]" to="/agendar">
                  Reservas
                </Link>
              </li>
              <li>
                <Link className="text-[#B8B8B8] hover:text-[#00D1C1]" to="/servicios">
                  Servicios
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Contacto</h4>
            <div className="mt-4 space-y-3 text-sm text-[#B8B8B8]">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#00D1C1]" />
                <a className="hover:text-white" href={siteConfig.phoneHref}>
                  {siteConfig.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#00D1C1]" />
                <a className="hover:text-white" href={`mailto:${siteConfig.email}`}>
                  {siteConfig.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-[#00D1C1]" />
                <a
                  className="hover:text-white"
                  href={siteConfig.instagram}
                  target="_blank"
                  rel="noreferrer"
                >
                  {siteConfig.instagramHandle}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#00D1C1]" />
                <span>{siteConfig.address}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-[#8E8E8E]">
            © {new Date().getFullYear()} {siteConfig.name}. Sistema Web de
            Agendamiento creado por Fernando Olguea Desarrollador de Software.
          </p>
          <div className="flex gap-4 text-xs">
            <Link className="text-[#8E8E8E] hover:text-[#00D1C1]" to="/privacidad">
              Privacidad
            </Link>
            <Link className="text-[#8E8E8E] hover:text-[#00D1C1]" to="/terminos">
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
