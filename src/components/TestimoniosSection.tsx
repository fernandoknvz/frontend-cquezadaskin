import { useEffect, useState } from "react";
import { MessageCircle, Star } from "lucide-react";

import {
  listTestimonios,
  type ValoracionPublica,
} from "@/services/clientValoracionesApi";

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  });
};

export const TestimoniosSection = () => {
  const [testimonios, setTestimonios] = useState<ValoracionPublica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadTestimonios = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listTestimonios();
        if (!active) return;
        setTestimonios(data);
      } catch (err) {
        if (!active) return;
        setTestimonios([]);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las valoraciones."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTestimonios();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="w-full bg-[#050505]">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 2xl:w-[80%] 2xl:max-w-none">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="premium-kicker">Valoraciones</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white min-[390px]:text-3xl sm:text-4xl">
              Experiencias de clientes CQuezadaSkin
            </h2>
            <p className="mt-4 text-[#B8B8B8]">
              Opiniones reales revisadas antes de publicarse para mantener un
              espacio confiable y respetuoso.
            </p>
          </div>
        </div>

        {loading ? (
          <StateBox text="Cargando valoraciones..." />
        ) : error ? (
          <StateBox text={error} tone="error" />
        ) : testimonios.length === 0 ? (
          <StateBox text="No hay valoraciones publicadas todavía." />
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {testimonios.map((testimonio) => (
              <article
                key={String(testimonio.id)}
                className="premium-card premium-card-hover flex h-full flex-col rounded-2xl p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">
                      {testimonio.nombre_mostrado}
                    </h3>
                    {formatDate(testimonio.creado_en) ? (
                      <p className="mt-1 text-xs text-[#8E8E8E]">
                        {formatDate(testimonio.creado_en)}
                      </p>
                    ) : null}
                  </div>
                  <StarRating value={testimonio.puntuacion} />
                </div>

                <p className="mt-5 flex-1 text-sm leading-7 text-[#D6D6D6]">
                  {testimonio.comentario}
                </p>

                {testimonio.respuesta_admin ? (
                  <div className="mt-5 rounded-2xl border border-[#00D1C1]/20 bg-[#00D1C1]/10 p-4 text-sm text-[#D6D6D6]">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#20E0D0]">
                      <MessageCircle className="h-4 w-4" />
                      Respuesta CQuezadaSkin
                    </div>
                    {testimonio.respuesta_admin}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} de 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < value ? "fill-[#00D1C1] text-[#00D1C1]" : "text-[#3A3A3A]"
          }`}
        />
      ))}
    </div>
  );
}

function StateBox({ text, tone = "default" }: { text: string; tone?: "default" | "error" }) {
  return (
    <div
      className={`mt-8 rounded-2xl border p-5 text-sm ${
        tone === "error"
          ? "border-red-400/30 bg-red-500/10 text-red-300"
          : "border-white/10 bg-[#121212] text-[#A8A8A8]"
      }`}
    >
      {text}
    </div>
  );
}

export default TestimoniosSection;
