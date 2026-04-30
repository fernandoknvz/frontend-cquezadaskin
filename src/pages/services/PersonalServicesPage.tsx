import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, CalendarDays, MessageCircle, Sparkles, Heart } from "lucide-react";

import skincareHeroImg from "@/assets/cquezadaskin-hero.png";
import { listServices, type ServiceItem } from "@/services/servicesApi";
import { listServiceCategories, type ServiceCategory } from "@/services/categoriesApi";
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
          listServices(),
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
    <section className="mx-auto w-[92%] max-w-[1180px] py-12 sm:py-14">
      <header className="max-w-3xl scroll-mt-32">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#00D1C1]">
          Servicios
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white md:text-5xl">
          Tratamientos reales CQuezadaSkin
        </h1>
        <p className="mt-3 text-lg text-[#C9C9C9]">
          Explora la carta de tratamientos faciales, corporales, lash & brows,
          fibroblast y camuflajes estéticos en Quilpué.
        </p>
      </header>

      <div className="sticky top-16 z-40 -mx-4 mt-8 border-y border-white/10 bg-[#050505]/86 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-2xl sm:border sm:bg-[#050505]/78">
        <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filterOptions.map((option) => {
            const active = selectedCategory === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleCategoryClick(option.id)}
                className={[
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1C1]/50",
                  active
                    ? "border-[#00D1C1]/60 bg-[#00D1C1]/12 text-[#20E0D0] shadow-[0_0_24px_rgba(0,209,193,0.14)]"
                    : "border-white/10 bg-[#111414]/80 text-[#D6D6D6] hover:border-[#00D1C1]/40 hover:text-white",
                ].join(" ")}
              >
                {option.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-12 space-y-20 sm:space-y-24">
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
        <div className="inline-flex items-center justify-center rounded-2xl border border-[#00D1C1]/25 bg-[#00D1C1]/10 p-2 text-[#00D1C1] shadow-[0_0_24px_rgba(0,209,193,0.10)]">
          {category.icon}
        </div>

        <div className="min-w-0">
          <h2 className="premium-section-title text-3xl font-semibold">
            {category.name}
          </h2>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-[#D6D6D6]">
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
      className="premium-card premium-card-hover flex h-full min-h-[390px] flex-col rounded-3xl p-5 sm:p-6"
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
        <div className="inline-flex w-fit items-center rounded-full border border-[#00D1C1]/25 bg-[#00D1C1]/10 px-3 py-1 text-xs font-semibold text-[#20E0D0]">
          {service.title}
        </div>

        <h3 className="mt-4 text-2xl font-semibold leading-tight text-white">
          {service.subtitle}
        </h3>

        <p className="mt-3 flex-1 text-sm leading-7 text-[#D6D6D6]">
          {service.description}
        </p>

        {service.bullets.length > 0 ? (
          <ul className="mt-5 space-y-2">
            {service.bullets.map((bullet) => (
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
            className="rounded-2xl bg-[#00D1C1] text-[#03110f] shadow-sm hover:bg-[#20E0D0]"
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
              className="rounded-2xl"
            >
              <Link to={service.ctaSecondary.to} className="gap-2">
                <MessageCircle className="h-4 w-4" />
                {service.ctaSecondary.label}
              </Link>
            </Button>
          )}
        </div>

        <div className="mt-3 text-xs leading-relaxed text-[#A8A8A8]">
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
    image: service.imagen_url || skincareHeroImg,
    ctaPrimary: { label, to },
    ctaSecondary:
      secondaryLabel && secondaryUrl ? { label: secondaryLabel, to: secondaryUrl } : undefined,
  };
}
