import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, CalendarCheck2, MessageCircle, Sparkles, Heart } from "lucide-react";

import { listServices, type ServiceItem } from "@/services/servicesApi";
import { listServiceCategories, type ServiceCategory } from "@/services/categoriesApi";
import { REAL_SERVICE_CATEGORIES } from "@/features/services/data/realServices";
import { resolveImageUrl } from "@/lib/resolveImageUrl";

const skincareHeroImg = "/img/oficial_hero.jpeg";

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

const STATIC_CATEGORIES: Category[] = [
  ...REAL_SERVICE_CATEGORIES.map((category, index) => {
    const Icon = index % 2 === 0 ? Sparkles : Heart;
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      icon: <Icon className="h-4 w-4" />,
      items: category.services.map((service) => ({
        title: category.name,
        subtitle: service.name,
        description: service.description,
        bullets: [],
        image: skincareHeroImg,
        ctaPrimary: { label: "Agendar", to: "/agendar" },
        ctaSecondary: { label: "Consultar", to: "/contacto" },
      })),
    };
  }),
];

export const PersonalServicesPage: React.FC = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [servicesData, categoriesData] = await Promise.all([
          listServices("servicios"),
          listServiceCategories(),
        ]);
        setServices(servicesData);
        setCategories(categoriesData);
      } catch {
        setServices([]);
        setCategories([]);
      }
    };

    loadData();
  }, []);

  const dynamicCategories = useMemo(() => {
    const visible = services.filter(
      (service) => service.activo !== false && service.mostrar_servicios
    );
    if (visible.length === 0) return null;

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

    const iconPool = [Sparkles, Heart];
    const result: Category[] = [];

    categoryMap.forEach((cat, id) => {
      const items = grouped.get(id);
      if (!items || items.length === 0) return;
      const Icon = iconPool[result.length % iconPool.length] ?? Sparkles;
      result.push({
        id: String(id),
        name: cat.nombre,
        description: cat.descripcion ?? "Selecciona el tratamiento ideal para tu piel.",
        icon: <Icon className="h-4 w-4" />,
        items: items
          .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
          .map((service) => mapServiceItemToCard(service, "servicios")),
      });
    });

    if (withoutCategory.length > 0) {
      result.push({
        id: "otros",
        name: "Otros tratamientos",
        description: "Opciones adicionales disponibles para agendar.",
        icon: <Sparkles className="h-4 w-4" />,
        items: withoutCategory
          .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
          .map((service) => mapServiceItemToCard(service, "servicios")),
      });
    }

    return result.length > 0 ? result : null;
  }, [categories, services]);

  const categoriesToRender = dynamicCategories ?? STATIC_CATEGORIES;
  const filterOptions = [
    { id: "todos", name: "Todos" },
    ...categoriesToRender.map((category) => ({
      id: category.id,
      name: category.name,
    })),
  ];
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const currentId = visibleEntries[0]?.target.getAttribute("data-category-id");

        if (currentId) {
          setSelectedCategory(currentId);
        }
      },
      {
        rootMargin: "-150px 0px -55% 0px",
        threshold: [0.16, 0.28, 0.42],
      }
    );

    categoriesToRender.forEach((category) => {
      const node = sectionRefs.current[category.id];
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [categoriesToRender]);

  useEffect(() => {
    const handleScroll = () => {
      const firstCategory = categoriesToRender[0];
      const firstNode = firstCategory ? sectionRefs.current[firstCategory.id] : null;
      if (firstNode && firstNode.getBoundingClientRect().top > 210) {
        setSelectedCategory("todos");
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categoriesToRender]);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);

    if (categoryId === "todos") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const node = sectionRefs.current[categoryId];
    if (!node) return;

    const offset = 140;
    const top = node.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <section className="mx-auto w-[92%] max-w-[1180px] py-10 sm:py-14">
      <header className="max-w-3xl scroll-mt-32">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#c69a86]">
          Servicios
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white min-[390px]:text-4xl md:text-5xl">
          Tratamientos reales CQUEZADASKIN
        </h1>
        <p className="mt-3 text-base text-[#6d554b] sm:text-lg">
          Explora la carta de tratamientos faciales, corporales, lash & brows,
          fibroblast y camuflajes estéticos en Quilpué.
        </p>
      </header>

      <div className="sticky top-16 z-40 -mx-4 mt-8 border-y border-white/10 bg-[#fffaf7]/86 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-2xl sm:border sm:bg-[#fffaf7]/78">
        <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filterOptions.map((option) => {
            const active = selectedCategory === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleCategoryClick(option.id)}
                className={[
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c69a86]/50",
                  active
                    ? "border-[#c69a86]/60 bg-[#c69a86]/12 text-[#e8c2b5] shadow-[0_0_24px_rgba(198,154,134,0.14)]"
                    : "border-white/10 bg-[#ffffff]/80 text-[#6d554b] hover:border-[#c69a86]/40 hover:text-white",
                ].join(" ")}
              >
                {option.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-10 space-y-16 sm:mt-12 sm:space-y-24">
        {categoriesToRender.map((category) => (
          <CategoryBlock
            key={category.id}
            category={category}
            setSectionRef={(node) => {
              sectionRefs.current[category.id] = node;
            }}
          />
        ))}
      </div>
    </section>
  );
};

function CategoryBlock({
  category,
  setSectionRef,
}: {
  category: Category;
  setSectionRef: (node: HTMLElement | null) => void;
}) {
  return (
    <section
      ref={setSectionRef}
      data-category-id={category.id}
      className="scroll-mt-36"
    >
      <div className="flex items-start gap-3">
        <div className="inline-flex items-center justify-center rounded-2xl border border-[#c69a86]/25 bg-[#c69a86]/10 p-2 text-[#c69a86] shadow-[0_0_24px_rgba(198,154,134,0.10)]">
          {category.icon}
        </div>

        <div className="min-w-0">
          <h2 className="premium-section-title text-2xl font-semibold min-[390px]:text-3xl">
            {category.name}
          </h2>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-[#6d554b]">
            {category.description}
          </p>
        </div>
      </div>

      <motion.div
        className="mt-8 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.12 }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.07 } },
        }}
      >
        {category.items.map((service) => (
          <ServiceRow
            key={`${category.id}-${service.subtitle}`}
            service={service}
          />
        ))}
      </motion.div>
    </section>
  );
}

function ServiceRow({ service }: { service: Service }) {
  return (
    <motion.article
      className="premium-card premium-card-hover flex h-full min-h-[340px] flex-col rounded-2xl p-5 sm:min-h-[390px] sm:rounded-3xl sm:p-6"
      variants={{
        hidden: { opacity: 0, y: 18 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      whileHover={{ y: -5, scale: 1.015 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div className="content flex h-full flex-col">
        <div className="inline-flex w-fit items-center rounded-full border border-[#c69a86]/25 bg-[#c69a86]/10 px-3 py-1 text-xs font-semibold text-[#e8c2b5]">
          {service.title}
        </div>

        <h3 className="mt-4 text-2xl font-semibold leading-tight text-white">
          {service.subtitle}
        </h3>

        <p className="mt-3 flex-1 text-sm leading-7 text-[#6d554b]">
          {service.description}
        </p>

        {service.bullets.length > 0 ? (
          <ul className="mt-5 space-y-2">
            {service.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2 text-sm text-[#6d554b]">
                <Check className="mt-0.5 h-4 w-4 text-[#c69a86]" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex flex-col gap-3 pt-6">
          <Button
            asChild
            className="w-full rounded-2xl bg-[#f1d5cc] text-[#4b3932] shadow-sm hover:bg-[#e8c2b5]"
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
              className="w-full rounded-2xl"
            >
              <Link to={service.ctaSecondary.to} className="gap-2">
                <MessageCircle className="h-4 w-4" />
                {service.ctaSecondary.label}
              </Link>
            </Button>
          )}
        </div>

        <div className="mt-3 text-xs leading-relaxed text-[#a8968d]">
          * Disponibilidad sujeta a evaluación y agenda.
        </div>
      </div>
    </motion.article>
  );
}

export default PersonalServicesPage;

function mapServiceItemToCard(service: ServiceItem, context: "servicios" | "empresas"): Service {
  const label =
    service.cta_primary_label ||
    (context === "empresas" ? "Cotizar ahora" : "Agendar");
  const to =
    service.cta_primary_url || (context === "empresas" ? "/empresas" : "/agendar");
  const secondaryLabel =
    service.cta_secondary_label ||
    (context === "empresas" ? "Hablar por WhatsApp" : "Ver disponibilidad");
  const secondaryUrl =
    service.cta_secondary_url || (context === "empresas" ? "/contacto" : "/agendar");

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
