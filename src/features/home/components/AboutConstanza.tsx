import React from "react";
import constanzaImg from "@/assets/oficial_ceo.jpeg";

export const AboutConstanza: React.FC = () => {
  return (
    <section className="w-full bg-[var(--brand-050)]">
      <div className="mx-auto grid w-[92%] max-w-6xl items-center gap-10 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 2xl:w-[80%] 2xl:max-w-none">
        <div className="relative mx-auto w-full max-w-[34rem] overflow-hidden rounded-[1.25rem] border border-[var(--brand-100)] bg-white shadow-[var(--shadow-panel)]">
          <div
            aria-hidden="true"
            className="brand-wordmark pointer-events-none absolute bottom-5 right-4 z-10 text-right text-[clamp(1.85rem,6.6vw,4.8rem)] font-semibold leading-[0.82] text-[#F5F4F4] opacity-45 sm:bottom-7 sm:right-6"
            style={{ textShadow: "0 2px 18px rgba(0,0,0,0.25)" }}
          >
            THE
            <br />
            CEO
          </div>
          <img
            src={constanzaImg}
            alt="Constanza Quezada, fundadora de CQUEZADASKIN"
            className="aspect-[4/5] h-full w-full object-cover object-center"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,rgba(63,62,67,0)_0%,rgba(63,62,67,0.24)_100%)]" />
        </div>

        <div className="mx-auto max-w-2xl lg:mx-0">
          <p className="premium-kicker">Sobre mí</p>
          <h2 className="premium-heading mt-3 text-4xl font-semibold leading-none text-[#3b302c] sm:text-5xl">
            CONSTANZA QUEZADA
          </h2>
          <p className="mt-4 text-base font-semibold text-[var(--brand-800)] sm:text-lg">
            Fundadora & Especialista en Estética Integral
          </p>

          <div className="mt-7 space-y-5 text-base leading-8 text-[var(--brand-800)] sm:text-lg">
            <p>
              Constanza Quezada es cosmetóloga y especialista en estética integral,
              dedicada al cuidado de la piel y al bienestar de la mujer desde el
              año 2017.
            </p>
            <p>
              Su enfoque combina conocimiento técnico, evaluación personalizada y
              tratamientos basados en las necesidades reales de cada paciente,
              entendiendo que una piel saludable es parte fundamental de la
              confianza y el bienestar personal.
            </p>
            <p className="font-semibold text-[var(--brand-900)]">
              Porque cuidar la piel no es solo una cuestión estética; es una
              forma de bienestar, confianza y amor propio.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutConstanza;
