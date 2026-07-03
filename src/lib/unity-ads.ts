/**
 * Unity Ads integration.
 *
 * Production (APK / AppCreator24 native shell): real Unity Ads run through
 * `window.UnityAdsBridge`. Coins are only granted on a `COMPLETED` result.
 *
 * Development (Lovable web preview / `import.meta.env.DEV`): a mandatory
 * 5-second modal simulator stands in for the native Unity SDK so you can
 * test the rewarded flow end-to-end in the browser. This dev simulator is
 * stripped in production builds — real users never see it.
 */

export const UNITY_CONFIG = {
  gameId: "800079152",
  testMode: false,
  placements: {
    rewarded: "Rewarded_Android",
    interstitial: "Interstitial_android",
    banner: "Banner_android",
  },
};

type UnityBridge = {
  init?: (gameId: string, testMode: boolean) => Promise<void> | void;
  isReady?: (placementId: string) => boolean | Promise<boolean>;
  load?: (placementId: string) => Promise<void> | void;
  show: (placementId: string) => Promise<"COMPLETED" | "SKIPPED" | "FAILED" | string>;
  showBanner?: (placementId: string) => Promise<void> | void;
  hideBanner?: () => Promise<void> | void;
};

function getBridge(): UnityBridge | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { UnityAdsBridge?: UnityBridge };
  return w.UnityAdsBridge ?? null;
}

function isDevPreview(): boolean {
  try {
    return typeof window !== "undefined" && !!import.meta.env?.DEV;
  } catch {
    return false;
  }
}

let initialized = false;

export async function initUnityAds(): Promise<boolean> {
  if (initialized) return true;
  const bridge = getBridge();
  if (!bridge) {
    if (isDevPreview()) {
      initialized = true;
      return true;
    }
    return false;
  }
  try {
    await bridge.init?.(UNITY_CONFIG.gameId, UNITY_CONFIG.testMode);
    initialized = true;
    try { await bridge.load?.(UNITY_CONFIG.placements.rewarded); } catch {}
    try { await bridge.load?.(UNITY_CONFIG.placements.interstitial); } catch {}
    return true;
  } catch {
    return false;
  }
}

async function showViaBridge(placementId: string): Promise<boolean> {
  const bridge = getBridge();
  if (!bridge) return false;
  try {
    try { await bridge.load?.(placementId); } catch {}
    const state = await bridge.show(placementId);
    if (bridge.load) { try { await bridge.load(placementId); } catch {} }
    return String(state).toUpperCase() === "COMPLETED";
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Dev-only simulator (stripped from production builds)               */
/* ------------------------------------------------------------------ */

function showDevSimulator(kind: "rewarded" | "interstitial"): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") { resolve(false); return; }

    const overlay = document.createElement("div");
    overlay.setAttribute("data-dev-unity-ad", "1");
    overlay.style.cssText = [
      "position:fixed", "inset:0", "z-index:2147483647",
      "background:rgba(0,0,0,0.92)", "display:flex", "flex-direction:column",
      "align-items:center", "justify-content:center", "color:#fff",
      "font-family:system-ui,-apple-system,sans-serif", "padding:24px",
      "text-align:center",
    ].join(";");

    const duration = kind === "rewarded" ? 5 : 3;
    let remaining = duration;

    overlay.innerHTML = `
      <div style="font-size:11px;letter-spacing:2px;opacity:0.6;margin-bottom:16px">DEV PREVIEW · SIMULATED UNITY AD</div>
      <div style="font-size:64px;margin-bottom:8px">🎬</div>
      <div style="font-size:20px;font-weight:600;margin-bottom:8px">${kind === "rewarded" ? "Rewarded Ad" : "Interstitial Ad"}</div>
      <div style="font-size:13px;opacity:0.7;max-width:280px;margin-bottom:24px">Real Unity ad plays here inside the Android APK.</div>
      <div id="dev-ad-timer" style="font-size:48px;font-weight:700;margin-bottom:16px">${remaining}</div>
      <button id="dev-ad-close" disabled style="padding:12px 28px;border-radius:999px;border:none;background:#fff;color:#000;font-weight:600;opacity:0.4;cursor:not-allowed">Close in ${remaining}s</button>
    `;

    document.body.appendChild(overlay);
    const timerEl = overlay.querySelector<HTMLDivElement>("#dev-ad-timer")!;
    const btn = overlay.querySelector<HTMLButtonElement>("#dev-ad-close")!;
    let completed = false;

    const interval = window.setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        timerEl.textContent = String(remaining);
        btn.textContent = `Close in ${remaining}s`;
      } else {
        window.clearInterval(interval);
        timerEl.textContent = "✓";
        btn.textContent = kind === "rewarded" ? "Claim Reward" : "Close";
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
        btn.onclick = () => { completed = true; cleanup(); };
      }
    }, 1000);

    const cleanup = () => {
      window.clearInterval(interval);
      overlay.remove();
      resolve(completed);
    };
  });
}

/* ------------------------------------------------------------------ */

export async function showUnityRewarded(): Promise<boolean> {
  const bridge = getBridge();
  if (bridge) { await initUnityAds(); return showViaBridge(UNITY_CONFIG.placements.rewarded); }
  if (isDevPreview()) return showDevSimulator("rewarded");
  return false;
}

export async function showUnityInterstitial(): Promise<boolean> {
  const bridge = getBridge();
  if (bridge) { await initUnityAds(); return showViaBridge(UNITY_CONFIG.placements.interstitial); }
  if (isDevPreview()) return showDevSimulator("interstitial");
  return false;
}

export async function showUnityBanner(): Promise<boolean> {
  const bridge = getBridge();
  if (bridge?.showBanner) {
    try { await bridge.showBanner(UNITY_CONFIG.placements.banner); return true; } catch { return false; }
  }
  return false;
}

export async function hideUnityBanner(): Promise<void> {
  const bridge = getBridge();
  if (bridge?.hideBanner) { try { await bridge.hideBanner(); } catch {} }
}
