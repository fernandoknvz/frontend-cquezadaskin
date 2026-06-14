import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, MessageSquare, Star, Trash2 } from "lucide-react";

import { AppModal } from "@/components/ui/AppModal";
import { Button } from "@/components/ui/button";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import {
  deleteValoracionAdmin,
  listValoracionesAdmin,
  patchValoracionAdmin,
  updateValoracionEstadoAdmin,
  type ValoracionAdmin,
} from "@/services/adminValoracionesApi";

type EstadoFiltro = "todos" | "pendiente" | "aprobada" | "rechazada";
type ModalFeedback = {
  tone: "success" | "error" | "info";
  message: string;
} | null;

const estadoLabels: Record<string, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  aprobado: "Aprobada",
  rechazada: "Rechazada",
  rechazado: "Rechazada",
};

const normalizeEstado = (estado?: string | null) => {
  const normalized = (estado ?? "pendiente").toLowerCase();
  if (normalized === "aprobado") return "aprobada";
  if (normalized === "rechazado") return "rechazada";
  return normalized;
};

const getEstadoClass = (estado?: string | null) => {
  const normalized = normalizeEstado(estado);
  if (normalized === "aprobada") {
    return "border-[#00D1C1]/30 bg-[#00D1C1]/10 text-[#20E0D0]";
  }
  if (normalized === "rechazada") {
    return "border-red-400/30 bg-red-500/10 text-red-200";
  }
  return "border-amber-300/30 bg-amber-400/10 text-amber-200";
};

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export const AdminValoracionesSection = () => {
  const toast = useToast();
  const [valoraciones, setValoraciones] = useState<ValoracionAdmin[]>([]);
  const [selected, setSelected] = useState<ValoracionAdmin | null>(null);
  const [filtro, setFiltro] = useState<EstadoFiltro>("todos");
  const [respuesta, setRespuesta] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [modalFeedback, setModalFeedback] = useState<ModalFeedback>(null);

  const clearNotification = useCallback(() => toast.clear(), [toast]);

  const showToast = useCallback(
    (notificationData: {
      variant: "success" | "error" | "warning" | "info";
      title: string;
      description: string;
    }) => {
      toast.showToast(notificationData.variant, {
        title: notificationData.title,
        description: notificationData.description,
      });
    },
    [toast]
  );

  const showError = useCallback(
    (description: string) => {
      showToast({
        variant: "error",
        title: "No se pudo completar la acción",
        description,
      });
    },
    [showToast]
  );

  const replaceValoracion = useCallback((updated: ValoracionAdmin) => {
    if (!updated.id) return false;
    setValoraciones((current) =>
      current.map((item) =>
        String(item.id) === String(updated.id) ? updated : item
      )
    );
    setSelected((current) =>
      current && String(current.id) === String(updated.id) ? updated : current
    );
    return true;
  }, []);

  const loadValoraciones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listValoracionesAdmin();
      setValoraciones(data);
      setSelected((current) =>
        current
          ? data.find((item) => String(item.id) === String(current.id)) ?? current
          : current
      );
      return true;
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Error al cargar valoraciones"
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadValoraciones();
  }, [loadValoraciones]);

  const filtered = useMemo(() => {
    if (filtro === "todos") return valoraciones;
    return valoraciones.filter(
      (item) => normalizeEstado(item.estado) === filtro
    );
  }, [filtro, valoraciones]);

  const openModeration = (valoracion: ValoracionAdmin) => {
    setSelected(valoracion);
    setRespuesta(valoracion.respuesta_admin ?? "");
    setModalFeedback(null);
    clearNotification();
  };

  const handleRefresh = async () => {
    clearNotification();
    const refreshed = await loadValoraciones();
    if (refreshed) {
      showToast({
        variant: "info",
        title: "Lista actualizada",
        description: "Las valoraciones están al día.",
      });
    }
  };

  const handleEstado = async (
    valoracion: ValoracionAdmin,
    estado: "aprobada" | "rechazada"
  ) => {
    setSavingId(String(valoracion.id));
    setModalFeedback(null);
    clearNotification();
    try {
      const updated = await updateValoracionEstadoAdmin(valoracion.id, {
        estado,
        visible: estado === "aprobada",
        publicada: estado === "aprobada",
        aprobada: estado === "aprobada",
      });
      setModalFeedback({
        tone: "success",
        message: "Cambios guardados correctamente.",
      });
      await wait(900);
      setSelected(null);
      setModalFeedback(null);
      if (!replaceValoracion(updated)) await loadValoraciones();
      showToast(
        estado === "aprobada"
          ? {
              variant: "success",
              title: "Valoración aprobada",
              description: "La opinión ya puede mostrarse en el sitio.",
            }
          : {
              variant: "warning",
              title: "Valoración rechazada",
              description: "La opinión quedó fuera de la publicación.",
            }
      );
    } catch (err) {
      setModalFeedback({
        tone: "error",
        message:
          err instanceof Error
            ? err.message
            : "Error al actualizar estado de valoracion",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleVisible = async (valoracion: ValoracionAdmin) => {
    setSavingId(String(valoracion.id));
    setModalFeedback(null);
    clearNotification();
    try {
      const nextVisible = !valoracion.visible;
      const updated = await patchValoracionAdmin(valoracion.id, {
        visible: nextVisible,
      });
      setModalFeedback({
        tone: "success",
        message: "Cambios guardados correctamente.",
      });
      await wait(900);
      setSelected(null);
      setModalFeedback(null);
      if (!replaceValoracion(updated)) await loadValoraciones();
      showToast({
        variant: nextVisible ? "success" : "info",
        title: nextVisible ? "Valoración visible" : "Valoración oculta",
        description: nextVisible
          ? "La opinión puede mostrarse en el sitio."
          : "La opinión dejó de mostrarse públicamente.",
      });
    } catch (err) {
      setModalFeedback({
        tone: "error",
        message:
          err instanceof Error ? err.message : "Error al actualizar valoracion",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleRespuesta = async (valoracion: ValoracionAdmin) => {
    setSavingId(String(valoracion.id));
    setModalFeedback(null);
    clearNotification();
    try {
      const updated = await patchValoracionAdmin(valoracion.id, {
        respuesta_admin: respuesta.trim() || null,
      });
      setModalFeedback({
        tone: "success",
        message: "Cambios guardados correctamente.",
      });
      await wait(900);
      setSelected(null);
      setModalFeedback(null);
      if (!replaceValoracion(updated)) await loadValoraciones();
      showToast({
        variant: "success",
        title: "Respuesta guardada",
        description: "La respuesta quedó asociada a la valoración.",
      });
    } catch (err) {
      setModalFeedback({
        tone: "error",
        message:
          err instanceof Error ? err.message : "Error al guardar respuesta",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!window.confirm("Eliminar esta valoracion?")) return;
    setSavingId(String(id));
    setModalFeedback(null);
    clearNotification();
    try {
      await deleteValoracionAdmin(id);
      setModalFeedback({
        tone: "success",
        message: "Cambios guardados correctamente.",
      });
      await wait(900);
      setValoraciones((current) =>
        current.filter((item) => String(item.id) !== String(id))
      );
      setSelected(null);
      setModalFeedback(null);
      showToast({
        variant: "success",
        title: "Valoración eliminada",
        description: "La opinión fue eliminada del panel.",
      });
    } catch (err) {
      setModalFeedback({
        tone: "error",
        message:
          err instanceof Error ? err.message : "Error al eliminar valoracion",
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="premium-panel rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="premium-section-title text-3xl font-semibold">
            Valoraciones
          </h2>
          <p className="mt-1 text-sm text-[#D6D6D6]">
            Modera testimonios, visibilidad y respuestas publicas.
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          Actualizar lista
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(["todos", "pendiente", "aprobada", "rechazada"] as EstadoFiltro[]).map(
          (estado) => (
            <Button
              key={estado}
              type="button"
              variant={filtro === estado ? "default" : "outline"}
              className="rounded-2xl"
              onClick={() => setFiltro(estado)}
            >
              {estado === "todos" ? "Todas" : estadoLabels[estado]}
            </Button>
          )
        )}
      </div>

      <div className="mt-6 grid gap-4">
        {loading ? (
          <p className="text-sm text-[#A8A8A8]">Cargando valoraciones...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-[#A8A8A8]">
            No hay valoraciones para este filtro.
          </p>
        ) : (
          filtered.map((valoracion) => (
            <article
              key={String(valoracion.id)}
              className="premium-card premium-card-hover rounded-3xl p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {valoracion.nombre_mostrado}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <StarRating value={valoracion.puntuacion} />
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getEstadoClass(
                        valoracion.estado
                      )}`}
                    >
                      {estadoLabels[normalizeEstado(valoracion.estado)] ??
                        valoracion.estado}
                    </span>
                    <span className="rounded-full border border-white/10 bg-[#0B0F0F] px-3 py-1 text-xs text-[#B8B8B8]">
                      {valoracion.visible ? "Visible" : "Oculta"}
                    </span>
                  </div>
                  <p className="mt-4 line-clamp-2 text-sm leading-7 text-[#D6D6D6]">
                    {valoracion.comentario}
                  </p>
                </div>
                <Button variant="outline" onClick={() => openModeration(valoracion)}>
                  <MessageSquare className="h-4 w-4" />
                  Moderar
                </Button>
              </div>
            </article>
          ))
        )}
      </div>

      <AppModal
        open={Boolean(selected)}
        title="Moderar valoración"
        description="Revisa el detalle, estado, visibilidad y respuesta pública."
        onOpenChange={(open) => {
          if (!open && !savingId) {
            setSelected(null);
            setModalFeedback(null);
          }
        }}
        className="w-[min(94vw,860px)]"
      >
        {selected ? (
          <div className="grid gap-5">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {selected.nombre_mostrado}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <StarRating value={selected.puntuacion} />
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${getEstadoClass(
                    selected.estado
                  )}`}
                >
                  {estadoLabels[normalizeEstado(selected.estado)] ??
                    selected.estado}
                </span>
                <span className="rounded-full border border-white/10 bg-[#0B0F0F] px-3 py-1 text-xs text-[#B8B8B8]">
                  {selected.visible ? "Visible" : "Oculta"}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#D6D6D6]">
                {selected.comentario}
              </p>
              <div className="mt-4 grid gap-1 text-xs text-[#8E8E8E] sm:grid-cols-2">
                <span>Cliente: {selected.cliente_nombre ?? "Sin dato"}</span>
                <span>Correo: {selected.cliente_correo ?? "Sin dato"}</span>
                <span>Cita: {selected.cita_id ?? "Sin asociar"}</span>
                <span>Creada: {selected.creado_en || "Sin fecha"}</span>
              </div>
            </div>

            {modalFeedback ? (
              <InlineFeedback
                tone={modalFeedback.tone}
                message={modalFeedback.message}
              />
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="valoracion-respuesta">Respuesta admin</Label>
              <Textarea
                id="valoracion-respuesta"
                value={respuesta}
                disabled={savingId === String(selected.id)}
                onChange={(event) => setRespuesta(event.target.value)}
                placeholder="Respuesta publica opcional"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleRespuesta(selected)}
                disabled={savingId === String(selected.id)}
              >
                <MessageSquare className="h-4 w-4" />
                {savingId === String(selected.id) ? "Guardando..." : "Responder"}
              </Button>
              <Button
                type="button"
                className="rounded-2xl bg-[#00D1C1] text-[#03110f] hover:bg-[#20E0D0]"
                onClick={() => handleEstado(selected, "aprobada")}
                disabled={savingId === String(selected.id)}
              >
                {savingId === String(selected.id) ? "Guardando..." : "Aprobar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-red-400/30 text-red-300 hover:bg-red-500/10 hover:text-red-300"
                onClick={() => handleEstado(selected, "rechazada")}
                disabled={savingId === String(selected.id)}
              >
                {savingId === String(selected.id) ? "Guardando..." : "Rechazar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleVisible(selected)}
                disabled={savingId === String(selected.id)}
              >
                {selected.visible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {savingId === String(selected.id)
                  ? "Guardando..."
                  : selected.visible
                    ? "Ocultar"
                    : "Mostrar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-red-400/30 text-red-300 hover:bg-red-500/10 hover:text-red-300"
                onClick={() => handleDelete(selected.id)}
                disabled={savingId === String(selected.id)}
              >
                <Trash2 className="h-4 w-4" />
                {savingId === String(selected.id) ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </div>
        ) : null}
      </AppModal>
    </section>
  );
};

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} de 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < value ? "fill-[#00D1C1] text-[#00D1C1]" : "text-[#3A3A3A]"
          }`}
        />
      ))}
    </div>
  );
}

export default AdminValoracionesSection;
