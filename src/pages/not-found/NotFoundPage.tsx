import { Link } from "react-router-dom";
import { ArrowLeft, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export const NotFoundPage = () => {
  return (
    <section className="mx-auto flex min-h-[62vh] w-[92%] max-w-4xl items-center py-14">
      <div className="premium-panel w-full rounded-3xl p-8 text-center sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#00D1C1]/30 bg-[#00D1C1]/10 text-[#00D1C1]">
          <SearchX className="h-7 w-7" />
        </div>
        <p className="premium-kicker mt-6">404</p>
        <h1 className="premium-heading mt-3 text-4xl font-semibold text-white sm:text-5xl">
          Página no encontrada
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#D6D6D6] sm:text-base">
          La ruta que buscas no existe o fue movida. Puedes volver al inicio y
          continuar navegando por CQuezadaSkin.
        </p>
        <Button
          asChild
          className="mt-7 rounded-2xl bg-[#00D1C1] font-semibold text-[#03110f] hover:bg-[#20E0D0]"
        >
          <Link to="/" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default NotFoundPage;
