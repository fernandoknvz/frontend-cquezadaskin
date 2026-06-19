import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { AppModal } from "@/components/ui/AppModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import {
  type AdminService,
  type AdminServicePayload,
  createServiceAdmin,
  deleteServiceAdmin,
  listServicesAdmin,
  updateServiceAdmin,
} from "@/services/adminServicesApi";
import { listServiceCategories, type ServiceCategory } from "@/services/categoriesApi";

type ServiceFormState = {
  id?: string;
  nombre: string;
  etiqueta: string;
  subtitulo: string;
  descripcion: string;
  beneficios: string;
  imagen_url: string;
  precio: string;
  orden: string;
  activo: boolean;
  categoria_id: string;
  mostrar_servicios: boolean;
  mostrar_especiales: boolean;
  mostrar_empresas: boolean;
  cta_primary_label: string;
  cta_primary_url: string;
  cta_secondary_label: string;
  cta_secondary_url: string;
};

const emptyForm: ServiceFormState = {
  nombre: "",
  etiqueta: "",
  subtitulo: "",
  descripcion: "",
  beneficios: "",
  imagen_url: "",
  precio: "0",
  orden: "0",
  activo: true,
  categoria_id: "",
  mostrar_servicios: false,
  mostrar_especiales: false,
  mostrar_empresas: false,
  cta_primary_label: "",
  cta_primary_url: "",
  cta_secondary_label: "",
  cta_secondary_url: "",
};

const mapToForm = (service: AdminService): ServiceFormState => ({
  id: service.id,
  nombre: service.nombre ?? "",
  etiqueta: service.etiqueta ?? "",
  subtitulo: service.subtitulo ?? "",
  descripcion: service.descripcion ?? "",
  beneficios: (service.beneficios ?? []).join("\n"),
  imagen_url: service.imagen_url ?? "",
  precio: String(service.precio ?? 0),
  orden: String(service.orden ?? 0),
  activo: Boolean(service.activo),
  categoria_id: service.categoria_id ? String(service.categoria_id) : "",
  mostrar_servicios: Boolean(service.mostrar_servicios),
  mostrar_especiales: Boolean(service.mostrar_especiales),
  mostrar_empresas: Boolean(service.mostrar_empresas),
  cta_primary_label: service.cta_primary_label ?? "",
  cta_primary_url: service.cta_primary_url ?? "",
  cta_secondary_label: service.cta_secondary_label ?? "",
  cta_secondary_url: service.cta_secondary_url ?? "",
});

export const AdminServicesSection = () => {
  const [services, setServices] = useState<AdminService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [form, setForm] = useState<ServiceFormState>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEditing = useMemo(() => Boolean(form.id), [form.id]);

  const loadServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listServicesAdmin();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar servicios");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await listServiceCategories();
      setCategories(data.filter((cat) => cat.activo !== false));
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => {
    loadServices();
    loadCategories();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleChange = (field: keyof ServiceFormState, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    setFormOpen(false);
    setMessage(null);
    setError(null);
  };

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    setImagePreview((prev) => {
      if (prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return file ? URL.createObjectURL(file) : "";
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const beneficios = form.beneficios
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      const payload: AdminServicePayload = {
        nombre: form.nombre.trim(),
        etiqueta: form.etiqueta.trim() || null,
        subtitulo: form.subtitulo.trim() || null,
        descripcion: form.descripcion.trim(),
        beneficios,
        imagen_url: form.imagen_url.trim(),
        precio: Number(form.precio) || 0,
        orden: Number(form.orden) || 0,
        activo: form.activo,
        categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
        mostrar_servicios: form.mostrar_servicios,
        mostrar_especiales: form.mostrar_especiales,
        mostrar_empresas: form.mostrar_empresas,
        cta_primary_label: form.cta_primary_label.trim() || null,
        cta_primary_url: form.cta_primary_url.trim() || null,
        cta_secondary_label: form.cta_secondary_label.trim() || null,
        cta_secondary_url: form.cta_secondary_url.trim() || null,
        imagen: imageFile,
      };

      if (form.id) {
        await updateServiceAdmin(form.id, payload);
        setMessage("Servicio actualizado");
      } else {
        await createServiceAdmin(payload);
        setMessage("Servicio creado");
      }
      resetForm();
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar servicio");
    }
  };

  const handleEdit = (service: AdminService) => {
    setForm(mapToForm(service));
    setImageFile(null);
    setImagePreview("");
    setFormOpen(true);
    setMessage(null);
    setError(null);
  };

  const currentImagePreview = imagePreview || resolveImageUrl(form.imagen_url, "");

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Eliminar este servicio?");
    if (!confirmed) return;
    setError(null);
    setMessage(null);
    try {
      await deleteServiceAdmin(id);
      setMessage("Servicio eliminado");
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar servicio");
    }
  };

  return (
    <section className="premium-panel rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="premium-section-title text-3xl font-semibold">Servicios</h2>
          <p className="mt-1 text-sm text-[#6d554b]">
            Crea o edita los servicios visibles en el sitio.
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
            Crear servicio
          </Button>
          <Button variant="outline" onClick={loadServices}>
            Actualizar lista
          </Button>
        </div>
      </div>

      <AppModal
        open={formOpen}
        title={isEditing ? "Editar servicio" : "Crear servicio"}
        description="Completa la informacion visible para el sitio."
        onOpenChange={(open) => {
          if (!open) resetForm();
          else setFormOpen(true);
        }}
        className="w-[min(94vw,920px)]"
      >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="service-title">Nombre</Label>
            <Input
              id="service-title"
              value={form.nombre}
              onChange={(event) => handleChange("nombre", event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="service-tag">Etiqueta</Label>
            <Input
              id="service-tag"
              value={form.etiqueta}
              onChange={(event) => handleChange("etiqueta", event.target.value)}
              placeholder="Facial / Corporal / Evaluacion"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="service-subtitle">Subtitulo</Label>
            <Input
              id="service-subtitle"
              value={form.subtitulo}
              onChange={(event) => handleChange("subtitulo", event.target.value)}
              placeholder="Drenaje Linfatico"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="service-category">Categoria</Label>
            <select
              id="service-category"
              value={form.categoria_id}
              onChange={(event) => handleChange("categoria_id", event.target.value)}
              className="h-11 rounded-2xl border border-white/10 bg-[#fffaf7] px-3 text-sm text-white outline-none focus:border-[#c69a86]/70 focus:ring-2 focus:ring-[#c69a86]/30"
            >
              <option value="">Sin categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="service-description">Descripcion</Label>
            <Textarea
              id="service-description"
              value={form.descripcion}
              onChange={(event) => handleChange("descripcion", event.target.value)}
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="service-benefits">Beneficios (uno por linea)</Label>
            <Textarea
              id="service-benefits"
              value={form.beneficios}
              onChange={(event) => handleChange("beneficios", event.target.value)}
              placeholder="Mejora la circulacion&#10;Reduce estres&#10;..."
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="service-image-file">Imagen</Label>
            <Input
              id="service-image-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => handleImageChange(event.target.files?.[0] ?? null)}
            />
            {currentImagePreview ? (
              <img
                src={currentImagePreview}
                alt={form.nombre ? `Imagen de ${form.nombre}` : "Imagen del servicio"}
                className="h-36 w-full rounded-2xl border border-white/10 object-cover"
              />
            ) : null}
            <p className="text-xs text-[#a8968d]">
              Si no subes imagen, se usara una imagen por defecto.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="service-image-url">Imagen URL</Label>
            <Input
              id="service-image-url"
              value={form.imagen_url}
              onChange={(event) => handleChange("imagen_url", event.target.value)}
              placeholder="Opcional si subes una imagen"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="service-price">Precio</Label>
            <Input
              id="service-price"
              type="number"
              min="0"
              step="1"
              value={form.precio}
              onChange={(event) => handleChange("precio", event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="service-order">Orden</Label>
            <Input
              id="service-order"
              type="number"
              min="0"
              step="1"
              value={form.orden}
              onChange={(event) => handleChange("orden", event.target.value)}
            />
          </div>
          <label className="mt-7 inline-flex items-center gap-2 text-sm text-[#7d6a61]">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(event) => handleChange("activo", event.target.checked)}
            />
            Visible en el sitio
          </label>
          <label className="mt-7 inline-flex items-center gap-2 text-sm text-[#7d6a61]">
            <input
              type="checkbox"
              checked={form.mostrar_servicios}
              onChange={(event) => handleChange("mostrar_servicios", event.target.checked)}
            />
            Mostrar en Servicios
          </label>
          <label className="mt-7 inline-flex items-center gap-2 text-sm text-[#7d6a61]">
            <input
              type="checkbox"
              checked={form.mostrar_especiales}
              onChange={(event) => handleChange("mostrar_especiales", event.target.checked)}
            />
            Mostrar en Especiales
          </label>
          <label className="mt-7 inline-flex items-center gap-2 text-sm text-[#7d6a61]">
            <input
              type="checkbox"
              checked={form.mostrar_empresas}
              onChange={(event) => handleChange("mostrar_empresas", event.target.checked)}
            />
            Mostrar en Empresas
          </label>
          <div className="grid gap-2">
            <Label htmlFor="service-cta-primary-label">CTA principal</Label>
            <Input
              id="service-cta-primary-label"
              value={form.cta_primary_label}
              onChange={(event) => handleChange("cta_primary_label", event.target.value)}
              placeholder="Agendar / Cotizar"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="service-cta-primary-url">URL CTA principal</Label>
            <Input
              id="service-cta-primary-url"
              value={form.cta_primary_url}
              onChange={(event) => handleChange("cta_primary_url", event.target.value)}
              placeholder="/contacto"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="service-cta-secondary-label">CTA secundario</Label>
            <Input
              id="service-cta-secondary-label"
              value={form.cta_secondary_label}
              onChange={(event) => handleChange("cta_secondary_label", event.target.value)}
              placeholder="Ver disponibilidad"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="service-cta-secondary-url">URL CTA secundario</Label>
            <Input
              id="service-cta-secondary-url"
              value={form.cta_secondary_url}
              onChange={(event) => handleChange("cta_secondary_url", event.target.value)}
              placeholder="/contacto"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="submit"
            className="rounded-2xl bg-[#c69a86] text-[#4b3932] hover:bg-[#e8c2b5]"
            disabled={loading}
          >
            {isEditing ? "Actualizar servicio" : "Guardar servicio"}
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
        {services.length === 0 ? (
          <p className="text-sm text-[#a8968d]">No hay servicios cargados.</p>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className="premium-card premium-card-hover flex flex-col gap-3 rounded-3xl p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h4 className="text-base font-semibold text-[#c69a86]">
                  {service.nombre}
                </h4>
                <p className="text-sm text-[#6d554b]">{service.descripcion}</p>
                <p className="mt-1 text-xs text-[#a8968d]">
                  ${Number(service.precio ?? 0).toLocaleString("es-CL")} | Orden{" "}
                  {service.orden ?? 0}
                </p>
              </div>
              <div className="grid w-full grid-cols-2 gap-2 md:w-auto">
                <Button variant="outline" onClick={() => handleEdit(service)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="border-red-400/30 text-red-300 hover:bg-red-500/10 hover:text-red-300"
                  onClick={() => handleDelete(service.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default AdminServicesSection;
