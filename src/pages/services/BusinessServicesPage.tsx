import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, CalendarCheck2, CalendarDays, MessageCircle, Building2, Users, Sparkles } from "lucide-react";

import { listServices, type ServiceItem } from "@/services/servicesApi";
import { listServiceCategories, type ServiceCategory } from "@/services/categoriesApi";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import { getWhatsAppUrl } from "@/lib/whatsapp";

const fallbackHeroImg = "/img/oficial_hero.jpeg";

type Service = {
  title: string; // etiqueta (Tratamiento / Plan / Beneficio)
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

const STATIC_CATEGORIES: Category[] = [
  {
    id: "corporate",
    name: "Tratamientos para grupos",
    description:
      "Opciones para pequeños grupos, regalos y jornadas de autocuidado.",
    icon: <Building2 className="h-4 w-4" />,
    items: [
      {
        title: "Tratamiento",
        subtitle: "Facial express",
        description:
          "Atención breve enfocada en luminosidad e hidratación para jornadas de autocuidado o regalos especiales.",
        bullets: [
          "Formato simple de coordinar",
          "Experiencia limpia y cercana",
          "Orientación básica de cuidado",
          "Ideal para grupos pequeños",
        ],
        image: fallbackHeroImg,
        ctaPrimary: { label: "Consultar jornada", to: "/contacto" },
        ctaSecondary: { label: "Hablar por WhatsApp", to: "/contacto" },
      },
      {
        title: "Tratamiento",
        subtitle: "Pausa de cuidado facial",
        description:
          "Una pausa de cuidado facial para conectar con la piel y recibir recomendaciones cosmetológicas.",
        bullets: [
          "Cuidado facial personalizado",
          "Ambiente cálido",
          "Recomendaciones prácticas",
          "Perfecto para fechas especiales",
        ],
        image: fallbackHeroImg,
        ctaPrimary: { label: "Solicitar información", to: "/empresas" },
        ctaSecondary: { label: "Consultar disponibilidad", to: "/contacto" },
      },
    ],
  },
  {
    id: "events",
    name: "Jornadas especiales",
    description:
      "Ideal para celebraciones, fechas especiales o instancias de autocuidado coordinadas previamente.",
    icon: <Sparkles className="h-4 w-4" />,
    items: [
      {
        title: "Tratamiento",
        subtitle: "Evaluación estética grupal",
        description:
          "Orientación grupal para resolver dudas, detectar necesidades y recomendar tratamientos adecuados.",
        bullets: [
          "Evaluación general de necesidades",
          "Recomendaciones de rutina",
          "Formato educativo y cercano",
          "Coordinación según agenda",
        ],
        image: fallbackHeroImg,
        ctaPrimary: { label: "Consultar fecha", to: "/empresas" },
        ctaSecondary: { label: "Hablar por WhatsApp", to: "/contacto" },
      },
    ],
  },
  {
    id: "benefits",
    name: "Giftcards y regalos",
    description:
      "Giftcards de cuidado facial: un regalo útil, cuidado y fácil de coordinar.",
    icon: <Users className="h-4 w-4" />,
    items: [
      {
        title: "Giftcard de cuidado facial",
        subtitle: "Para colaboradores",
        description:
          "Regala una experiencia de cuidado facial o corporal con coordinacion simple por contacto.",
        bullets: [
          "Regalo util y memorable",
          "Perfecto para fechas especiales",
          "Coordinacion simple",
          "Experiencia premium y calida",
        ],
        image: fallbackHeroImg,
        ctaPrimary: { label: "Consultar giftcards", to: "/empresas" },
        ctaSecondary: { label: "Consultar", to: "/contacto" },
      },
    ],
  },
];

export const BusinessServicesPage: React.FC = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [specialServices, setSpecialServices] = useState<ServiceItem[]>([]);
  const [businessServices, setBusinessServices] = useState<ServiceItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [specialServicesData, businessServicesData, categoriesData] = await Promise.all([
          listServices("especiales"),
          listServices("empresas"),
          listServiceCategories(),
        ]);
        setSpecialServices(specialServicesData);
        setBusinessServices(businessServicesData);
        setCategories(categoriesData);
      } catch {
        setSpecialServices([]);
        setBusinessServices([]);
        setCategories([]);
      }
    };

    loadData();
  }, []);

  const specialCategories = useMemo(() => {
    const visible = specialServices.filter(
      (service) => service.activo !== false && service.mostrar_especiales
    );
    return buildDynamicCategories(visible, categories, "especiales");
  }, [categories, specialServices]);

  const businessCategories = useMemo(() => {
    const visible = businessServices.filter(
      (service) => service.activo !== false && service.mostrar_empresas
    );
    return buildDynamicCategories(visible, categories, "empresas");
  }, [businessServices, categories]);

  const hasDynamicContent = Boolean(specialCategories || businessCategories);

  const categoriesToRender = specialCategories ?? businessCategories ?? STATIC_CATEGORIES;

  return (
    <section className="mx-auto w-[92%] 2xl:w-[80%]">
      <div className="w-full">
        <div className="mx-auto w-full max-w-6xl py-10 sm:py-12 lg:py-14 2xl:w-[80%] 2xl:max-w-none">
          <header className="max-w-2xl">
            <h1 className="mb-4 text-3xl font-bold tracking-tight text-white min-[390px]:text-4xl md:text-5xl">
              Atenciones especiales
            </h1>
            <p className="mt-2 text-base text-[#6d554b] sm:text-lg">
              Tratamientos para grupos, activaciones y beneficios para colaboradores. Cotiza por jornada,
              cantidad de personas y tipo de tratamiento.
            </p>
          </header>

          <div className="mt-10 space-y-14">
            {hasDynamicContent ? (
              <>
                {specialCategories ? (
                  <ServiceSection title="Especiales" categories={specialCategories} />
                ) : null}
                {businessCategories ? (
                  <ServiceSection title="Empresas" categories={businessCategories} />
                ) : null}
              </>
            ) : (
              <ServiceSection categories={categoriesToRender} />
            )}
          </div>

          <div className="mt-12 rounded-2xl border border-white/10 bg-[#ffffff]/80 p-4 text-sm text-[#6d554b] sm:rounded-3xl sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div
                className="mt-0.5 rounded-2xl p-2"
                style={{ backgroundColor: "rgba(246,231,223,0.85)" }}
              >
                <CalendarDays className="h-4 w-4" style={{ color: "var(--brand-800)" }} />
              </div>
              <div>
                <div className="font-semibold text-white">Cómo coordinamos</div>
                <p className="mt-1">
                  Nos indicas fecha tentativa, número de personas y tipo de tratamiento. Te enviamos una
                  propuesta clara (duración, logística y valores).
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    className="w-full rounded-2xl shadow-sm sm:w-auto"
                    style={{ backgroundColor: "var(--brand-800)", color: "var(--brand-white)" }}
                  >
                    <Link to="/contacto" className="gap-2">
                      <Building2 className="h-4 w-4" />
                      Cotizar ahora
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
        </div>
      </div>
    </section>
  );
};

function buildDynamicCategories(
  visible: ServiceItem[],
  categories: ServiceCategory[],
  context: "especiales" | "empresas"
) {
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

    const iconPool = [Building2, Sparkles, Users];
    const result: Category[] = [];

    categoryMap.forEach((cat, id) => {
      const items = grouped.get(id);
      if (!items || items.length === 0) return;
      const Icon = iconPool[result.length % iconPool.length] ?? Building2;
      result.push({
        id: String(id),
        name: cat.nombre,
        description:
          cat.descripcion ??
          "Experiencias de bienestar pensadas para equipos, eventos y beneficios corporativos.",
        icon: <Icon className="h-4 w-4" />,
        items: items
          .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
          .map((service) => mapServiceItemToCard(service, context)),
      });
    });

    if (withoutCategory.length > 0) {
      result.push({
        id: "otros",
        name: "Otros servicios",
        description: "Opciones corporativas adicionales disponibles.",
        icon: <Sparkles className="h-4 w-4" />,
        items: withoutCategory
          .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
          .map((service) => mapServiceItemToCard(service, context)),
      });
    }

    return result.length > 0 ? result : null;
}

function ServiceSection({ title, categories }: { title?: string; categories: Category[] }) {
  return (
    <div className="space-y-12 sm:space-y-14">
      {title ? (
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
      ) : null}
      {categories.map((cat) => (
        <CategoryBlock key={`${title ?? "section"}-${cat.id}`} category={cat} />
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
  const primaryTo =
    service.ctaPrimary.to === "/empresas" ? "/contacto" : service.ctaPrimary.to;

  return (
    <div
      className={[
        "grid items-center gap-8 lg:gap-10",
        "grid-cols-1 lg:grid-cols-2",
        reverse ? "lg:[&_.media]:order-2 lg:[&_.content]:order-1" : "",
      ].join(" ")}
    >
      {/* Imagen */}
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

      {/* Texto */}
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
            <Link to={primaryTo} className="gap-2">
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
          * Horarios y disponibilidad pueden variar según agenda.
        </div>
      </div>
    </div>
  );
}

export default BusinessServicesPage;

function mapServiceItemToCard(service: ServiceItem, context: "especiales" | "empresas"): Service {
  const label =
    service.cta_primary_label ||
    (context === "empresas" ? "Cotizar ahora" : "Consultar especial");
  const to = service.cta_primary_url || "/contacto";
  const secondaryLabel =
    service.cta_secondary_label ||
    (context === "empresas" ? "Hablar por WhatsApp" : "Ver disponibilidad");
  const secondaryUrl =
    service.cta_secondary_url || (context === "empresas" ? "/contacto" : "/contacto");

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
