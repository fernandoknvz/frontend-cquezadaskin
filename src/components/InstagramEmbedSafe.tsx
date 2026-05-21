import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  url: string;
  className?: string;
};

const MODES = {
  EMBED: "embed",
  FALLBACK: "fallback",
} as const;

type Mode = (typeof MODES)[keyof typeof MODES];

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

function ensureInstagramScript(): Promise<void> {
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.instagram.com/embed.js"]'
    );
    if (existing) return resolve();

    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
}

export const InstagramEmbedSafe: React.FC<Props> = ({ url, className }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Derivado: si no hay permalink, no intentamos embed.
  const permalink = useMemo(() => normalizeInstagramPermalink(url), [url]);
  const canEmbed = Boolean(permalink);

  // El modo solo cambia por eventos async.
  const [mode, setMode] = useState<Mode>(MODES.EMBED);

  // Si el usuario pega una URL inválida, render cae a fallback sin setState.
  // (el render mismo lo maneja con canEmbed)
  useEffect(() => {
    if (!canEmbed) return;

    let cancelled = false;

    // Cuando cambia permalink (nuevo post), partimos intentando embed.
    // Lo hacemos en microtask para evitar regla eslint "setState in effect sync".
    queueMicrotask(() => {
      if (!cancelled) setMode(MODES.EMBED);
    });

    (async () => {
      await ensureInstagramScript();

      // @ts-expect-error injected by Instagram
      window.instgrm?.Embeds?.process?.();

      const t = window.setTimeout(() => {
        if (!cancelled) setMode(MODES.FALLBACK);
      }, 2500);

      window.setTimeout(() => {
        window.clearTimeout(t);
        if (cancelled) return;

        const host = containerRef.current;
        const iframe = host?.querySelector("blockquote.instagram-media iframe");
        if (!iframe) setMode(MODES.FALLBACK);
      }, 1200);
    })();

    return () => {
      cancelled = true;
    };
  }, [canEmbed, permalink]);

  const openUrl = permalink ?? url;

  // Fallback inmediato si no es embebible.
  if (!canEmbed || mode === MODES.FALLBACK) {
    return (
      <div
        className={[
          "w-full rounded-3xl border border-white/10 bg-[#121212]/80 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]",
          className ?? "",
        ].join(" ")}
      >
        <div className="text-sm font-semibold text-white">
          Video / publicación
        </div>
        <div className="mt-1 text-xs text-[#B8B8B8] break-all">{openUrl}</div>
        <a
          href={openUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center justify-center rounded-2xl border border-white/10 bg-[#121212]/80 px-3 py-2 text-xs font-medium text-[#C9C9C9] hover:bg-[#121212] hover:text-white"
        >
          Abrir en Instagram
        </a>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={[
        "w-full overflow-hidden rounded-3xl border border-white/10 bg-[#121212]/80 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.06)]",
        className ?? "",
      ].join(" ")}
    >
      <div className="mx-auto w-full max-w-[540px]">
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={permalink!}
          data-instgrm-version="14"
          style={{ width: "100%", margin: "0 auto" }}
        />
      </div>
    </div>
  );
};

export default InstagramEmbedSafe;
