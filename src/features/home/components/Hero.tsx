import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChevronRight, MapPin, Sparkles } from "lucide-react";
import { listHomeContent, type HomeContentItem } from "@/services/homeContentApi";
import fallbackHero from "@/assets/cquezadaskin-hero.png";

export const Hero: React.FC = () => {
  const [homeContent, setHomeContent] = useState<HomeContentItem | null>(null);
  const [bgOverride, setBgOverride] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const data = await listHomeContent();
        setHomeContent(data.length > 0 ? data[0] : null);
      } catch {
        setHomeContent(null);
      }
    };
    loadContent();
  }, []);

  const bgSrc = useMemo(() => {
    if (bgOverride) return bgOverride;
    const url = (homeContent?.imagen_url ?? "").trim();
    return url ? url : fallbackHero;
  }, [bgOverride, homeContent?.imagen_url]);

  return (
    <section className="relative min-h-[88svh] w-full overflow-hidden bg-[#050505] sm:min-h-[92vh]">
      <div className="absolute inset-0">
        <img
          src={bgSrc}
          alt="Home studio de skincare CQuezadaSkin"
          className="absolute inset-0 h-full w-full object-cover object-[62%_center] opacity-90 saturate-[0.9] brightness-[0.92] contrast-[1.04] sm:object-[68%_center] lg:object-center"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          onError={() => {
            if (bgOverride !== fallbackHero) setBgOverride(fallbackHero);
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#050505_0%,rgba(5,5,5,0.92)_22%,rgba(5,5,5,0.68)_45%,rgba(5,5,5,0.18)_78%,rgba(5,5,5,0.06)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.14)_0%,rgba(5,5,5,0)_42%,rgba(5,5,5,0.44)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_28%,rgba(0,209,193,0.08),transparent_20rem)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,rgba(5,5,5,0)_0%,#050505_100%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[88svh] w-[92%] max-w-7xl items-center py-12 sm:min-h-[92vh] sm:py-20 lg:w-[90%] 2xl:w-[82%]">
        <div className="max-w-2xl">
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-[#111414]/80 px-3 py-2 text-xs font-medium text-[#D6D6D6] shadow-[0_0_30px_rgba(0,209,193,0.08)] backdrop-blur sm:px-4 sm:text-sm">
            <Sparkles className="h-4 w-4 text-[#00D1C1]" />
            <span className="truncate">Skincare profesional en home studio</span>
          </div>

          <h1 className="premium-heading mt-5 max-w-3xl text-4xl font-semibold leading-[0.95] text-white min-[390px]:text-5xl sm:mt-6 sm:text-6xl lg:text-7xl">
            {homeContent?.titulo ?? (
              <>
                CQuezada<span className="text-[#00D1C1]">Skin</span>
              </>
            )}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-[#D6D6D6] sm:text-lg">
            {homeContent?.subtitulo ??
              "Tratamientos faciales y corporales con Constanza Quezada, cosmetóloga y esteticista. Limpiezas faciales, microneedling y cuidado de la piel en Quilpué."}
          </p>

          <div className="mt-6 flex flex-wrap gap-2 text-xs text-[#D6D6D6] sm:text-sm">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#111414]/70 px-3 py-1.5">
              <MapPin className="h-4 w-4 text-[#00D1C1]" />
              Quilpué
            </span>
            {["Facial", "Corporal", "Microneedling"].map((label) => (
              <span
                key={label}
                className="rounded-full border border-white/10 bg-[#111414]/70 px-3 py-1.5"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="mt-8 flex w-full flex-col gap-3 sm:mt-9 sm:flex-row">
            <Button
              asChild
              className="h-12 rounded-2xl bg-[#00D1C1] px-7 text-base font-semibold text-[#03110f] shadow-[0_0_34px_rgba(0,209,193,0.25)] transition hover:bg-[#20E0D0] hover:shadow-[0_0_46px_rgba(0,209,193,0.34)]"
            >
              <Link to="/agendar" className="flex items-center justify-center gap-3">
                <CalendarDays className="h-5 w-5" />
                Reservar ahora
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-12 rounded-2xl border-white/10 bg-[#111414]/80 px-7 text-base font-semibold text-white hover:border-[#00D1C1]/50 hover:bg-[#00D1C1]/10"
            >
              <Link to="/servicios" className="flex items-center justify-center gap-2">
                Ver tratamientos
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
