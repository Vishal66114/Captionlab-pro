import { useEffect, useId, useRef, useState } from "react";

/**
 * Adsterra Native Banner — single instance.
 *
 * The publisher snippet renders into #container-<key>. We inject the
 * <script> once per mount and clean up on unmount so route changes
 * don't double-register the container.
 */
const SCRIPT_SRC =
  "https://pl29781326.effectivecpmnetwork.com/6d843a4432899d6e73cca3a3aeb47c33/invoke.js";
const CONTAINER_ID = "container-6d843a4432899d6e73cca3a3aeb47c33";

export function AdsterraNative({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const instanceId = useId().replace(/:/g, "");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = hostRef.current;
    if (!host) return;

    setFailed(false);
    host.innerHTML = `<div id="${CONTAINER_ID}"></div>`;

    const script = document.createElement("script");
    script.id = `adsterra-native-${instanceId}`;
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.onerror = () => setFailed(true);
    script.src = SCRIPT_SRC;
    host.appendChild(script);

    return () => {
      script.remove();
      if (host) host.innerHTML = "";
    };
  }, [instanceId]);

  return (
    <section
      className={
        "relative overflow-hidden rounded-2xl glass-strong border p-3 shadow-pop " +
        className
      }
      aria-label="Sponsored"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-muted-foreground text-[9px] font-bold tracking-widest uppercase">
          Sponsored
        </span>
        <span className="text-muted-foreground text-[9px]">Ad</span>
      </div>
      <div ref={hostRef} className="min-h-[120px]" />
      {failed && (
        <div className="text-muted-foreground absolute inset-x-3 top-1/2 -translate-y-1/2 rounded-xl border border-dashed bg-background/90 p-3 text-center text-[11px] font-semibold">
          Sponsored content is temporarily unavailable.
        </div>
      )}
    </section>
  );
}

export default AdsterraNative;
