import { useEffect, useMemo, useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

import { listFAQ, type FAQItem } from "@/services/faqApi";

type FAQGroup = {
  categoria: string;
  items: FAQItem[];
};

export const FAQSection = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadFAQs = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listFAQ();
        if (!active) return;
        const ordered = data
          .filter((item) => item.activo !== false)
          .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
        setFaqs(ordered);
        setOpenId(ordered[0]?.id ? String(ordered[0].id) : null);
      } catch (err) {
        if (!active) return;
        setFaqs([]);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las preguntas frecuentes."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadFAQs();

    return () => {
      active = false;
    };
  }, []);

  const groups = useMemo<FAQGroup[]>(() => {
    const byCategory = new Map<string, FAQItem[]>();
    faqs.forEach((item) => {
      const category = item.categoria?.trim() || "General";
      byCategory.set(category, [...(byCategory.get(category) ?? []), item]);
    });
    return Array.from(byCategory.entries()).map(([categoria, items]) => ({
      categoria,
      items,
    }));
  }, [faqs]);

  return (
    <section className="w-full bg-[#fffaf7]">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 2xl:w-[80%] 2xl:max-w-none">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="premium-kicker">Preguntas frecuentes</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#3b302c] min-[390px]:text-3xl sm:text-4xl">
              Resuelve tus dudas antes de reservar
            </h2>
            <p className="mt-4 text-[#6d554b]">
              Información clara sobre tratamientos, agenda y cuidados para que
              llegues con tranquilidad a tu sesión.
            </p>
          </div>

          <div className="grid gap-4">
            {loading ? (
              <StateBox text="Cargando preguntas frecuentes..." />
            ) : error ? (
              <StateBox text={error} tone="error" />
            ) : groups.length === 0 ? (
              <StateBox text="No hay preguntas frecuentes registradas." />
            ) : (
              groups.map((group) => (
                <div key={group.categoria} className="grid gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[#9b6f5f]">
                    {group.categoria}
                  </h3>
                  {group.items.map((item) => {
                    const itemId = String(item.id);
                    const isOpen = openId === itemId;
                    return (
                      <article
                        key={itemId}
                        className="premium-card rounded-2xl"
                      >
                        <button
                          type="button"
                          className="flex min-h-14 w-full items-center justify-between gap-3 p-4 text-left sm:gap-4 sm:p-5"
                          onClick={() => setOpenId(isOpen ? null : itemId)}
                        >
                          <span className="flex items-start gap-3">
                            <HelpCircle className="mt-0.5 h-5 w-5 text-[#b98975]" />
                            <span className="font-semibold text-[#3b302c]">
                              {item.pregunta}
                            </span>
                          </span>
                          <ChevronDown
                            className={`h-5 w-5 text-[#a8968d] transition ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {isOpen ? (
                          <div className="border-t border-[#ead3c7] px-5 pb-5 pt-4 text-sm leading-7 text-[#6d554b]">
                            {item.respuesta}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

function StateBox({ text, tone = "default" }: { text: string; tone?: "default" | "error" }) {
  return (
    <div
      className={`rounded-2xl border p-5 text-sm ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-[#ead3c7] bg-white text-[#7d6a61]"
      }`}
    >
      {text}
    </div>
  );
}

export default FAQSection;
