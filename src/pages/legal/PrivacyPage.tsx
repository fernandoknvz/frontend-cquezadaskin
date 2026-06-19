import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto w-[90%] 2xl:w-[80%]">
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8 2xl:w-[80%] 2xl:max-w-none">
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl border-[rgba(255,255,255,0.10)] bg-[#ffffff]/90 hover:bg-[#ffffff]"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <header className="mt-6 max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Política de Privacidad
          </h1>
          <p className="mt-3 text-lg text-[#6d554b]">
            Transparencia sobre como usamos la informacion en el sistema de
            agendamiento.
          </p>
        </header>

        <Card className="mt-10 rounded-2xl border-[rgba(255,255,255,0.10)] bg-[#ffffff]/90 shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="text-2xl">Privacidad</CardTitle>
                <CardDescription className="mt-1">
                  Ultima actualizacion: marzo 2026
                </CardDescription>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f8eee8]">
                <ShieldCheck className="h-6 w-6 text-[#c69a86]" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="max-w-none space-y-4 text-[#6d554b] [&_a]:text-[#c69a86] [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:font-semibold [&_h3]:text-white [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-white">
            <h2>1. Responsable del tratamiento de datos</h2>
            <p>
              El presente sitio web es operado por CQUEZADASKIN, servicio de
              cosmetología y estética facial/corporal en Quilpué, Chile.
            </p>
            <p>
              <strong>Contacto:</strong>
              <br />
              <strong>Correo:</strong> {siteConfig.email}
              <br />
              <strong>Teléfono:</strong> {siteConfig.phone}
            </p>

            <h2>2. Datos que recopilamos</h2>
            <ul>
              <li>Nombre</li>
              <li>RUT, como dato obligatorio de identificacion del cliente</li>
              <li>Correo electronico</li>
              <li>Teléfono</li>
              <li>Servicio, fecha, hora y duración de la reserva</li>
            </ul>

            <h2>3. Finalidad del tratamiento</h2>
            <p>Los datos personales se utilizan exclusivamente para:</p>
            <ul>
              <li>Gestionar reservas</li>
              <li>Confirmar solicitudes</li>
              <li>Contactar al cliente</li>
              <li>Coordinar servicios</li>
              <li>Responder consultas</li>
            </ul>

            <h2>4. Confirmaciones y contacto</h2>
            <p>
              Al realizar una reserva, el sistema enviará una confirmación de
              recepcion de la solicitud. Posteriormente, CQUEZADASKIN podra
              contactar al cliente para coordinar la prestacion del servicio.
            </p>

            <h2>5. Proteccion de datos</h2>
            <p>
              Se implementan medidas tecnicas y organizativas razonables para
              proteger los datos personales, incluyendo almacenamiento seguro de
              credenciales y acceso restringido a la informacion.
            </p>

            <h2>6. Uso de cookies</h2>
            <p>
              El sitio utiliza cookies tecnicas necesarias para el funcionamiento
              del sistema. No se utilizan cookies con fines publicitarios.
            </p>

            <h2>7. Derechos del usuario</h2>
            <p>
              El usuario puede solicitar acceso, rectificacion, eliminacion u
              oposición escribiendo a {siteConfig.email}.
            </p>

            <h2>8. Conservacion de datos</h2>
            <p>
              Los datos seran almacenados unicamente durante el tiempo necesario
              para cumplir con la finalidad para la cual fueron recopilados.
            </p>

            <h2>9. Consentimiento</h2>
            <p>
              Al utilizar el sistema de reservas y aceptar los Términos y
              Condiciones y la presente Política de Privacidad, el usuario otorga
              su consentimiento para el tratamiento de sus datos personales.
            </p>

            <h2>10. Legislacion aplicable</h2>
            <p>
              Esta política se rige por la legislación vigente en Chile,
              especialmente la Ley N 19.628 sobre proteccion de la vida privada.
            </p>

            <p className="mt-8 text-sm text-[#7d6a61]">
              Tambien puedes revisar los{" "}
              <Link to="/terminos">Términos y Condiciones</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
