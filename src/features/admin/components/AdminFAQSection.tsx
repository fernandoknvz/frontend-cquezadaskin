import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";

import { AppModal } from "@/components/ui/AppModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createFAQAdmin,
  deleteFAQAdmin,
  listFAQAdmin,
  patchFAQAdmin,
  type AdminFAQPayload,
} from "@/services/adminFaqApi";
import type { FAQItem } from "@/services/faqApi";

type FAQFormState = {
  id?: string;
  pregunta: string;
  respuesta: string;
  categoria: string;
  orden: string;
  activo: boolean;
};

const emptyForm: FAQFormState = {
  pregunta: "",
  respuesta: "",
  categoria: "",
  orden: "0",
  activo: true,
};

const mapToForm = (faq: FAQItem): FAQFormState => ({
  id: String(faq.id),
  pregunta: faq.pregunta ?? "",
  respuesta: faq.respuesta ?? "",
  categoria: faq.categoria ?? "",
  orden: String(faq.orden ?? 0),
  activo: faq.activo !== false,
});

export const AdminFAQSection = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [form, setForm] = useState<FAQFormState>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEditing = useMemo(() => Boolean(form.id), [form.id]);

  const loadFAQs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listFAQAdmin();
      setFaqs(data.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar FAQ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFAQs();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setFormOpen(false);
    setError(null);
  };

  const handleChange = (field: keyof FAQFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!form.pregunta.trim() || !form.respuesta.trim()) {
      setError("Pregunta y respuesta son obligatorias");
      return;
    }

    const payload: AdminFAQPayload = {
      pregunta: form.pregunta.trim(),
      respuesta: form.respuesta.trim(),
      categoria: form.categoria.trim() || null,
      orden: Number(form.orden) || 0,
      activo: form.activo,
    };

    setSaving(true);
    try {
      if (form.id) {
        await patchFAQAdmin(form.id, payload);
        setMessage("FAQ actualizada correctamente.");
      } else {
        await createFAQAdmin(payload);
        setMessage("FAQ creada correctamente.");
      }
      setForm(emptyForm);
      setFormOpen(false);
      await loadFAQs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar FAQ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!window.confirm("Eliminar esta FAQ?")) return;
    setError(null);
    setMessage(null);
    try {
      await deleteFAQAdmin(id);
      setMessage("FAQ eliminada correctamente.");
      await loadFAQs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar FAQ");
    }
  };

  const handleToggleActive = async (faq: FAQItem) => {
    setError(null);
    setMessage(null);
    try {
      await patchFAQAdmin(faq.id, {
        pregunta: faq.pregunta,
        respuesta: faq.respuesta,
        categoria: faq.categoria ?? null,
        orden: faq.orden ?? 0,
        activo: faq.activo === false,
      });
      setMessage("FAQ actualizada correctamente.");
      await loadFAQs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar FAQ");
    }
  };

  return (
    <section className="premium-panel rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="premium-section-title text-3xl font-semibold">FAQ</h2>
          <p className="mt-1 text-sm text-[#6d554b]">
            Gestiona las preguntas frecuentes visibles en el sitio.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="rounded-2xl bg-[#c69a86] text-[#4b3932] hover:bg-[#e8c2b5]"
            onClick={() => {
              setForm(emptyForm);
              setFormOpen(true);
            }}
          >
            Crear FAQ
          </Button>
          <Button variant="outline" onClick={loadFAQs} disabled={loading}>
            Actualizar lista
          </Button>
        </div>
      </div>

      <AppModal
        open={formOpen}
        title={isEditing ? "Editar FAQ" : "Crear FAQ"}
        description="Gestiona una pregunta frecuente visible para clientes."
        onOpenChange={(open) => {
          if (!open) resetForm();
          else setFormOpen(true);
        }}
      >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="faq-pregunta">Pregunta</Label>
            <Input
              id="faq-pregunta"
              value={form.pregunta}
              onChange={(event) => handleChange("pregunta", event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="faq-respuesta">Respuesta</Label>
            <Textarea
              id="faq-respuesta"
              value={form.respuesta}
              onChange={(event) => handleChange("respuesta", event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="faq-categoria">Categoria</Label>
            <Input
              id="faq-categoria"
              value={form.categoria}
              onChange={(event) => handleChange("categoria", event.target.value)}
              placeholder="General / Reservas / Cuidados"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="faq-orden">Orden</Label>
            <Input
              id="faq-orden"
              type="number"
              min="0"
              step="1"
              value={form.orden}
              onChange={(event) => handleChange("orden", event.target.value)}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-[#7d6a61]">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(event) => handleChange("activo", event.target.checked)}
            />
            Visible en el sitio
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="submit"
            className="rounded-2xl bg-[#c69a86] text-[#4b3932] hover:bg-[#e8c2b5]"
            disabled={saving}
          >
            {saving
              ? "Guardando..."
              : isEditing
                ? "Actualizar FAQ"
                : "Crear FAQ"}
          </Button>
          {isEditing ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancelar edicion
            </Button>
          ) : null}
        </div>
      </form>
      </AppModal>

      {message ? (
        <div className="mt-4 rounded-2xl border border-[#c69a86]/25 bg-[#c69a86]/10 p-3 text-sm text-[#c69a86]">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3">
        {loading ? (
          <p className="text-sm text-[#a8968d]">Cargando FAQ...</p>
        ) : faqs.length === 0 ? (
          <p className="text-sm text-[#a8968d]">
            No hay preguntas frecuentes registradas.
          </p>
        ) : (
          faqs.map((faq) => (
            <article
              key={String(faq.id)}
              className="premium-card premium-card-hover rounded-3xl p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-[#c69a86]">
                      {faq.pregunta}
                    </h3>
                    <span className="rounded-full border border-white/10 bg-[#fffaf7] px-2 py-1 text-xs text-[#7d6a61]">
                      {faq.activo === false ? "Oculta" : "Visible"}
                    </span>
                    {faq.categoria ? (
                      <span className="rounded-full border border-white/10 bg-[#fffaf7] px-2 py-1 text-xs text-[#7d6a61]">
                        {faq.categoria}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#6d554b]">
                    {faq.respuesta}
                  </p>
                  <p className="mt-2 text-xs text-[#8e7a71]">
                    Orden {faq.orden ?? 0}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 md:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setForm(mapToForm(faq));
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => handleToggleActive(faq)}>
                    {faq.activo === false ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-400/30 text-red-300 hover:bg-red-500/10 hover:text-red-300"
                    onClick={() => handleDelete(faq.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
};

export default AdminFAQSection;
