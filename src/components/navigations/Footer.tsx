import React from "react";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Instagram, Mail, MapPinned, PhoneCall } from "lucide-react";
import { siteConfig } from "@/config/site";
import NavbarBrand from "./NavbarBrand";

const ContactIcon = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#ead3c7] bg-white/70 text-[#b98975]">
    {children}
  </span>
);

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#ead3c7] bg-[#fffaf7]">
      <div className="w-full px-4 py-10 2xl:mx-auto 2xl:w-[80%] 2xl:px-0">
        <div className="mx-auto grid gap-10 md:grid-cols-3 lg:w-[90%] 2xl:w-[80%]">
          <div className="md:col-span-1">
            <NavbarBrand />

            <p className="mt-4 text-sm leading-relaxed text-[#6d554b]">
              Tratamientos faciales y corporales en home studio, con una
              experiencia profesional, limpia y enfocada en tu piel.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#3b302c]">Ayuda</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link className="text-[#6d554b] hover:text-[#9b6f5f]" to="/contacto">
                  Contacto
                </Link>
              </li>
              <li>
                <Link className="text-[#6d554b] hover:text-[#9b6f5f]" to="/agendar">
                  Reservas
                </Link>
              </li>
              <li>
                <Link className="text-[#6d554b] hover:text-[#9b6f5f]" to="/servicios">
                  Servicios
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#3b302c]">Contacto</h4>
            <div className="mt-4 space-y-3 text-sm text-[#6d554b]">
              <div className="flex items-center gap-2">
                <ContactIcon>
                  <PhoneCall className="h-4 w-4" />
                </ContactIcon>
                <a className="hover:text-white" href={siteConfig.phoneHref}>
                  {siteConfig.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <ContactIcon>
                  <Mail className="h-4 w-4" />
                </ContactIcon>
                <a className="hover:text-white" href={`mailto:${siteConfig.email}`}>
                  {siteConfig.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <ContactIcon>
                  <Instagram className="h-4 w-4" />
                </ContactIcon>
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
                <ContactIcon>
                  <MapPinned className="h-4 w-4" />
                </ContactIcon>
                <span>{siteConfig.address}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-[#ead3c7]" />

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-[#7d6a61]">
            © 2026 CQUEZADASKIN. Plataforma de agendamiento desarrollada por
            Fernando Olguea · Ingeniero en Informática.
          </p>
          <div className="flex gap-4 text-xs">
            <Link className="text-[#7d6a61] hover:text-[#9b6f5f]" to="/privacidad">
              Privacidad
            </Link>
            <Link className="text-[#7d6a61] hover:text-[#9b6f5f]" to="/terminos">
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
