import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ExternalLink, Instagram, Pencil, Play, RefreshCw, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/config/site";
import {
  type AdminInstagramPayload,
  type AdminInstagramPost,
  createInstagramAdmin,
  deleteInstagramAdmin,
  listInstagramAdmin,
  updateInstagramAdmin,
} from "@/services/adminInstagramApi";
import { listInstagramPosts, type InstagramPost } from "@/services/instagramApi";

type InstagramFormState = {
  id?: string;
  embed_url: string; // lo usaremos como permalink (post/reel)
  orden: string;
  activo: boolean;
};

const emptyForm: InstagramFormState = {
  embed_url: "",
  orden: "0",
  activo: true,
};

const mapToForm = (post: AdminInstagramPost): InstagramFormState => ({
  id: post.id,
  embed_url: post.embed_url ?? "",
  orden: String(post.orden ?? 0),
  activo: Boolean(post.activo),
});

function normalizeInstagramPermalink(input: string): string | null {
  try {
    const u = new URL(input.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host !== "instagram.com") return null;

    u.search = "";
    u.hash = "";

    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;

    const kind = parts[0];
    const id = parts[1];

    if (kind !== "p" && kind !== "reel") return null;
    if (!id || id.length < 5) return null;

    return `https://www.instagram.com/${kind}/${id}/`;
  } catch {
    return null;
  }
}

const buildPayload = (form: InstagramFormState): AdminInstagramPayload => ({
  embed_url: form.embed_url.trim(),
  orden: Number(form.orden) || 0,
  activo: form.activo,
});

/**
 * Admin only. Este componente se mantiene disponible para el panel admin.
 * Importante: no se renderiza en /eventos público.
 */
export const AdminInstagramSection = () => {
  const [posts, setPosts] = useState<AdminInstagramPost[]>([]);
  const [form, setForm] = useState<InstagramFormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEditing = useMemo(() => Boolean(form.id), [form.id]);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listInstagramAdmin();
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleChange = (
    field: keyof InstagramFormState,
    value: string | boolean
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setMessage(null);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const normalized = normalizeInstagramPermalink(form.embed_url);
    if (!normalized) {
      setError(
        "URL inválida. Pega el enlace de un POST o REEL público (ej: https://www.instagram.com/p/ID/ o https://www.instagram.com/reel/ID/). No sirve el enlace del perfil ni highlights."
      );
      return;
    }

    try {
      const payload = buildPayload({ ...form, embed_url: normalized });

      if (form.id) {
        await updateInstagramAdmin(form.id, payload);
        setMessage("Post actualizado");
      } else {
        await createInstagramAdmin(payload);
        setMessage("Post creado");
      }

      setForm(emptyForm);
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar post");
    }
  };

  const handleEdit = (post: AdminInstagramPost) => {
    setForm(mapToForm(post));
    setMessage(null);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Eliminar este post?");
    if (!confirmed) return;

    setError(null);
    setMessage(null);
    try {
      await deleteInstagramAdmin(id);
      setMessage("Post eliminado");
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar post");
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-[#121212]/90 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="premium-section-title text-3xl font-semibold">Instagram</h2>
          <p className="mt-1 text-sm text-[#8E8E8E]">
            Pega enlaces de <b>post</b> o <b>reel</b>. Si Instagram bloquea el
            embed, la web mostrará un botón para abrirlo.
          </p>
        </div>
        <Button variant="outline" onClick={loadPosts}>
          Actualizar lista
        </Button>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="instagram-embed">URL post/reel</Label>
            <Input
              id="instagram-embed"
              value={form.embed_url}
              onChange={(event) => handleChange("embed_url", event.target.value)}
              placeholder="https://www.instagram.com/p/... o https://www.instagram.com/reel/..."
              required
            />
            <p className="text-xs text-[#8E8E8E]">
              Tip: no pegues el link del perfil (ej: instagram.com/cquezadaskin/)
              porque no se embebe.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="instagram-order">Orden</Label>
            <Input
              id="instagram-order"
              type="number"
              value={form.orden}
              onChange={(event) => handleChange("orden", event.target.value)}
              min="0"
              step="1"
            />
          </div>

          <label className="mt-8 inline-flex items-center gap-2 text-sm text-[#B8B8B8]">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(event) => handleChange("activo", event.target.checked)}
            />
            Activo
          </label>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Acción requerida</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : message ? (
          <Alert>
            <AlertTitle>Listo</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit">
            {isEditing ? "Actualizar post" : "Crear post"}
          </Button>
          {isEditing ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancelar edición
            </Button>
          ) : null}
        </div>
      </form>

      <div className="mt-8 grid gap-3">
        <h3 className="text-lg font-semibold text-[#00D1C1]">
          Posts existentes
        </h3>

        {loading ? (
          <p className="text-sm text-[#8E8E8E]">Cargando posts...</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-[#8E8E8E]">Sin posts.</p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 p-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-[#00D1C1]">
                  Orden {post.orden} | {post.activo ? "Activo" : "Inactivo"}
                </p>
                <p className="text-xs text-[#8E8E8E] break-all">
                  {post.embed_url}
                </p>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 md:w-auto">
                <Button variant="outline" onClick={() => handleEdit(post)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="border-red-400/30 text-red-300 hover:bg-red-500/10 hover:text-red-300"
                  onClick={() => handleDelete(post.id)}
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

/**
 * Vista pública de Eventos: solo lectura.
 */
const toEmbedUrl = (permalink: string) => {
  const clean = permalink.endsWith("/") ? permalink.slice(0, -1) : permalink;
  return `${clean}/embed`;
};

const getInstagramKind = (url: string) => {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    return parts[0] === "reel" ? "Reel" : "Post";
  } catch {
    return "Post";
  }
};

const PublicInstagramSection = () => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listInstagramPosts();
      const onlyActive = data
        .filter((p) => p.activo)
        .slice()
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
      setPosts(onlyActive);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar eventos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <section className="rounded-[2rem] border border-[#00D1C1]/20 bg-[#0B0F0F]/92 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.48),0_0_54px_rgba(0,209,193,0.10)] backdrop-blur sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="premium-kicker">Contenido real</p>
          <h2 className="premium-section-title mt-2 text-4xl font-semibold sm:text-5xl">
            Instagram
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#D6D6D6] sm:text-base">
            Tratamientos, resultados y contenido real desde nuestro estudio.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadPosts}
          className="rounded-2xl"
          disabled={loading}
        >
          <RefreshCw className={["h-4 w-4", loading ? "animate-spin" : ""].join(" ")} />
          Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="min-h-[520px] animate-pulse rounded-3xl border border-white/10 bg-[#111414]/80"
            />
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : posts.length === 0 ? (
        <p className="mt-4 text-sm text-[#8E8E8E]">No hay posts activos.</p>
      ) : (
        <motion.div
          className="mt-8 grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-8"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.09 } },
          }}
        >
          {posts.map((post) => (
            <InstagramPostCard key={post.id} post={post} />
          ))}
        </motion.div>
      )}
    </section>
  );
};

function InstagramPostCard({ post }: { post: InstagramPost }) {
  const kind = getInstagramKind(post.embed_url);
  const isReel = kind === "Reel";

  return (
    <motion.article
      className="group overflow-hidden rounded-3xl border border-white/10 bg-[#111414]/88 shadow-[0_18px_60px_rgba(0,0,0,0.34)] transition-colors duration-300 hover:border-[#00D1C1]/55 hover:shadow-[0_0_46px_rgba(0,209,193,0.16)]"
      variants={{
        hidden: { opacity: 0, y: 18 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      whileHover={{ y: -5, scale: 1.012 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#00D1C1]/35 bg-[#00D1C1]/10 text-[#00D1C1] shadow-[0_0_24px_rgba(0,209,193,0.14)]">
            <Instagram className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {siteConfig.instagramHandle}
            </p>
            <p className="text-xs text-[#A8A8A8]">
              {kind} desde el estudio
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full px-3"
          onClick={() => window.open(post.embed_url, "_blank")}
        >
          <ExternalLink className="h-4 w-4" />
          <span className="hidden sm:inline">Ver</span>
        </Button>
      </div>

      <div className="relative bg-[#050505]">
        {isReel ? (
          <div className="pointer-events-none absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#050505]/70 text-white shadow-[0_0_24px_rgba(0,0,0,0.35)] backdrop-blur">
            <Play className="ml-0.5 h-4 w-4 fill-current" />
          </div>
        ) : null}
        <div className="mx-auto aspect-[4/5] w-full overflow-hidden">
          <iframe
            src={toEmbedUrl(post.embed_url)}
            title={`Instagram ${kind} CQuezadaSkin`}
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            allowTransparency
            className="h-full w-full bg-[#050505]"
            style={{ border: 0, overflow: "hidden" }}
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,rgba(5,5,5,0)_0%,rgba(5,5,5,0.78)_100%)]" />
      </div>

      <div className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-semibold text-white">
            CQuezadaSkin
          </p>
          <p className="text-xs text-[#A8A8A8]">
            Explora resultados, tips y momentos reales.
          </p>
        </div>
        <span className="rounded-full border border-[#00D1C1]/30 bg-[#00D1C1]/10 px-3 py-1 text-xs font-semibold text-[#20E0D0]">
          {kind}
        </span>
      </div>
    </motion.article>
  );
}

const EventPage = () => {
  return (
    <main className="mx-auto w-[92%] max-w-7xl py-10 sm:py-14">
      <div className="mb-8 max-w-3xl">
        <h1 className="premium-heading text-5xl font-semibold text-white sm:text-6xl">
          CQuezada<span className="text-[#00D1C1]">Skin</span> en Instagram
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[#D6D6D6] sm:text-lg">
          Explora resultados, tips y momentos reales de CQuezadaSkin.
        </p>
      </div>

      <PublicInstagramSection />

      {/* No renderizar admin aquí. */}
      {/* <AdminInstagramSection /> */}
    </main>
  );
};

export default EventPage;

