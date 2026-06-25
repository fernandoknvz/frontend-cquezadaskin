import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Building2,
  CalendarCheck2,
  CalendarDays,
  Check,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import { listServices, type ServiceItem } from "@/services/servicesApi";
import { listServiceCategories, type ServiceCategory } from "@/services/categoriesApi";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import { getWhatsAppUrl } from "@/lib/whatsapp";

type Service = {
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  image: string;
  ctaPrimary: { label: string; to: string };
  ctaSecondary?: { label: string; to: string };
};

type Category = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  items: Service[];
};

export const BusinessServicesPage: React.FC = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [specialServices, setSpecialServices] = useState<ServiceItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [specialServicesData, categoriesData] = await Promise.all([
          listServices("especiales"),
          listServiceCategories(),
        ]);
        setSpecialServices(specialServicesData);
        setCategories(categoriesData);
      } catch {
        setSpecialServices([]);
        setCategories([]);
      }
    };

    loadData();
  }, []);

  const specialCategories = useMemo(() => {
    const visible = specialServices.filter(
      (service) => service.activo !== false && service.mostrar_especiales
    );
    return buildDynamicCategories(visible, categories);
  }, [categories, specialServices]);

  return (
    <section className="mx-auto w-[92%] 2xl:w-[80%]">
      <div className="w-full">
        <div className="mx-auto w-full max-w-6xl py-10 sm:py-12 lg:py-14 2xl:w-[80%] 2xl:max-w-none">
          <header className="max-w-2xl">
            <h1 className="mb-4 text-3xl font-bold tracking-tight text-white min-[390px]:text-4xl md:text-5xl">
              Atenciones especiales
            </h1>
            <p className="mt-2 text-base text-[#6d554b] sm:text-lg">
              Tratamientos especiales y experiencias de autocuidado
              personalizadas segun disponibilidad.
            </p>
          </header>

          <div className="mt-10">
            {specialCategories ? (
              <ServiceSection categories={specialCategories} />
            ) : (
              <EmptySpecialsState />
            )}
          </div>

          <CoordinationBlock />
        </div>
      </div>
    </section>
  );
};

function buildDynamicCategories(visible: ServiceItem[], categories: ServiceCategory[]) {
  if (visible.length === 0) {
    return null;
  }

  const categoryMap = new Map<number, ServiceCategory>();
  categories
    .filter((cat) => cat.activo !== false)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .forEach((cat) => categoryMap.set(cat.id, cat));

  const grouped = new Map<number, ServiceItem[]>();
  const withoutCategory: ServiceItem[] = [];

  visible.forEach((service) => {
    const categoryId = service.categoria_id;
    if (categoryId && categoryMap.has(categoryId)) {
      const list = grouped.get(categoryId) ?? [];
      list.push(service);
      grouped.set(categoryId, list);
    } else {
      withoutCategory.push(service);
    }
  });

  const iconPool = [Building2, Sparkles];
  const result: Category[] = [];

  categoryMap.forEach((cat, id) => {
    const items = grouped.get(id);
    if (!items || items.length === 0) return;
    const Icon = iconPool[result.length % iconPool.length] ?? Sparkles;
    result.push({
      id: String(id),
      name: cat.nombre,
      description:
        cat.descripcion ??
        "Experiencias especiales de bienestar y estetica personalizadas.",
      icon: <Icon className="h-4 w-4" />,
      items: items
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
        .map(mapServiceItemToCard),
    });
  });

  if (withoutCategory.length > 0) {
    result.push({
      id: "otros",
      name: "Otros servicios",
      description: "Opciones especiales adicionales disponibles.",
      icon: <Sparkles className="h-4 w-4" />,
      items: withoutCategory
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
        .map(mapServiceItemToCard),
    });
  }

  return result.length > 0 ? result : null;
}

function ServiceSection({ categories }: { categories: Category[] }) {
  return (
    <div className="space-y-12 sm:space-y-14">
      {categories.map((cat) => (
        <CategoryBlock key={`especiales-${cat.id}`} category={cat} />
      ))}
    </div>
  );
}

function CategoryBlock({ category }: { category: Category }) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <div
          className="inline-flex items-center justify-center rounded-2xl p-2 border border-white/10"
          style={{ backgroundColor: "rgba(246,231,223,0.85)" }}
        >
          {category.icon}
        </div>

        <div className="min-w-0">
          <h2 className="text-2xl font-semibold text-white">{category.name}</h2>
          <p className="mt-1 text-[#6d554b] max-w-3xl">{category.description}</p>
        </div>
      </div>

      <div className="mt-8 space-y-12">
        {category.items.map((s, idx) => (
          <ServiceRow key={`${category.id}-${s.subtitle}`} service={s} reverse={idx % 2 === 1} />
        ))}
      </div>
    </div>
  );
}

function ServiceRow({ service, reverse }: { service: Service; reverse: boolean }) {
  const isWhatsAppCta = service.ctaSecondary?.label === "Hablar por WhatsApp";

  return (
    <div
      className={[
        "grid items-center gap-8 lg:gap-10",
        "grid-cols-1 lg:grid-cols-2",
        reverse ? "lg:[&_.media]:order-2 lg:[&_.content]:order-1" : "",
      ].join(" ")}
    >
      <div className="media relative">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#ffffff]/75 shadow-[0_10px_30px_rgba(0,0,0,0.08)] sm:rounded-3xl">
          <div className="aspect-[4/3] w-full">
            <img
              src={service.image}
              alt={`${service.title} ${service.subtitle}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.10) 55%, rgba(246,231,223,0.24) 100%)",
            }}
          />
        </div>

        <div
          className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] blur-2xl opacity-50"
          style={{
            background:
              "linear-gradient(135deg, rgba(96,94,102,0.22) 0%, rgba(157,155,163,0.2) 48%, rgba(222,220,226,0.3) 100%)",
          }}
        />
      </div>

      <div className="content">
        <div
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-[#F5F5F5] border border-white/10"
          style={{ backgroundColor: "rgba(246,231,223,0.85)" }}
        >
          {service.title}
        </div>

        <h3 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
          {service.subtitle}
        </h3>

        <p className="mt-3 text-[#6d554b] leading-relaxed">{service.description}</p>

        {service.bullets.length > 0 ? (
          <ul className="mt-5 space-y-2">
            {service.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-[#6d554b]">
                <Check className="h-4 w-4 mt-0.5" style={{ color: "var(--brand-800)" }} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            className="w-full rounded-2xl shadow-sm sm:w-auto"
            style={{ backgroundColor: "var(--brand-800)", color: "var(--brand-white)" }}
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
              className="w-full rounded-2xl border-white/10 bg-[#ffffff]/80 hover:bg-[#ffffff] sm:w-auto"
            >
              {isWhatsAppCta ? (
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  {service.ctaSecondary.label}
                </a>
              ) : (
                <Link to={service.ctaSecondary.to} className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  {service.ctaSecondary.label}
                </Link>
              )}
            </Button>
          )}
        </div>

        <div className="mt-3 text-xs text-[#8e7a71]">
          * Horarios y disponibilidad pueden variar segun agenda.
        </div>
      </div>
    </div>
  );
}

function EmptySpecialsState() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#ffffff]/80 p-5 text-sm text-[#6d554b] sm:rounded-3xl sm:p-6">
      <p className="font-semibold text-white">
        Aún no hay atenciones especiales publicadas.
      </p>
      <p className="mt-2">
        Puedes escribirnos para consultar por una atencion especial o disponibilidad personalizada.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button
          asChild
          className="w-full rounded-2xl shadow-sm sm:w-auto"
          style={{ backgroundColor: "var(--brand-800)", color: "var(--brand-white)" }}
        >
          <Link to="/contacto" className="gap-2">
            <CalendarCheck2 className="h-4 w-4" />
            Contactar
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="w-full rounded-2xl border-white/10 bg-[#ffffff]/80 hover:bg-[#ffffff] sm:w-auto"
        >
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Hablar por WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}

function CoordinationBlock() {
  return (
    <div className="mt-12 rounded-2xl border border-white/10 bg-[#ffffff]/80 p-4 text-sm text-[#6d554b] sm:rounded-3xl sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          className="mt-0.5 rounded-2xl p-2"
          style={{ backgroundColor: "rgba(246,231,223,0.85)" }}
        >
          <CalendarDays className="h-4 w-4" style={{ color: "var(--brand-800)" }} />
        </div>
        <div>
          <div className="font-semibold text-white">Como coordinamos</div>
          <p className="mt-1">
            Nos indicas que tratamiento especial buscas y la disponibilidad que
            necesitas. Te orientamos con una respuesta clara para coordinar tu
            atencion.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="w-full rounded-2xl shadow-sm sm:w-auto"
              style={{ backgroundColor: "var(--brand-800)", color: "var(--brand-white)" }}
            >
              <Link to="/contacto" className="gap-2">
                <Building2 className="h-4 w-4" />
                Realizar consulta
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full rounded-2xl border-white/10 bg-[#ffffff]/80 hover:bg-[#ffffff] sm:w-auto"
            >
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Hablar por WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizeSpecialCtaLabel(label?: string | null) {
  const value = label?.trim();
  if (!value) return "Consultar especial";

  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (
    normalized.includes("cotizar") ||
    normalized.includes("jornada") ||
    normalized.includes("empresa")
  ) {
    return "Realizar consulta";
  }

  return value;
}

function mapServiceItemToCard(service: ServiceItem): Service {
  const label = normalizeSpecialCtaLabel(service.cta_primary_label);
  const to = service.cta_primary_url || "/contacto";
  const secondaryLabel = service.cta_secondary_label || "Ver disponibilidad";
  const secondaryUrl = service.cta_secondary_url || "/contacto";

  return {
    title: service.etiqueta?.trim() || "Servicio especial",
    subtitle: service.subtitulo?.trim() || service.nombre,
    description: service.descripcion ?? "",
    bullets: service.beneficios ?? [],
    image: resolveImageUrl(service.imagen_url, "/img/oficial_hero.jpeg"),
    ctaPrimary: { label, to },
    ctaSecondary:
      secondaryLabel && secondaryUrl ? { label: secondaryLabel, to: secondaryUrl } : undefined,
  };
}

export default BusinessServicesPage;
