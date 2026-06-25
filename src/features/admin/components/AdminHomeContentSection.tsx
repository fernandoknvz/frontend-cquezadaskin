import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppModal } from "@/components/ui/AppModal";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import {
  type AdminHomeContent,
  type AdminHomeContentPayload,
  createHomeContentAdmin,
  deleteHomeContentAdmin,
  listHomeContentAdmin,
  updateHomeContentAdmin,
} from "@/services/adminHomeContentApi";

type HomeContentFormState = {
  id?: string;
  titulo: string;
  subtitulo: string;
  imagen_url: string;
  video_embed: string;
};

const emptyForm: HomeContentFormState = {
  titulo: "",
  subtitulo: "",
  imagen_url: "",
  video_embed: "",
};

const mapToForm = (item: AdminHomeContent): HomeContentFormState => ({
  id: item.id,
  titulo: item.titulo ?? "",
  subtitulo: item.subtitulo ?? "",
  imagen_url: item.imagen_url ?? "",
  video_embed: item.video_embed ?? "",
});

const buildPayload = (
  form: HomeContentFormState,
  imageFile: File | null
): AdminHomeContentPayload => ({
  titulo: form.titulo.trim(),
  subtitulo: form.subtitulo.trim(),
  imagen_url: form.imagen_url.trim(),
  video_embed: form.video_embed.trim(),
  imagen: imageFile,
});

export const AdminHomeContentSection = () => {
  const toast = useToast();
  const [items, setItems] = useState<AdminHomeContent[]>([]);
  const [form, setForm] = useState<HomeContentFormState>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = useMemo(() => Boolean(form.id), [form.id]);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listHomeContentAdmin();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar contenido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleChange = (
    field: keyof HomeContentFormState,
    value: string
  ) => {
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
      const payload = buildPayload(form, imageFile);
      if (form.id) {
        await updateHomeContentAdmin(form.id, payload);
        toast.success({
          title: "Contenido actualizado",
          description: "Los cambios quedaron guardados correctamente.",
        });
      } else {
        await createHomeContentAdmin(payload);
        toast.success({
          title: "Contenido creado",
          description: "El contenido quedo guardado correctamente.",
        });
      }
      resetForm();
      await loadItems();
    } catch (err) {
      const description =
        err instanceof Error ? err.message : "Error al guardar contenido";
      setError(description);
      toast.error({
        title: "No se pudo guardar el contenido",
        description,
        duration: 5000,
      });
    }
  };

  const handleEdit = (item: AdminHomeContent) => {
    setForm(mapToForm(item));
    setImageFile(null);
    setImagePreview("");
    setFormOpen(true);
    setError(null);
  };

  const currentImagePreview = imagePreview || resolveImageUrl(form.imagen_url, "");

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Eliminar este contenido?");
    if (!confirmed) return;
    setError(null);
    try {
      await deleteHomeContentAdmin(id);
      toast.success({
        title: "Contenido eliminado",
        description: "El contenido fue eliminado correctamente.",
      });
      await loadItems();
    } catch (err) {
      const description =
        err instanceof Error ? err.message : "Error al eliminar contenido";
      setError(description);
      toast.error({
        title: "No se pudo eliminar el contenido",
        description,
        duration: 5000,
      });
    }
  };

  return (
    <section className="premium-panel rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="premium-section-title text-3xl font-semibold">Home / Carousel</h2>
          <p className="mt-1 text-sm text-[#6d554b]">
            Administra títulos e imágenes del home.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setForm(emptyForm);
              setFormOpen(true);
            }}
          >
            Crear contenido
          </Button>
          <Button variant="outline" onClick={loadItems}>
            Actualizar lista
          </Button>
        </div>
      </div>

      <AppModal
        open={formOpen}
        title={isEditing ? "Editar contenido" : "Crear contenido"}
        description="Administra textos, imagenes y video del home."
        onOpenChange={(open) => {
          if (!open) resetForm();
          else setFormOpen(true);
        }}
      >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="home-title">Titulo</Label>
            <Input
              id="home-title"
              value={form.titulo}
              onChange={(event) => handleChange("titulo", event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="home-image">Imagen URL</Label>
            <Input
              id="home-image"
              value={form.imagen_url}
              onChange={(event) => handleChange("imagen_url", event.target.value)}
              placeholder="Opcional si subes una imagen"
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="home-image-file">Imagen principal / Hero</Label>
            <Input
              id="home-image-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => handleImageChange(event.target.files?.[0] ?? null)}
            />
            {currentImagePreview ? (
              <img
                src={currentImagePreview}
                alt={form.titulo ? `Imagen de ${form.titulo}` : "Imagen principal"}
                className="h-44 w-full rounded-2xl border border-white/10 object-cover"
              />
            ) : null}
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="home-subtitle">Subtitulo</Label>
            <Textarea
              id="home-subtitle"
              value={form.subtitulo}
              onChange={(event) => handleChange("subtitulo", event.target.value)}
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="home-video">Video embed (opcional)</Label>
            <Input
              id="home-video"
              value={form.video_embed}
              onChange={(event) => handleChange("video_embed", event.target.value)}
            />
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Acción requerida</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit">
            {isEditing ? "Actualizar contenido" : "Crear contenido"}
          </Button>
          {isEditing ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancelar edicion
            </Button>
          ) : null}
        </div>
      </form>
      </AppModal>

      <div className="mt-8 grid gap-3">
        <h3 className="text-lg font-semibold text-[#c69a86]">
          Contenidos existentes
        </h3>
        {loading ? (
          <p className="text-sm text-[#a8968d]">Cargando contenido...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-[#a8968d]">Sin contenido.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="premium-card premium-card-hover flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3"
            >
              <div>
                <p className="font-medium text-[#c69a86]">{item.titulo}</p>
                <p className="text-xs text-[#6d554b]">{item.subtitulo}</p>
              </div>
              <div className="grid w-full grid-cols-2 gap-2 md:w-auto">
                <Button variant="outline" onClick={() => handleEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="border-red-400/30 text-red-300 hover:bg-red-500/10 hover:text-red-300"
                  onClick={() => handleDelete(item.id)}
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
