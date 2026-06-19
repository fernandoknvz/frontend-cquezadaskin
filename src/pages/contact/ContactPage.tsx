import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { siteConfig } from "@/config/site";
import { sendContactRequest } from "@/services/contactApi";
import {
  Building2,
  User,
  ArrowLeft,
  Send,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

// Types
type FormMode = "company" | null;

interface CompanyFormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  message: string;
}

// Hooks
const useFormNavigation = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<FormMode>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetMode = useCallback(() => {
    setMode(null);
    setIsSubmitting(false);
  }, []);

  const goHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return { mode, setMode, isSubmitting, setIsSubmitting, resetMode, goHome };
};

const useSuccessMessage = () => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const showSuccess = useCallback(
    (message: string) => {
      setErrorMessage(null);
      setSuccessMessage(message);
    },
    []
  );
  const showError = useCallback(
    (message: string) => {
      setSuccessMessage(null);
      setErrorMessage(message);
    },
    []
  );
  const clearSuccess = useCallback(() => setSuccessMessage(null), []);
  const clearError = useCallback(() => setErrorMessage(null), []);
  return { successMessage, errorMessage, showSuccess, showError, clearSuccess, clearError };
};

// Small UI helper
function SectionShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto w-full">
      <div className="mx-auto w-[92%] max-w-6xl py-10 sm:py-12 lg:py-14 2xl:w-[80%] 2xl:max-w-none">
        {children}
      </div>
    </section>
  );
}

function ClickableCard({
  title,
  description,
  icon,
  bullets,
  cta,
  onClick,
  disabled,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  bullets: string[];
  cta: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Card
      className={[
        "rounded-2xl border-white/10 bg-[#ffffff]/80 backdrop-blur sm:rounded-3xl",
        "transition-all duration-300",
        disabled
          ? "opacity-60 pointer-events-none"
          : "cursor-pointer hover:shadow-lg hover:-translate-y-1",
        "group focus-within:ring-2 focus-within:ring-[#c69a86]/30",
      ].join(" ")}
      role="button"
      tabIndex={0}
      aria-disabled={disabled ? "true" : "false"}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl shadow-sm bg-gradient-to-br from-[#f8eee8] to-[#1F1F1F] flex items-center justify-center group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ul className="space-y-2 text-sm text-[#7d6a61]">
          {bullets.map((b) => (
            <li key={b} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              {b}
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button variant="outline" className="w-full rounded-2xl">
          {cta}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Mode Selector
const ModeSelector: React.FC<{
  onSelectCompany: () => void;
  onGoAgendar: () => void;
  disabled?: boolean;
}> = ({ onSelectCompany, onGoAgendar, disabled }) => (
  <div className="mt-10 grid gap-4 md:grid-cols-2">
    <ClickableCard
      title="Consultas especiales"
      description="Consultas sobre tratamientos, evaluaciones o disponibilidad especial."
      icon={<Building2 className="h-6 w-6 text-[#c69a86]" />}
      bullets={[
        "Orientación personalizada",
        "Respuesta cercana",
        `Atención en ${siteConfig.address}`,
      ]}
      cta="Solicitar cotización"
      onClick={onSelectCompany}
      disabled={disabled}
    />

    <ClickableCard
      title="Agenda online"
      description="Reserva limpiezas faciales, microneedling y tratamientos corporales."
      icon={<User className="h-6 w-6 text-[#c69a86]" />}
      bullets={["Facial y corporal", `Home studio en ${siteConfig.address}`, "Horarios disponibles"]}
      cta="Agendar sesión"
      onClick={onGoAgendar}
      disabled={disabled}
    />
  </div>
);

// Company Form
const CompanyForm: React.FC<{
  onSubmit: (data: CompanyFormData) => Promise<boolean>;
  isLoading: boolean;
}> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<CompanyFormData>({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleChange = useCallback(
    (field: keyof CompanyFormData) => (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const canSubmit = useMemo(() => {
    return (
      formData.companyName.trim() &&
      formData.contactName.trim() &&
      formData.email.trim()
    );
  }, [formData.companyName, formData.contactName, formData.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;
    const success = await onSubmit(formData);
    if (success) {
      setFormData({
        companyName: "",
        contactName: "",
        email: "",
        phone: "",
        message: "",
      });
    }
  };

  return (
    <Card className="mt-8 rounded-2xl border-white/10 bg-[#ffffff]/90 backdrop-blur sm:mt-10 sm:rounded-3xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-2xl">Consulta especial</CardTitle>
            <CardDescription className="mt-1">
              Completa el formulario y te contactaremos para coordinar los detalles.
            </CardDescription>
          </div>
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-[#f8eee8] to-[#1F1F1F] flex items-center justify-center">
            <Building2 className="h-6 w-6 text-[#c69a86]" />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Empresa */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Consulta <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleChange("companyName")(e.target.value)}
                placeholder="Motivo de consulta"
                className="rounded-2xl border-white/10 h-12"
                required
                disabled={isLoading}
              />
            </div>

            {/* Contacto */}
            <div className="space-y-2">
              <Label htmlFor="contactName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nombre de contacto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => handleChange("contactName")(e.target.value)}
                placeholder="Tu nombre"
                className="rounded-2xl border-white/10 h-12"
                required
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Correo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email")(e.target.value)}
                placeholder={siteConfig.email}
                className="rounded-2xl border-white/10 h-12"
                required
                disabled={isLoading}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Teléfono
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone")(e.target.value)}
                placeholder="+56 9 4962 8081"
                className="rounded-2xl border-white/10 h-12"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Detalles de la solicitud
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleChange("message")(e.target.value)}
              placeholder="CuÉntanos quÉ tratamiento buscas, fecha tentativa o cualquier duda que tengas."
              className="rounded-2xl border-white/10 min-h-[140px] resize-none"
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-[#7d6a61] space-y-1">
              <p className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Respuesta en 24-48 horas hábiles
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Cotización sin compromiso
              </p>
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#c69a86] to-[#e8c2b5] px-8 shadow-sm hover:from-[#e8c2b5] hover:to-[#f1d5cc] sm:w-auto"
              disabled={!canSubmit || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar solicitud
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Error Alert
const ErrorAlert: React.FC<{ message: string; onClose: () => void }> = ({
  message,
  onClose,
}) => (
  <div className="mt-8">
    <Alert className="rounded-2xl border-red-200 bg-red-50">
      <AlertCircle className="h-5 w-5 text-red-600" />
      <div className="ml-3">
        <AlertTitle className="text-red-800">No pudimos enviar la consulta</AlertTitle>
        <AlertDescription className="text-red-700">{message}</AlertDescription>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="ml-auto h-8 rounded-xl px-3 text-red-700 hover:bg-red-100"
        onClick={onClose}
      >
        Cerrar
      </Button>
    </Alert>
  </div>
);

// Success Alert
const SuccessAlert: React.FC<{ message: string; onClose: () => void }> = ({
  message,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="mt-8">
      <Alert className="rounded-2xl border-green-200 bg-green-50">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <div className="ml-3">
          <AlertTitle className="text-green-800">¡Éxito!</AlertTitle>
          <AlertDescription className="text-green-700">{message}</AlertDescription>
        </div>
      </Alert>
    </div>
  );
};

// Main
export const ContactPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode, setMode, isSubmitting, setIsSubmitting, resetMode, goHome } =
    useFormNavigation();
  const { successMessage, errorMessage, showSuccess, showError, clearError } =
    useSuccessMessage();

  const AGENDAR_PATH = "/agendar";

  const handleGoAgendar = useCallback(() => {
    navigate(AGENDAR_PATH);
  }, [navigate, AGENDAR_PATH]);

  const handleCompanySubmit = async (data: CompanyFormData) => {
    setIsSubmitting(true);
    clearError();

    try {
      const response = await sendContactRequest({
        asunto: data.companyName.trim(),
        nombre: data.contactName.trim(),
        email: data.email.trim(),
        telefono: data.phone.trim(),
        mensaje: data.message.trim(),
      });

      if (!response?.success) {
        showError(response?.message ?? "No pudimos enviar tu consulta en este momento.");
        return false;
      }

      showSuccess(
        response.message || "Solicitud enviada. Te contactaremos para coordinar los detalles."
      );
      return true;
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "No pudimos enviar tu consulta en este momento."
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <SectionShell>
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <header className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-white min-[390px]:text-4xl md:text-5xl">
              Contacto <span className="brand-wordmark">CQUEZADASKIN</span>
            </h1>
            <p className="mt-3 text-lg text-[#6d554b]">
              Agenda tu tratamiento o envíanos una consulta. Estamos aquí para ayudarte.
            </p>
          </header>

          {mode && (
            <Button
              variant="outline"
              className="rounded-2xl border-white/10 bg-[#ffffff]/90 hover:bg-[#ffffff] shadow-sm w-full sm:w-auto"
              onClick={resetMode}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          )}
        </div>

        {/* Success */}
        {successMessage ? (
          <>
            <SuccessAlert message={successMessage} onClose={goHome} />
            <div className="mt-4">
              <Button
                className="rounded-2xl h-12 px-8 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700"
                onClick={goHome}
              >
                Ir al inicio
              </Button>
            </div>
          </>
        ) : (
          <>
            {errorMessage ? (
              <ErrorAlert message={errorMessage} onClose={clearError} />
            ) : null}

            {/* Selector o Form */}
            {!mode ? (
              <ModeSelector
                onSelectCompany={() => setMode("company")}
                onGoAgendar={handleGoAgendar}
                disabled={isSubmitting}
              />
            ) : (
              <CompanyForm onSubmit={handleCompanySubmit} isLoading={isSubmitting} />
            )}

            {/* Footer note */}
            <div className="mt-14 text-center text-sm text-[#8e7a71]">
              <p>
                ¿Necesitas ayuda? Escríbenos a{" "}
                <a
                href={`mailto:${siteConfig.email}`}
                  className="text-[#c69a86] hover:underline"
                >
                  {siteConfig.email}
                </a>{" "}
                o llama al{" "}
                <a href={siteConfig.phoneHref} className="text-[#c69a86] hover:underline">
                  {siteConfig.phone}
                </a>
              </p>
              <p className="mt-2">Horario de atención: {siteConfig.schedule}</p>
            </div>
          </>
        )}
      </SectionShell>
    </div>
  );
};

export default ContactPage;
