import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { AppModal } from "@/components/ui/AppModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  OFFICIAL_SERVICE_CATEGORIES,
  getOfficialCategoryIdByName,
  type OfficialServiceCategoryId,
} from "@/features/services/data/serviceCategoryConfig";
import { useToast } from "@/hooks/useToast";
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

const visibilityOptions = [
  {
    field: "mostrar_servicios",
    label: "Mostrar en Servicios",
    help: "Aparece en la pagina principal de tratamientos.",
  },
  {
    field: "mostrar_especiales",
    label: "Mostrar en Especiales",
    help: "Aparece en la seccion de atenciones especiales.",
  },
] as const;

const getVisibilityBadges = (service: AdminService) =>
  visibilityOptions
    .filter((option) => Boolean(service[option.field]))
    .map((option) => option.label.replace("Mostrar en ", ""));

export const AdminServicesSection = () => {
  const toast = useToast();
  const [services, setServices] = useState<AdminService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [form, setForm] = useState<ServiceFormState>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = useMemo(() => Boolean(form.id), [form.id]);
  const officialCategoryOptions = useMemo(() => {
    const optionByOfficialId = new Map<
      OfficialServiceCategoryId,
      { id: number; name: string; order: number; exact: boolean }
    >();

    categories.forEach((cat) => {
      const officialId = getOfficialCategoryIdByName(cat.nombre);
      const officialCategory = OFFICIAL_SERVICE_CATEGORIES.find(
        (item) => item.id === officialId
      );
      if (!officialCategory) return;

      const exact =
        cat.nombre.trim().toLowerCase() === officialCategory.name.toLowerCase();
      const current = optionByOfficialId.get(officialId);
      const candidate = {
        id: cat.id,
        name: officialCategory.name,
        order: cat.orden ?? 0,
        exact,
      };

      if (
        !current ||
        (candidate.exact && !current.exact) ||
        (candidate.exact === current.exact && candidate.order < current.order)
      ) {
        optionByOfficialId.set(officialId, candidate);
      }
    });

    return OFFICIAL_SERVICE_CATEGORIES.map((category) =>
      optionByOfficialId.get(category.id)
    ).filter((option): option is NonNullable<typeof option> => Boolean(option));
  }, [categories]);

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
        toast.success({
          title: "Servicio actualizado",
          description: "Los cambios quedaron guardados correctamente.",
        });
      } else {
        await createServiceAdmin(payload);
        toast.success({
          title: "Servicio creado",
          description: "El servicio quedo guardado correctamente.",
        });
      }
      resetForm();
      await loadServices();
    } catch (err) {
      const description =
        err instanceof Error ? err.message : "Error al guardar servicio";
      setError(description);
      toast.error({
        title: "No se pudo guardar el servicio",
        description,
        duration: 5000,
      });
    }
  };

  const handleEdit = (service: AdminService) => {
    setForm(mapToForm(service));
    setImageFile(null);
    setImagePreview("");
    setFormOpen(true);
    setError(null);
  };

  const currentImagePreview = imagePreview || resolveImageUrl(form.imagen_url, "");

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Eliminar este servicio?");
    if (!confirmed) return;
    setError(null);
    try {
      await deleteServiceAdmin(id);
      toast.success({
        title: "Servicio eliminado",
        description: "El servicio fue eliminado correctamente.",
      });
      await loadServices();
    } catch (err) {
      const description =
        err instanceof Error ? err.message : "Error al eliminar servicio";
      setError(description);
      toast.error({
        title: "No se pudo eliminar el servicio",
        description,
        duration: 5000,
      });
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
              {officialCategoryOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
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
          <div className="grid gap-3 md:col-span-2">
            <div>
              <p className="text-sm font-semibold text-white">Visibilidad del servicio</p>
              <p className="mt-1 text-xs text-[#a8968d]">
                Selecciona en que secciones publicas aparecera este servicio.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {visibilityOptions.map((option) => (
                <label
                  key={option.field}
                  className="rounded-2xl border border-white/10 bg-[#ffffff]/70 p-3 text-sm text-[#7d6a61]"
                >
                  <span className="flex items-center gap-2 font-semibold text-white">
                    <input
                      type="checkbox"
                      checked={form[option.field]}
                      onChange={(event) =>
                        handleChange(option.field, event.target.checked)
                      }
                    />
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#a8968d]">
                    {option.help}
                  </span>
                </label>
              ))}
            </div>
          </div>
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

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3">
        {services.length === 0 ? (
          <p className="text-sm text-[#a8968d]">No hay servicios cargados.</p>
        ) : (
          services.map((service) => {
            const visibilityBadges = getVisibilityBadges(service);

            return (
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
                  <div className="mt-3 flex flex-wrap gap-2">
                    {visibilityBadges.length > 0 ? (
                      visibilityBadges.map((badge) => (
                        <span
                          key={`${service.id}-${badge}`}
                          className="rounded-full border border-[#c69a86]/25 bg-[#c69a86]/10 px-3 py-1 text-xs font-semibold text-[#e8c2b5]"
                        >
                          {badge}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-white/10 bg-[#ffffff]/70 px-3 py-1 text-xs text-[#a8968d]">
                        Sin seccion publica
                      </span>
                    )}
                  </div>
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
            );
          })
        )}
      </div>
    </section>
  );
};

export default AdminServicesSection;
