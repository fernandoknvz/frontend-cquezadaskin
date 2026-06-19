import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, CalendarCheck2, MessageCircle } from "lucide-react";

import { listServices, type ServiceItem } from "@/services/servicesApi";
import { REAL_SERVICE_CATEGORIES } from "@/features/services/data/realServices";
import { resolveImageUrl } from "@/lib/resolveImageUrl";

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
  image: "/img/oficial_hero.jpeg",
  ctaPrimary: { label: "Ver tratamientos", to: "/servicios" },
  ctaSecondary: { label: "Agendar", to: "/agendar" },
}));

export const Services: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadServices = async () => {
      try {
        const data = await listServices("servicios");
        if (!isMounted) return;
        setServices(data);
        setHasLoadError(false);
      } catch {
        if (!isMounted) return;
        setServices([]);
        setHasLoadError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadServices();

    return () => {
      isMounted = false;
    };
  }, []);

  const servicesToRender = useMemo(() => {
    const active = services.filter((service) => service.activo !== false);
    const visible = active.filter((service) => service.mostrar_servicios !== false);
    const source = visible.length > 0 ? visible : active;

    if (source.length === 0) return hasLoadError ? STATIC_SERVICES : [];

    return source
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .map((service) => mapServiceItemToCard(service));
  }, [hasLoadError, services]);

  return (
    <section className="w-full bg-[#fffaf7]">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 2xl:w-[80%] 2xl:max-w-none">
        <div className="max-w-2xl">
          <p className="premium-kicker">Tratamientos</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#3b302c] min-[390px]:text-3xl sm:text-4xl">
            Cuidado facial y corporal <span className="brand-wordmark">CQUEZADASKIN</span>
          </h2>
          <p className="mt-4 text-[#6d554b]">
            Limpiezas faciales, microneedling y tratamientos corporales con una
            experiencia sobria, limpia y profesional.
          </p>
        </div>

        {isLoading ? (
          <ServicesSkeleton />
        ) : servicesToRender.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-8">
            {servicesToRender.map((service) => (
              <ServiceCard key={`${service.title}-${service.subtitle}`} service={service} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-[#ead3c7] bg-white/76 p-6 text-sm text-[#6d554b] shadow-[0_18px_50px_rgba(80,55,45,0.06)]">
            Los servicios estarán disponibles en esta sección dentro de unos momentos.
          </div>
        )}
      </div>
    </section>
  );
};

function ServiceCard({ service }: { service: Service }) {
  return (
    <article
      className="premium-card premium-card-hover group flex h-full flex-col overflow-hidden rounded-2xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={service.image}
          alt={`${service.title} ${service.subtitle}`}
          className="h-full w-full object-cover opacity-72 grayscale-[0.25] transition duration-500 group-hover:scale-[1.03] group-hover:opacity-90"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(59,48,44,0)_0%,rgba(59,48,44,0.70)_100%)]" />
        <span className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-medium text-[#9b6f5f]">
          {service.title}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-semibold text-[#3b302c]">{service.subtitle}</h3>
        <p className="mt-3 flex-1 text-sm leading-7 text-[#6d554b]">
          {service.description}
        </p>

        {service.bullets.length > 0 ? (
          <ul className="mt-5 space-y-2">
            {service.bullets.slice(0, 4).map((bullet) => (
              <li key={bullet} className="flex items-start gap-2 text-sm text-[#5f4a42]">
                <Check className="mt-0.5 h-4 w-4 text-[#b98975]" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex flex-col gap-3 pt-6">
          <Button
            asChild
            className="w-full rounded-2xl bg-[#f1d5cc] font-semibold text-[#4b3932] hover:bg-[#e8c2b5] focus-visible:ring-[#c69a86]/40"
          >
            <Link to={service.ctaPrimary.to} className="gap-2">
              <CalendarCheck2 className="h-4 w-4" />
              {service.ctaPrimary.label}
            </Link>
          </Button>

          {service.ctaSecondary && (
            <Button
              asChild
              variant="outline"
              className="w-full rounded-2xl border-[#d9b8a8] bg-white text-[#4b3932] hover:border-[#b98975] hover:bg-[#f8eee8]"
            >
              <Link to={service.ctaSecondary.to} className="gap-2">
                <MessageCircle className="h-4 w-4" />
                {service.ctaSecondary.label}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
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
    image: resolveImageUrl(service.imagen_url, "/img/oficial_hero.jpeg"),
    ctaPrimary: { label, to },
    ctaSecondary:
      secondaryLabel && secondaryUrl ? { label: secondaryLabel, to: secondaryUrl } : undefined,
  };
}

function ServicesSkeleton() {
  return (
    <div
      className="mt-10 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-8"
      aria-hidden="true"
    >
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="premium-card flex h-full animate-pulse flex-col overflow-hidden rounded-2xl"
        >
          <div className="aspect-[4/3] bg-[#f3e2da]" />
          <div className="flex flex-1 flex-col p-5">
            <div className="h-6 w-3/4 rounded-full bg-[#ead3c7]" />
            <div className="mt-5 space-y-3">
              <div className="h-4 w-full rounded-full bg-[#f3e2da]" />
              <div className="h-4 w-5/6 rounded-full bg-[#f3e2da]" />
              <div className="h-4 w-2/3 rounded-full bg-[#f3e2da]" />
            </div>
            <div className="mt-8 space-y-3">
              <div className="h-10 rounded-2xl bg-[#f1d5cc]" />
              <div className="h-10 rounded-2xl border border-[#d9b8a8] bg-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
