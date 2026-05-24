import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, CalendarDays, MessageCircle } from "lucide-react";

import skincareHeroImg from "@/assets/cquezadaskin-hero.png";
import { listServices, type ServiceItem } from "@/services/servicesApi";
import { REAL_SERVICE_CATEGORIES } from "@/features/services/data/realServices";

type Service = {
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  image: string;
  ctaPrimary: { label: string; to: string };
  ctaSecondary?: { label: string; to: string };
};

const STATIC_SERVICES: Service[] = REAL_SERVICE_CATEGORIES.map((category) => ({
  title: category.name,
  subtitle: category.name,
  description: category.description,
  bullets: category.services.slice(0, 4).map((service) => service.name),
  image: skincareHeroImg,
  ctaPrimary: { label: "Ver tratamientos", to: "/servicios" },
  ctaSecondary: { label: "Agendar", to: "/agendar" },
}));

export const Services: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const data = await listServices();
        setServices(data);
      } catch {
        setServices([]);
      }
    };

    loadServices();
  }, []);

  const servicesToRender = useMemo(() => {
    const visible = services.filter(
      (service) => service.activo !== false && service.mostrar_servicios
    );
    if (visible.length === 0) return STATIC_SERVICES;
    return visible
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .map((service) => mapServiceItemToCard(service));
  }, [services]);

  return (
    <section className="w-full bg-[#050505]">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 2xl:w-[80%] 2xl:max-w-none">
        <div className="max-w-2xl">
          <p className="premium-kicker">Tratamientos</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white min-[390px]:text-3xl sm:text-4xl">
            Cuidado facial y corporal CQuezadaSkin
          </h2>
          <p className="mt-4 text-[#B8B8B8]">
            Limpiezas faciales, microneedling y tratamientos corporales con una
            experiencia sobria, limpia y profesional.
          </p>
        </div>

        <motion.div
          className="mt-10 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.14 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {servicesToRender.map((service) => (
            <ServiceCard key={`${service.title}-${service.subtitle}`} service={service} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

function ServiceCard({ service }: { service: Service }) {
  return (
    <motion.article
      className="premium-card premium-card-hover group flex h-full flex-col overflow-hidden rounded-2xl"
      variants={{
        hidden: { opacity: 0, y: 18 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      whileHover={{ y: -5, scale: 1.015 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={service.image}
          alt={`${service.title} ${service.subtitle}`}
          className="h-full w-full object-cover opacity-72 grayscale-[0.25] transition duration-500 group-hover:scale-[1.03] group-hover:opacity-90"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0)_0%,rgba(5,5,5,0.88)_100%)]" />
        <span className="absolute left-4 top-4 rounded-full border border-[#00D1C1]/30 bg-[#00D1C1]/10 px-3 py-1 text-xs font-medium text-[#20E0D0]">
          {service.title}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-semibold text-white">{service.subtitle}</h3>
        <p className="mt-3 flex-1 text-sm leading-7 text-[#D6D6D6]">
          {service.description}
        </p>

        {service.bullets.length > 0 ? (
          <ul className="mt-5 space-y-2">
            {service.bullets.slice(0, 4).map((bullet) => (
              <li key={bullet} className="flex items-start gap-2 text-sm text-[#C9C9C9]">
                <Check className="mt-0.5 h-4 w-4 text-[#00D1C1]" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex flex-col gap-3 pt-6">
          <Button
            asChild
            className="w-full rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0]"
          >
            <Link to={service.ctaPrimary.to} className="gap-2">
              <CalendarDays className="h-4 w-4" />
              {service.ctaPrimary.label}
            </Link>
          </Button>

          {service.ctaSecondary && (
            <Button
              asChild
              variant="outline"
              className="w-full rounded-2xl border-white/10 bg-[#121212]/[0.03] text-white hover:border-[#00D1C1]/50 hover:bg-[#121212]/[0.07]"
            >
              <Link to={service.ctaSecondary.to} className="gap-2">
                <MessageCircle className="h-4 w-4" />
                {service.ctaSecondary.label}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default Services;

function mapServiceItemToCard(service: ServiceItem): Service {
  const label = service.cta_primary_label || "Agendar";
  const to = service.cta_primary_url || "/agendar";
  const secondaryLabel = service.cta_secondary_label || "Ver disponibilidad";
  const secondaryUrl = service.cta_secondary_url || "/agendar";

  return {
    title: service.etiqueta?.trim() || "Servicio",
    subtitle: service.subtitulo?.trim() || service.nombre,
    description: service.descripcion ?? "",
    bullets: service.beneficios ?? [],
    image: service.imagen_url || skincareHeroImg,
    ctaPrimary: { label, to },
    ctaSecondary:
      secondaryLabel && secondaryUrl ? { label: secondaryLabel, to: secondaryUrl } : undefined,
  };
}
