import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto w-[90%] 2xl:w-[80%]">
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8 2xl:w-[80%] 2xl:max-w-none">
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl border-[rgba(255,255,255,0.10)] bg-[#121212]/90 hover:bg-[#121212]"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <header className="mt-6 max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Términos y Condiciones
          </h1>
          <p className="mt-3 text-lg text-[#C9C9C9]">
            Reglas de uso del sitio y del sistema de reservas.
          </p>
        </header>

        <Card className="mt-10 rounded-2xl border-[rgba(255,255,255,0.10)] bg-[#121212]/90 shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="text-2xl">Términos</CardTitle>
                <CardDescription className="mt-1">
                  Ultima actualizacion: marzo 2026
                </CardDescription>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#181818]">
                <FileText className="h-6 w-6 text-[#00D1C1]" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="max-w-none space-y-4 text-[#C9C9C9] [&_a]:text-[#00D1C1] [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-white">
            <h2>1. Uso del sitio</h2>
            <p>
              El sitio web de CQuezadaSkin permite a los usuarios agendar
              tratamientos faciales y corporales, solicitar servicios y obtener
              informacion sobre las atenciones ofrecidas.
            </p>

            <h2>2. Reservas</h2>
            <p>
              Las reservas realizadas a traves del sistema estan sujetas a
              disponibilidad y deben completarse con informacion veridica.
            </p>
            <p>
              Una vez enviada la solicitud, el usuario recibirá una confirmación
              de recepcion. La reserva quedara en estado solicitada y sera
              posteriormente confirmada por CQuezadaSkin.
            </p>

            <h2>3. Confirmacion y contacto</h2>
            <p>
              CQuezadaSkin podra contactar al cliente via correo electronico,
              teléfono o WhatsApp para coordinar detalles del servicio. La
              confirmación final se realizará de forma manual.
            </p>

            <h2>4. Política de cancelación</h2>
            <p>
              Las reservas pueden cancelarse con al menos 24 horas de
              anticipacion a la hora programada.
            </p>

            <h2>5. Pagos</h2>
            <p>
              El sitio web no procesa pagos en linea. Las condiciones de pago
              seran coordinadas directamente entre el cliente y CQuezadaSkin.
            </p>

            <h2>6. Responsabilidad del usuario</h2>
            <ul>
              <li>Proporcionar informacion veridica.</li>
              <li>Respetar los horarios agendados.</li>
              <li>Informar cancelaciones con anticipación.</li>
            </ul>

            <h2>7. Lugar de atencion</h2>
            <p>
              Los servicios se realizan en home studio en Quilpué, salvo que
              CQuezadaSkin indique expresamente otra modalidad.
            </p>

            <h2>8. Modificaciones</h2>
            <p>
              CQuezadaSkin se reserva el derecho de modificar estos terminos en
              cualquier momento. Las modificaciones seran publicadas en el sitio
              web.
            </p>

            <h2>9. Legislacion aplicable</h2>
            <p>
              Estos terminos se rigen por la legislacion vigente en la Republica
              de Chile.
            </p>

            <p className="mt-8 text-sm text-[#B8B8B8]">
              Tambien puedes revisar la{" "}
              <Link to="/privacidad">Política de Privacidad</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
