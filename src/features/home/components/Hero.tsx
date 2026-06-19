import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarCheck2, ChevronRight, MapPin, Sparkles } from "lucide-react";
import { listHomeContent, type HomeContentItem } from "@/services/homeContentApi";

const fallbackHero = "/img/oficial_hero.jpeg";
const fallbackContent = {
  titulo: "CQUEZADASKIN",
  subtitulo:
    "Tratamientos faciales y corporales personalizados en un espacio profesional, cálido y enfocado en el bienestar de tu piel.",
};

export const Hero: React.FC = () => {
  const [homeContent, setHomeContent] = useState<HomeContentItem | null>(null);
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [bgOverride, setBgOverride] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const data = await listHomeContent();
        setHomeContent(data.length > 0 ? data[0] : null);
      } catch {
        setHomeContent(null);
      } finally {
        setIsContentLoading(false);
      }
    };
    loadContent();
  }, []);

  useEffect(() => {
    setBgOverride(null);
  }, [homeContent?.imagen_url]);

  const bgSrc = useMemo(() => {
    if (isContentLoading) return "";
    if (bgOverride) return bgOverride;
    const url = (homeContent?.imagen_url ?? "").trim();
    return url ? url : fallbackHero;
  }, [bgOverride, homeContent?.imagen_url, isContentLoading]);

  const content = {
    titulo: homeContent?.titulo?.trim() || fallbackContent.titulo,
    subtitulo: homeContent?.subtitulo?.trim() || fallbackContent.subtitulo,
  };

  return (
    <section className="relative min-h-[84svh] w-full overflow-hidden bg-[#fffaf7] sm:min-h-[88vh]">
      <div className="absolute inset-0">
        {bgSrc ? (
          <img
            src={bgSrc}
            alt="Home studio de skincare CQUEZADASKIN"
            className="absolute inset-0 h-full w-full object-cover object-[58%_center] saturate-[0.92] brightness-[1.02] contrast-[0.98] sm:object-[62%_center] lg:object-center"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onError={() => {
              if (bgOverride !== fallbackHero) setBgOverride(fallbackHero);
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,250,247,0.98)_0%,rgba(255,250,247,0.88)_32%,rgba(255,250,247,0.32)_66%,rgba(255,250,247,0.08)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,250,247,0.22)_0%,rgba(255,250,247,0)_52%,rgba(255,250,247,0.82)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(255,250,247,0)_0%,#fffaf7_100%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[84svh] w-[92%] max-w-7xl items-center py-12 sm:min-h-[88vh] sm:py-20 lg:w-[90%] 2xl:w-[82%]">
        <div className="max-w-2xl">
          {isContentLoading ? (
            <HeroSkeleton />
          ) : (
            <>
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#ead3c7] bg-white/78 px-3 py-2 text-xs font-medium text-[#6d554b] shadow-[0_18px_50px_rgba(80,55,45,0.08)] backdrop-blur sm:px-4 sm:text-sm">
                <Sparkles className="h-4 w-4 text-[#b98975]" />
                <span className="truncate">Skincare profesional en home studio</span>
              </div>

              <h1 className="brand-wordmark mt-5 max-w-3xl text-4xl font-semibold leading-[0.95] text-[var(--brand-900)] min-[390px]:text-5xl sm:mt-6 sm:text-6xl lg:text-7xl">
                {content.titulo}
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-[#6d554b] sm:text-lg">
                {content.subtitulo}
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-xs text-[#6d554b] sm:text-sm">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#ead3c7] bg-white/72 px-3 py-1.5">
                  <MapPin className="h-4 w-4 text-[#b98975]" />
                  Quilpué
                </span>
                {["Facial", "Corporal", "Microneedling"].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-[#ead3c7] bg-white/72 px-3 py-1.5"
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex w-full flex-col gap-3 sm:mt-9 sm:flex-row">
                <Button
                  asChild
                  className="h-12 rounded-2xl bg-[#f1d5cc] px-7 text-base font-semibold text-[#4b3932] shadow-[0_18px_44px_rgba(198,154,134,0.24)] transition hover:bg-[#e8c2b5] focus-visible:ring-[#c69a86]/40"
                >
                  <Link to="/agendar" className="flex items-center justify-center gap-3">
                    <CalendarCheck2 className="h-5 w-5" />
                    Reservar ahora
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-2xl border-[#d9b8a8] bg-white/76 px-7 text-base font-semibold text-[#4b3932] hover:border-[#b98975] hover:bg-[#f8eee8]"
                >
                  <Link to="/servicios" className="flex items-center justify-center gap-2">
                    Ver tratamientos
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;

function HeroSkeleton() {
  return (
    <div className="w-full max-w-2xl animate-pulse" aria-hidden="true">
      <div className="h-9 w-64 max-w-full rounded-full border border-[#ead3c7] bg-white/70 shadow-[0_18px_50px_rgba(80,55,45,0.06)]" />
      <div className="mt-6 space-y-4">
        <div className="h-14 w-full max-w-[520px] rounded-2xl bg-[#f3e2da]" />
        <div className="h-14 w-4/5 max-w-[430px] rounded-2xl bg-[#f3e2da]" />
      </div>
      <div className="mt-7 space-y-3">
        <div className="h-4 w-full max-w-[540px] rounded-full bg-[#ead3c7]" />
        <div className="h-4 w-5/6 max-w-[460px] rounded-full bg-[#ead3c7]" />
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <div className="h-9 w-24 rounded-full bg-white/70" />
        <div className="h-9 w-24 rounded-full bg-white/70" />
        <div className="h-9 w-32 rounded-full bg-white/70" />
      </div>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <div className="h-12 w-full rounded-2xl bg-[#f1d5cc] sm:w-44" />
        <div className="h-12 w-full rounded-2xl border border-[#d9b8a8] bg-white/70 sm:w-44" />
      </div>
    </div>
  );
}
