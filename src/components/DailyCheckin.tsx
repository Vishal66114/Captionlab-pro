import { useEffect, useMemo, useState } from "react";
import { Check, Gift, Loader2, Lock, PlayCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Daily Check-in Rewards — 7-day streak, +C Coins per day after
 * successfully watching a Unity Rewarded Ad.
 *
 * The parent supplies `onWatchAd()` which resolves `true` only when a
 * rewarded ad has been fully watched (Unity/AdMob native handler).
 */

const REWARDS = [2, 4, 5, 7, 9, 12, 15]; // day 1 → 7
const STORAGE_KEY = "ai-cbp-daily-checkin-v1";
const DAY_MS = 24 * 60 * 60 * 1000;

type CheckinState = {
  /** Last day claimed (1..7). 0 = never claimed. */
  day: number;
  /** Epoch ms of last successful claim. */
  lastClaim: number;
};

function loadState(): CheckinState {
  if (typeof window === "undefined") return { day: 0, lastClaim: 0 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { day: 0, lastClaim: 0 };
    const s = JSON.parse(raw);
    return {
      day: Math.min(7, Math.max(0, Number(s.day) || 0)),
      lastClaim: Number(s.lastClaim) || 0,
    };
  } catch {
    return { day: 0, lastClaim: 0 };
  }
}

function saveState(s: CheckinState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

/** Compute the next day the user is eligible to claim + gating info. */
function computeNext(state: CheckinState, now: number) {
  const { day, lastClaim } = state;
  if (day === 0 || lastClaim === 0) {
    return { nextDay: 1, canClaim: true, resetsStreak: false, timeToNext: 0 };
  }
  const diff = now - lastClaim;
  if (diff < DAY_MS) {
    // already claimed today — locked until 24h from last claim
    const nextDay = day >= 7 ? 1 : day + 1;
    return { nextDay, canClaim: false, resetsStreak: day >= 7, timeToNext: DAY_MS - diff };
  }
  if (diff < 2 * DAY_MS) {
    // continue streak
    const nextDay = day >= 7 ? 1 : day + 1;
    return { nextDay, canClaim: true, resetsStreak: day >= 7, timeToNext: 0 };
  }
  // missed a day — reset
  return { nextDay: 1, canClaim: true, resetsStreak: true, timeToNext: 0 };
}

function formatCountdown(ms: number) {
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function DailyCheckin({
  onWatchAd,
  onEarn,
}: {
  onWatchAd: () => Promise<boolean>;
  onEarn: (coins: number) => void;
}) {
  const [state, setState] = useState<CheckinState>({ day: 0, lastClaim: 0 });
  const [now, setNow] = useState<number>(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [celebrate, setCelebrate] = useState<number | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  // tick every second for countdown
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const info = useMemo(() => computeNext(state, now), [state, now]);
  const todayIdx = info.nextDay - 1; // 0..6

  const handleClaim = async () => {
    if (busy || !info.canClaim) return;
    setBusy(true);
    const t = toast.loading("Loading reward ad…");
    try {
      const watched = await onWatchAd();
      toast.dismiss(t);
      if (!watched) {
        toast.error("Reward ad is not available. Please try again later.");
        return;
      }
      const reward = REWARDS[todayIdx];
      const next: CheckinState = { day: info.nextDay, lastClaim: Date.now() };
      setState(next);
      saveState(next);
      onEarn(reward);
      setCelebrate(reward);
      window.setTimeout(() => setCelebrate(null), 2400);
    } catch {
      toast.dismiss(t);
      toast.error("Reward ad is not available. Please try again later.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border bg-gradient-to-br from-fuchsia-600 via-pink-500 to-amber-400 p-4 text-white shadow-glow">
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-white/15 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/25 backdrop-blur">
            <Gift className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-[10px] font-bold tracking-widest uppercase opacity-90">Daily Check-in</div>
            <div className="font-display text-[17px] font-extrabold">Earn C Coins every day</div>
          </div>
        </div>
        <div className="rounded-full bg-white/25 px-2.5 py-1 text-[11px] font-extrabold backdrop-blur">
          Day {info.nextDay}/7
        </div>
      </div>

      {/* 7-day calendar */}
      <div className="relative mt-4 grid grid-cols-7 gap-1.5">
        {REWARDS.map((reward, i) => {
          const isClaimed =
            // days already covered in this cycle
            (state.day >= i + 1 && !info.resetsStreak) ||
            // if streak resets, nothing is "already claimed" for the new cycle
            false;
          const isToday = i === todayIdx;
          return (
            <div
              key={i}
              className={cn(
                "relative flex flex-col items-center rounded-xl border px-1 pt-1.5 pb-1 text-center",
                isToday
                  ? "border-white bg-white/95 text-fuchsia-700 shadow-pop animate-claim-glow"
                  : isClaimed
                    ? "border-emerald-300/70 bg-emerald-500/25 text-white"
                    : "border-white/25 bg-white/10 text-white/80",
              )}
            >
              <div
                className={cn(
                  "text-[9px] font-black tracking-wider uppercase",
                  isToday ? "text-fuchsia-600" : "opacity-80",
                )}
              >
                D{i + 1}
              </div>
              <div className={cn("font-display text-sm font-extrabold leading-none mt-1", isToday && "text-fuchsia-700")}>
                +{reward}
              </div>
              <div className="mt-1 h-3.5">
                {isClaimed ? (
                  <div className="grid h-3.5 w-3.5 place-items-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                  </div>
                ) : isToday ? (
                  <Sparkles className="h-3.5 w-3.5 text-fuchsia-600" />
                ) : (
                  <Lock className="h-3 w-3 opacity-60" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Claim button / countdown */}
      <div className="relative mt-4">
        {info.canClaim ? (
          <button
            onClick={handleClaim}
            disabled={busy}
            className="tap inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-extrabold text-fuchsia-700 shadow-pop disabled:opacity-70"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Loading ad…
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                Watch Ad & Claim +{REWARDS[todayIdx]} C Coins
              </>
            )}
          </button>
        ) : (
          <div className="rounded-2xl bg-white/20 py-3 text-center backdrop-blur">
            <div className="text-[10px] font-bold tracking-widest uppercase opacity-90">Next reward in</div>
            <div className="font-display mt-0.5 text-lg font-extrabold tabular-nums">
              {formatCountdown(info.timeToNext)}
            </div>
            <div className="mt-0.5 text-[10px] opacity-90">
              Come back for Day {info.nextDay} → +{REWARDS[todayIdx]} C Coins
            </div>
          </div>
        )}
      </div>

      {/* Success burst */}
      {celebrate !== null && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="animate-checkin-burst rounded-3xl bg-white/95 px-5 py-4 text-center text-fuchsia-700 shadow-glow">
            <div className="font-display text-lg font-extrabold">🎉 Congratulations!</div>
            <div className="mt-1 text-sm font-bold">You earned +{celebrate} C Coins</div>
          </div>
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="animate-confetti absolute top-0 h-2 w-2 rounded-sm"
              style={{
                left: `${(i * 7 + 5) % 95}%`,
                background: ["#FFBE0B", "#FF006E", "#3A86FF", "#8338EC", "#22c55e"][i % 5],
                animationDelay: `${(i % 5) * 90}ms`,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default DailyCheckin;
