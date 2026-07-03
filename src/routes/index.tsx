import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Instagram,
  Music2,
  Linkedin,
  Youtube,
  Twitter,
  Copy,
  Check,
  Heart,
  Trash2,
  Loader2,
  Wand2,
  Smile,
  Hash,
  Settings as SettingsIcon,
  Flame,
  TrendingUp,
  Zap,
  Crown,
  Rocket,
  Quote,
  Home as HomeIcon,
  Bookmark,
  Plus,
  ChevronLeft,
  Send,
  Globe,
  Shield,
  HelpCircle,
  Mail,
  FileText,
  ChevronRight,
  BarChart3,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";

type ThemeMode = "light" | "dark" | "system";
const THEME_KEY = "ai-cbp-theme-v1";

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const isDark = mode === "dark" || (mode === "system" && prefersDark);
  root.classList.toggle("dark", isDark);
}

function useTheme(): [ThemeMode, (m: ThemeMode) => void] {
  const [mode, setMode] = useState<ThemeMode>("system");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = (window.localStorage.getItem(THEME_KEY) as ThemeMode | null) ?? "system";
    setMode(saved);
    applyTheme(saved);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const cur = (window.localStorage.getItem(THEME_KEY) as ThemeMode | null) ?? "system";
      if (cur === "system") applyTheme("system");
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  const update = (m: ThemeMode) => {
    setMode(m);
    try {
      window.localStorage.setItem(THEME_KEY, m);
    } catch {}
    applyTheme(m);
  };
  return [mode, update];
}

import { toast, Toaster } from "sonner";
import { generateContent, type GenerateResult } from "@/lib/generate.functions";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { AdsterraNative } from "@/components/AdsterraNative";
import { DailyCheckin } from "@/components/DailyCheckin";
import {
  showBanner,
  hideBanner,
  maybeShowInterstitial,
  showRewarded,
  preloadRewarded,
  onRewardedReadyChange,
  isRewardedReady,
} from "@/lib/ads";

const APP_VERSION = "1.0.0";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Caption & Bio Generator Pro — AI for IG, TikTok, LinkedIn, X" },
      {
        name: "description",
        content:
          "Generate scroll-stopping captions and bios for Instagram, TikTok, LinkedIn and X with AI. Pick a tone, add emojis & hashtags, save favorites.",
      },
      { property: "og:title", content: "Caption & Bio Generator Pro" },
      {
        property: "og:description",
        content: "AI-powered captions and bios for every platform.",
      },
    ],
  }),
  component: Home,
});

type Mode = "caption" | "bio";
type Platform = "instagram" | "tiktok" | "linkedin" | "twitter" | "youtube";
type Tab = "home" | "generate" | "saved" | "settings";

const PLATFORMS: { id: Platform; label: string; Icon: typeof Instagram }[] = [
  { id: "instagram", label: "Instagram", Icon: Instagram },
  { id: "tiktok", label: "TikTok", Icon: Music2 },
  { id: "youtube", label: "YouTube", Icon: Youtube },
  { id: "linkedin", label: "LinkedIn", Icon: Linkedin },
  { id: "twitter", label: "Twitter / X", Icon: Twitter },
];

const TONES = [
  "Witty", "Professional", "Inspirational", "Casual", "Bold",
  "Funny", "Romantic", "Mysterious", "Minimalist", "Hype",
];

const QUICK_PROMPTS: { label: string; emoji: string; mode: Mode; platform: Platform; tone: string; topic: string }[] = [
  { label: "Product launch", emoji: "🚀", mode: "caption", platform: "instagram", tone: "Hype", topic: "Brand new product launch — exciting feature drop today" },
  { label: "Travel reel", emoji: "✈️", mode: "caption", platform: "tiktok", tone: "Inspirational", topic: "Sunset views from a hidden beach in Goa" },
  { label: "LinkedIn win", emoji: "💼", mode: "caption", platform: "linkedin", tone: "Professional", topic: "Just hit a major career milestone after months of work" },
  { label: "Founder bio", emoji: "👤", mode: "bio", platform: "twitter", tone: "Bold", topic: "Indie founder building AI tools for creators" },
  { label: "Fitness post", emoji: "💪", mode: "caption", platform: "instagram", tone: "Bold", topic: "30-day workout transformation results" },
  { label: "Coffee aesthetic", emoji: "☕", mode: "caption", platform: "instagram", tone: "Minimalist", topic: "Morning coffee ritual flat lay" },
];

const TRENDING_TAGS = [
  "#viral", "#fyp", "#reels", "#trending", "#explore", "#contentcreator",
  "#aesthetic", "#mood", "#vibes", "#instagood", "#photooftheday", "#love",
  "#instadaily", "#tiktokmademebuyit", "#smallbusiness", "#ootd", "#foodie",
  "#travel", "#fitness", "#motivation", "#bookstagram", "#art",
];

const CAPTIONS_OF_DAY = [
  { text: "Be the energy you want to attract.", tags: ["#mindset", "#vibes", "#energy"] },
  { text: "Plot twist: I'm the main character.", tags: ["#mood", "#confidence", "#viral"] },
  { text: "Soft life, sharp goals.", tags: ["#softlife", "#hustle", "#aesthetic"] },
  { text: "Caught in 4K living my best life.", tags: ["#mainCharacter", "#fyp", "#vibes"] },
  { text: "Not everyone you lose is a loss.", tags: ["#growth", "#mindset", "#deep"] },
  { text: "Manifesting > stressing.", tags: ["#manifest", "#mindset", "#peace"] },
  { text: "Less talk, more receipts.", tags: ["#hustle", "#grindset", "#bold"] },
];

type Kind = "hook" | "hashtag" | "caption" | "bio";

const PLATFORM_CARDS: {
  platform: Platform;
  label: string;
  sub: string;
  Icon: typeof Sparkles;
  gradient: string;
}[] = [
  { platform: "instagram", label: "Instagram", sub: "Reels • Posts • Bio", Icon: Instagram, gradient: "linear-gradient(135deg,#FF006E,#8338EC,#FFBE0B)" },
  { platform: "tiktok", label: "TikTok", sub: "Hooks that go viral", Icon: Music2, gradient: "linear-gradient(135deg,#000000,#FF006E,#3A86FF)" },
  { platform: "linkedin", label: "LinkedIn", sub: "Pro posts & headlines", Icon: Linkedin, gradient: "linear-gradient(135deg,#0a66c2,#3A86FF,#8338EC)" },
  { platform: "twitter", label: "Twitter / X", sub: "Sharp tweets & bios", Icon: Twitter, gradient: "linear-gradient(135deg,#1a1a1a,#3A86FF,#000000)" },
  { platform: "youtube", label: "YouTube", sub: "Titles • Hooks • About", Icon: Youtube, gradient: "linear-gradient(135deg,#FF0000,#8B0000,#1a1a1a)" },
];

const PLATFORM_KIND_LABELS: Record<Platform, Record<Kind, { title: string; sub: string; tone: string; seed: string }>> = {
  instagram: {
    hook:     { title: "Instagram Viral Hook",  sub: "Scroll-stopping first line", tone: "Bold",          seed: "Scroll-stopping Instagram Reel hook about " },
    hashtag:  { title: "Instagram Hashtags",    sub: "Boost reach on Reels & posts", tone: "Hype",         seed: "Top trending Instagram hashtags for a post about " },
    caption:  { title: "Instagram Caption",     sub: "Aesthetic + engaging",      tone: "Witty",         seed: "Instagram caption for a post about " },
    bio:      { title: "Instagram Bio",         sub: "Magnetic first impression", tone: "Minimalist",    seed: "Instagram bio for " },
  },
  tiktok: {
    hook:     { title: "TikTok Viral Hook",     sub: "3-second attention grab",   tone: "Hype",          seed: "TikTok 3-second viral hook about " },
    hashtag:  { title: "TikTok Hashtags",       sub: "FYP-ready tag pack",        tone: "Bold",          seed: "Trending TikTok FYP hashtags for a video about " },
    caption:  { title: "TikTok Caption",        sub: "Short & punchy",            tone: "Funny",         seed: "Short punchy TikTok caption about " },
    bio:      { title: "TikTok Bio",            sub: "Profile that converts",     tone: "Bold",          seed: "TikTok bio for " },
  },
  linkedin: {
    hook:     { title: "LinkedIn Hook",         sub: "Stops the scroll, pro tone", tone: "Professional", seed: "LinkedIn opening hook for a post about " },
    hashtag:  { title: "LinkedIn Hashtags",     sub: "Niche professional tags",   tone: "Professional",  seed: "Relevant LinkedIn hashtags for a post about " },
    caption:  { title: "LinkedIn Post",         sub: "Storytelling that wins",    tone: "Inspirational", seed: "LinkedIn post about " },
    bio:      { title: "LinkedIn Headline / Bio", sub: "Position you as expert",  tone: "Professional",  seed: "LinkedIn headline and about-section for " },
  },
  twitter: {
    hook:     { title: "X / Twitter Hook",      sub: "Thread opener that hits",   tone: "Bold",          seed: "Twitter / X thread opening hook about " },
    hashtag:  { title: "X / Twitter Hashtags",  sub: "1-3 sharp tags",            tone: "Minimalist",    seed: "Best 1-3 Twitter / X hashtags for a tweet about " },
    caption:  { title: "Tweet",                 sub: "Under 280, sharp",          tone: "Witty",         seed: "Short sharp tweet about " },
    bio:      { title: "X / Twitter Bio",       sub: "Founder-grade one-liner",   tone: "Bold",          seed: "Twitter / X bio for " },
  },
  youtube: {
    hook:     { title: "YouTube Hook",          sub: "First 10 seconds matter",   tone: "Bold",          seed: "YouTube video opening hook (first 10 seconds) about " },
    hashtag:  { title: "YouTube Tags",          sub: "SEO + discoverability",     tone: "Professional",  seed: "Best YouTube SEO tags and hashtags for a video about " },
    caption:  { title: "YouTube Title + Desc",  sub: "High-CTR title & description", tone: "Hype",       seed: "Click-worthy YouTube title and description for a video about " },
    bio:      { title: "YouTube Channel About", sub: "Channel description",       tone: "Inspirational", seed: "YouTube channel about-section / bio for " },
  },
};

const KIND_META: { kind: Kind; label: string; Icon: typeof Sparkles; tint: string }[] = [
  { kind: "hook",    label: "Viral Hook", Icon: Flame,    tint: "from-orange-500 to-pink-600" },
  { kind: "hashtag", label: "Hashtags",   Icon: Hash,     tint: "from-pink-500 to-fuchsia-600" },
  { kind: "caption", label: "Caption",    Icon: Quote,    tint: "from-fuchsia-500 to-violet-600" },
  { kind: "bio",     label: "Bio",        Icon: Crown,    tint: "from-amber-500 to-pink-500" },
];

type SavedItem = {
  id: string;
  mode: Mode;
  platform: Platform;
  tone: string;
  text: string;
  hashtags: string[];
  savedAt: number;
};

const STORAGE_KEY = "ai-caption-bio-pro-favorites-v1";

function Home() {
  const generate = useServerFn(generateContent);

  const [tab, setTab] = useState<Tab>("home");
  const [mode, setMode] = useState<Mode>("caption");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [kind, setKind] = useState<Kind>("caption");
  const [tone, setTone] = useState("Witty");
  const [topic, setTopic] = useState("");
  const [useEmoji, setUseEmoji] = useState(true);
  const [useHashtags, setUseHashtags] = useState(true);
  const [language, setLanguage] = useState<"english" | "hindi" | "gujarati">("english");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [favorites, setFavorites] = useState<SavedItem[]>([]);
  const [showSplash, setShowSplash] = useState(true);
  const [streak, setStreak] = useState({ count: 0, generated: 0 });
  const [sheetPlatform, setSheetPlatform] = useState<Platform | null>(null);
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const [premiumCredits, setPremiumCredits] = useState(0);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [rewardReady, setRewardReady] = useState(false);
  const isNative = useMemo(() => {
    if (typeof window === "undefined") return false;
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    return !!cap?.isNativePlatform?.();
  }, []);

  // Subscribe to rewarded-ad readiness from the native AdMob SDK.
  // On web this stays false (button shows "Ad unavailable").
  useEffect(() => {
    setRewardReady(isRewardedReady());
    const off = onRewardedReadyChange(setRewardReady);
    void preloadRewarded();
    return off;
  }, []);

  const resultsRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Start the native AdMob bottom banner for the whole APK session.
  // On web this is a safe no-op; Adsterra handles the web sponsored slot.
  useEffect(() => {
    let cancelled = false;

    const startBanner = () => {
      showBanner().then((shown) => {
        if (cancelled && shown) hideBanner();
      });
    };

    startBanner();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") startBanner();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      hideBanner();
    };
  }, []);

  // Splash 1.6s
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1600);
    return () => clearTimeout(t);
  }, []);

  // Streak tracking
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("ai-cbp-streak-v1");
      const today = new Date().toDateString();
      if (raw) {
        const s = JSON.parse(raw);
        const last = new Date(s.lastDate).toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        let count = s.count ?? 0;
        if (last === today) {
          // same day
        } else if (last === yesterday) {
          count += 1;
        } else {
          count = 1;
        }
        const next = { count, generated: s.generated ?? 0, lastDate: today };
        window.localStorage.setItem("ai-cbp-streak-v1", JSON.stringify(next));
        setStreak({ count, generated: next.generated });
      } else {
        const next = { count: 1, generated: 0, lastDate: today };
        window.localStorage.setItem("ai-cbp-streak-v1", JSON.stringify(next));
        setStreak({ count: 1, generated: 0 });
      }
    } catch {}
  }, []);

  const bumpGenerated = () => {
    try {
      const raw = window.localStorage.getItem("ai-cbp-streak-v1");
      const s = raw ? JSON.parse(raw) : { count: 1, generated: 0, lastDate: new Date().toDateString() };
      const next = { ...s, generated: (s.generated ?? 0) + 1 };
      window.localStorage.setItem("ai-cbp-streak-v1", JSON.stringify(next));
      setStreak({ count: next.count, generated: next.generated });
    } catch {}
  };

  // C Coin economy — start with 20, -2 per generation, +10 per rewarded ad
  const COINS_KEY = "ai-cbp-ccoins-v1";
  const START_COINS = 20;
  const COIN_COST = 2;
  const COIN_REWARD = 10;
  const [coins, setCoins] = useState<number>(START_COINS);
  const [coinPulse, setCoinPulse] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(COINS_KEY);
      if (raw === null) {
        window.localStorage.setItem(COINS_KEY, String(START_COINS));
        setCoins(START_COINS);
      } else {
        setCoins(Math.max(0, parseInt(raw, 10) || 0));
      }
    } catch {}
  }, []);
  const writeCoins = (n: number) => {
    const v = Math.max(0, Math.round(n));
    setCoins(v);
    setCoinPulse((p) => p + 1);
    try {
      window.localStorage.setItem(COINS_KEY, String(v));
    } catch {}
  };
  const addCoins = (delta: number) => {
    setCoins((prev) => {
      const v = Math.max(0, Math.round(prev + delta));
      setCoinPulse((p) => p + 1);
      try {
        window.localStorage.setItem(COINS_KEY, String(v));
      } catch {}
      return v;
    });
  };
  // Keep existing premium-credit references neutral (no longer gating UI).
  const setCredits = (_n: number) => {};

  /**
   * Try to show a rewarded ad (Unity / AdMob via APK wrapper).
   * Returns true only if the ad was watched to completion.
   * On web preview where no native SDK exists, we simulate a short
   * ad so the flow is testable end-to-end — real APK uses Unity Ads.
   */
  const runRewardedAd = async (): Promise<boolean> => {
    try {
      return await showRewarded();
    } catch {
      return false;
    }
  };


  // Favorites
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (items: SavedItem[]) => {
    setFavorites(items);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    requestAnimationFrame(() => {
      scrollerRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    });
  };

  const openGenerate = (m?: Mode, p?: Platform, t?: string, topicSeed?: string) => {
    if (m) setMode(m);
    if (p) setPlatform(p);
    if (t) setTone(t);
    if (topicSeed !== undefined) setTopic(topicSeed);
    switchTab("generate");
  };

  const pickKind = (p: Platform, k: Kind) => {
    const meta = PLATFORM_KIND_LABELS[p][k];
    setPlatform(p);
    setKind(k);
    setMode(k === "bio" ? "bio" : "caption");
    setTone(meta.tone);
    setTopic(meta.seed);
    setSheetPlatform(null);
    switchTab("generate");
  };

  const onGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Topic ya description likho pehle ✨");
      return;
    }
    if (coins < COIN_COST) {
      toast.error("Not enough C Coins. Watch an ad to earn more.");
      return;
    }
    setLoading(true);
    setResult(null);
    setPremiumUnlocked(true);
    try {
      const res = await generate({
        data: { kind, platform, tone, topic: topic.trim(), useEmoji, language },
      });
      setResult(res);
      bumpGenerated();
      writeCoins(coins - COIN_COST);
      toast.success(`−${COIN_COST} C Coins spent`);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      maybeShowInterstitial();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyItem = async (text: string, hashtags: string[]) => {
    const full = hashtags.length ? `${text}\n\n${hashtags.join(" ")}` : text;
    try {
      await navigator.clipboard.writeText(full);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const saveItem = (text: string, hashtags: string[]) => {
    const item: SavedItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      mode, platform, tone, text, hashtags, savedAt: Date.now(),
    };
    persist([item, ...favorites].slice(0, 100));
    toast.success("Saved to favorites ❤️");
  };

  const removeFav = (id: string) => persist(favorites.filter((f) => f.id !== id));
  const clearFavs = () => persist([]);

  const onUnlockPremium = async () => {
    if (rewardLoading) return;
    setRewardLoading(true);
    const loadingToast = toast.loading("Loading ad…");
    try {
      const ok = await runRewardedAd();
      toast.dismiss(loadingToast);
      if (ok) {
        const next = coins + COIN_REWARD;
        writeCoins(next);
        toast.success(`+${COIN_REWARD} C Coins earned! Balance: ${next}`);
      } else {
        toast.error("Reward ad is not available. Please try again later.");
      }
    } finally {
      toast.dismiss(loadingToast);
      setRewardLoading(false);
    }
  };


  const captionOfDay = useMemo(() => {
    const day = Math.floor(Date.now() / 86400000);
    return CAPTIONS_OF_DAY[day % CAPTIONS_OF_DAY.length];
  }, []);

  const placeholder = useMemo(
    () =>
      mode === "bio"
        ? "e.g. Travel photographer from Mumbai capturing untold stories. Coffee addict."
        : "e.g. New product drop — wireless earbuds with 40hr battery, launching this Friday",
    [mode],
  );

  const screenTitle: Record<Tab, string> = {
    home: "CaptionLab",
    generate: "Generate",
    saved: "Saved",
    settings: "Settings",
  };

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[480px] overflow-hidden">
      <Toaster position="bottom-center" richColors offset={96} />
      {showSplash && <SplashScreen />}

      {/* Top app bar — compact native style */}
      <header className="sticky top-0 z-30 glass border-b">
        <div className="flex items-center justify-between px-4 pt-3 pb-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {tab !== "home" ? (
              <button
                onClick={() => switchTab("home")}
                aria-label="Back"
                className="tap grid h-10 w-10 place-items-center rounded-full bg-muted active:bg-muted/70"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : (
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl shadow-pop ring-1 ring-white/20">
                <img src={logo} alt="CaptionLab" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="min-w-0 leading-tight">
              <div className="font-display truncate text-[17px] font-bold tracking-tight">
                {screenTitle[tab]}
              </div>
              {tab === "home" && (
                <div className="text-muted-foreground text-[11px] font-medium">PRO • AI Studio</div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {tab === "home" && (
              <div className="glass inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-bold">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                {streak.count}
              </div>
            )}
            {/* C Coin balance badge — animates on change */}
            <div
              key={coinPulse}
              aria-label={`${coins} C Coins`}
              className="animate-coin-pop inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 px-2.5 py-1.5 text-[11px] font-extrabold text-white shadow-pop"
            >
              <span className="grid h-4 w-4 place-items-center rounded-full bg-white/90 text-[9px] font-black text-orange-600">C</span>
              {coins}
            </div>
            <button
              onClick={() => switchTab("settings")}
              aria-label="Settings"
              className="tap glass grid h-10 w-10 place-items-center rounded-full border"
            >
              <SettingsIcon className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable screen area */}
      <main ref={scrollerRef} className="pb-28">
        {tab === "home" && (
          <HomeScreen
            key="home"
            streak={streak}
            captionOfDay={captionOfDay}
            onOpenGenerate={openGenerate}
            onOpenPlatform={(p) => setSheetPlatform(p)}
            onCopy={copyItem}
            onSeedTopic={(t) => openGenerate(undefined, undefined, undefined, t)}
            onSaved={() => switchTab("saved")}
            favoritesCount={favorites.length}
            premiumCredits={premiumCredits}
            rewardLoading={rewardLoading}
            rewardReady={rewardReady}
            isNative={isNative}
            onUnlockPremium={onUnlockPremium}
            onWatchAd={runRewardedAd}
            onEarnCoins={addCoins}
          />
        )}

        {tab === "generate" && (
          <GenerateScreen
            key="generate"
            mode={mode}
            platform={platform}
            kind={kind}
            tone={tone}
            topic={topic}
            useEmoji={useEmoji}
            useHashtags={useHashtags}
            language={language}
            setLanguage={setLanguage}
            loading={loading}
            result={result}
            placeholder={placeholder}
            setMode={setMode}
            setPlatform={setPlatform}
            setTone={setTone}
            setTopic={setTopic}
            setUseEmoji={setUseEmoji}
            setUseHashtags={setUseHashtags}
            onPickKind={pickKind}
            onGenerate={onGenerate}
            onCopy={copyItem}
            onSave={saveItem}
            resultsRef={resultsRef}
            premiumUnlocked={premiumUnlocked}
            rewardLoading={rewardLoading}
            rewardReady={rewardReady}
            onUnlockPremium={onUnlockPremium}
            isNative={isNative}
            coins={coins}
            coinCost={COIN_COST}
          />
        )}

        {tab === "saved" && (
          <SavedScreen
            key="saved"
            favorites={favorites}
            onCopy={copyItem}
            onRemove={removeFav}
            onClear={clearFavs}
            onGoGenerate={() => switchTab("generate")}
          />
        )}

        {tab === "settings" && (
          <SettingsScreen
            key="settings"
            streak={streak}
            favoritesCount={favorites.length}
          />
        )}
      </main>

      {/* FAB — only on Home & Saved */}
      {(tab === "home" || tab === "saved") && (
        <button
          onClick={() => switchTab("generate")}
          aria-label="Quick generate"
          className="tap fixed bottom-24 right-4 z-40 grid h-16 w-16 place-items-center rounded-full bg-gradient-brand text-white shadow-glow animate-fab"
          style={{ right: "max(1rem, calc((100vw - 480px) / 2 + 1rem))" }}
        >
          <Plus className="h-7 w-7" strokeWidth={2.6} />
          <span className="pointer-events-none absolute inset-0 rounded-full animate-pulse-ring" />
        </button>
      )}

      {/* Floating bottom tab bar */}
      <nav
        className="fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 px-3 safe-bottom"
      >
        <div className="glass-strong mb-2 grid grid-cols-4 rounded-[1.75rem] border p-1.5 shadow-glow">
          <TabBtn icon={<HomeIcon />} label="Home" active={tab === "home"} onClick={() => switchTab("home")} />
          <TabBtn icon={<Sparkles />} label="Generate" active={tab === "generate"} onClick={() => switchTab("generate")} accent />
          <TabBtn
            icon={<Bookmark />}
            label="Saved"
            badge={favorites.length}
            active={tab === "saved"}
            onClick={() => switchTab("saved")}
          />
          <TabBtn icon={<SettingsIcon />} label="Settings" active={tab === "settings"} onClick={() => switchTab("settings")} />
        </div>
      </nav>

      {/* Platform bottom sheet */}
      {sheetPlatform && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSheetPlatform(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative mx-auto w-full max-w-[480px] rounded-t-[2rem] glass-strong border-t p-5 pb-8 shadow-glow"
            style={{ animation: "pop-in 0.25s ease-out" }}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            {(() => {
              const card = PLATFORM_CARDS.find((c) => c.platform === sheetPlatform)!;
              return (
                <>
                  <div className="flex items-center gap-3">
                    <div
                      className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-pop"
                      style={{ background: card.gradient }}
                    >
                      <card.Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-display text-lg font-bold leading-tight">{card.label}</div>
                      <div className="text-muted-foreground text-xs">Pick what you need</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {KIND_META.map((k) => {
                      const meta = PLATFORM_KIND_LABELS[sheetPlatform][k.kind];
                      return (
                        <button
                          key={k.kind}
                          onClick={() => pickKind(sheetPlatform, k.kind)}
                          className={cn(
                            "tap relative overflow-hidden rounded-2xl p-4 text-left text-white shadow-pop bg-gradient-to-br",
                            k.tint,
                          )}
                        >
                          <div className="pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full bg-white/25 blur-2xl" />
                          <div className="relative">
                            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/25 backdrop-blur">
                              <k.Icon className="h-4 w-4" />
                            </div>
                            <div className="font-display mt-3 text-sm font-bold leading-tight">{meta.title}</div>
                            <div className="text-[10px] opacity-90">{meta.sub}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   HOME SCREEN
   ============================================================ */
function HomeScreen({
  streak,
  captionOfDay,
  onOpenGenerate,
  onOpenPlatform,
  onCopy,
  onSeedTopic,
  onSaved,
  favoritesCount,
  onWatchAd,
  onEarnCoins,
}: {
  streak: { count: number; generated: number };
  captionOfDay: (typeof CAPTIONS_OF_DAY)[number];
  onOpenGenerate: (m?: Mode, p?: Platform, t?: string, topic?: string) => void;
  onOpenPlatform: (p: Platform) => void;
  onCopy: (text: string, tags: string[]) => void;
  onSeedTopic: (t: string) => void;
  onSaved: () => void;
  favoritesCount: number;
  premiumCredits?: number;
  rewardLoading?: boolean;
  rewardReady?: boolean;
  onUnlockPremium?: () => void;
  isNative?: boolean;
  onWatchAd: () => Promise<boolean>;
  onEarnCoins: (delta: number) => void;
}) {
  return (
    <div className="screen-enter space-y-4 px-4 pt-4">


      {/* Stat strip */}
      <section className="grid grid-cols-2 gap-3">
        <MiniStat icon={<Flame className="h-5 w-5" />} label="Day streak" value={String(streak.count)} tint="sun" />
        <MiniStat icon={<Sparkles className="h-5 w-5" />} label="Generated" value={String(streak.generated)} tint="brand" />
      </section>

      {/* Daily Check-in Rewards — Unity Rewarded Ad flow */}
      <DailyCheckin onWatchAd={onWatchAd} onEarn={onEarnCoins} />




      {/* Quick prompts — horizontal swipe rail */}
      <section>
        <SectionTitle eyebrow="One-tap ideas" title="Try a vibe" />
        <div className="scroll-rail -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q.label}
              onClick={() => onOpenGenerate(q.mode, q.platform, q.tone, q.topic)}
              className="tap glass-strong shrink-0 rounded-2xl border px-4 py-3 text-left shadow-pop"
            >
              <div className="text-2xl leading-none">{q.emoji}</div>
              <div className="font-display mt-2 text-sm font-bold">{q.label}</div>
              <div className="text-muted-foreground text-[11px]">{q.tone}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Caption of the day */}
      <section className="relative overflow-hidden rounded-2xl glass-strong p-3 shadow-glow">
        <div className="bg-gradient-brand absolute inset-x-0 top-0 h-0.5" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="bg-gradient-brand grid h-6 w-6 place-items-center rounded-lg shadow-pop">
              <Quote className="h-3 w-3 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-muted-foreground text-[8px] font-bold tracking-widest uppercase">Caption of the day</div>
              <div className="font-display text-[11px] font-bold">Daily inspiration</div>
            </div>
          </div>
          <span className="bg-gradient-sun rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white uppercase">Viral</span>
        </div>
        <p className="font-display mt-2 text-[13px] leading-snug font-semibold">
          "{captionOfDay.text}"
        </p>
        <p className="text-primary mt-1 text-[10px] font-medium">{captionOfDay.tags.join(" ")}</p>
        <div className="mt-2 flex gap-1.5">
          <button
            onClick={() => onCopy(captionOfDay.text, captionOfDay.tags)}
            className="tap inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-foreground py-1.5 text-[10px] font-bold text-background"
          >
            <Copy className="h-3 w-3" /> Copy
          </button>
          <button
            onClick={() => onSeedTopic(captionOfDay.text)}
            className="tap inline-flex flex-1 items-center justify-center gap-1 rounded-full glass border py-1.5 text-[10px] font-bold"
          >
            <Wand2 className="h-3 w-3" /> Remix
          </button>
        </div>
      </section>


      {/* Trending hashtags marquee */}
      <section>
        <SectionTitle eyebrow="Trending now" title="Hot hashtags" Icon={TrendingUp} />
        <div className="glass relative -mx-4 overflow-hidden border-y py-3">
          <div className="flex w-max animate-marquee gap-2 pr-2 pl-4">
            {[...TRENDING_TAGS, ...TRENDING_TAGS].map((tag, i) => (
              <button
                key={i}
                onClick={() => {
                  navigator.clipboard.writeText(tag).then(() => toast.success(`Copied ${tag}`)).catch(() => {});
                }}
                className="tap bg-background/80 shrink-0 rounded-full border px-4 py-2 text-xs font-semibold"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Platform cards — tap a platform to unlock its Hook / Hashtag / Caption / Bio */}
      <section>
        <SectionTitle eyebrow="Pick a platform" title="Tailored for each app" />
        <div className="grid grid-cols-2 gap-3">
          {PLATFORM_CARDS.map((p) => (
            <button
              key={p.platform}
              onClick={() => onOpenPlatform(p.platform)}
              className="tap group relative overflow-hidden rounded-2xl p-4 text-left text-white shadow-pop"
              style={{ background: p.gradient }}
            >
              <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/25 blur-2xl" />
              <div className="relative">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/25 backdrop-blur">
                  <p.Icon className="h-5 w-5" />
                </div>
                <div className="font-display mt-5 text-[15px] font-bold leading-tight">{p.label}</div>
                <div className="mt-0.5 text-[11px] opacity-90">{p.sub}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {KIND_META.map((k) => (
                    <span key={k.kind} className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide backdrop-blur">
                      {k.label}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Streak card */}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-orange-500 via-pink-500 to-fuchsia-600 p-5 text-white shadow-glow">
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase backdrop-blur">
            <Flame className="h-3 w-3" /> Creator Streak
          </div>
          <div className="font-display mt-3 text-6xl font-bold leading-none">
            {streak.count}
            <span className="ml-1 text-2xl font-semibold opacity-80">d</span>
          </div>
          <p className="mt-2 text-sm opacity-90">
            {streak.count > 1 ? "You're on fire 🔥 keep posting daily." : "Generate today to start your streak."}
          </p>
          <div className="mt-4 flex gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 flex-1 rounded-full",
                  i < Math.min(streak.count, 7) ? "bg-white" : "bg-white/25",
                )}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Saved shortcut */}
      <button
        onClick={onSaved}
        className="tap relative flex w-full items-center gap-3 rounded-2xl glass border p-4 text-left"
      >
        <div className="bg-gradient-sun grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-pop">
          <Heart className="h-5 w-5 fill-current" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[15px] font-bold">My Saves</div>
          <div className="text-muted-foreground text-xs">
            {favoritesCount === 0 ? "Nothing saved yet" : `${favoritesCount} favorites`}
          </div>
        </div>
        <ChevronLeft className="h-5 w-5 rotate-180 opacity-50" />
      </button>

      {/* Web sponsored slot (Adsterra). AdMob banner is handled by AppCreator24 wrapper in APK. */}
      <AdsterraNative />


    </div>
  );
}

/* ============================================================
   GENERATE SCREEN (single hub)
   ============================================================ */
function GenerateScreen(props: {
  mode: Mode;
  platform: Platform;
  kind: Kind;
  tone: string;
  topic: string;
  useEmoji: boolean;
  useHashtags: boolean;
  language: "english" | "hindi" | "gujarati";
  setLanguage: (l: "english" | "hindi" | "gujarati") => void;
  loading: boolean;
  result: GenerateResult | null;
  placeholder: string;
  setMode: (m: Mode) => void;
  setPlatform: (p: Platform) => void;
  setTone: (t: string) => void;
  setTopic: (s: string) => void;
  setUseEmoji: (fn: (v: boolean) => boolean) => void;
  setUseHashtags: (fn: (v: boolean) => boolean) => void;
  onPickKind: (p: Platform, k: Kind) => void;
  onGenerate: () => void;
  onCopy: (text: string, tags: string[]) => void;
  onSave: (text: string, tags: string[]) => void;
  resultsRef: React.MutableRefObject<HTMLDivElement | null>;
  premiumUnlocked: boolean;
  rewardLoading: boolean;
  rewardReady: boolean;
  onUnlockPremium: () => void;
  isNative: boolean;
  coins: number;
  coinCost: number;
}) {
  const {
    mode, platform, kind, tone, topic, useEmoji, useHashtags, language, loading, result, placeholder,
    setMode, setPlatform, setTone, setTopic, setUseEmoji, setUseHashtags, setLanguage,
    onPickKind, onGenerate, onCopy, onSave, resultsRef,
    premiumUnlocked, rewardLoading, rewardReady, onUnlockPremium, isNative,
    coins, coinCost,
  } = props;


  return (
    <div className="screen-enter space-y-4 px-4 pt-4">
      {/* Mode pill switch — large, native */}
      <div className="bg-muted grid grid-cols-2 rounded-2xl p-1.5">
        {(["caption", "bio"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "tap rounded-xl py-3 text-sm font-bold capitalize",
              mode === m
                ? "bg-gradient-brand text-white shadow-pop"
                : "text-muted-foreground",
            )}
          >
            {m === "caption" ? "✍️ Caption" : "👤 Bio"}
          </button>
        ))}
      </div>

      {/* Content kind chips — specific to the chosen platform */}
      <div>
        <SectionTitle eyebrow={`${PLATFORM_CARDS.find(p=>p.platform===platform)?.label} tools`} title="What do you want to create?" />
        <div className="grid grid-cols-2 gap-3">
          {KIND_META.map((k) => {
            const active = kind === k.kind;
            const meta = PLATFORM_KIND_LABELS[platform][k.kind];
            return (
              <button
                key={k.kind}
                onClick={() => onPickKind(platform, k.kind)}
                className={cn(
                  "tap relative overflow-hidden rounded-2xl p-4 text-left text-white shadow-pop bg-gradient-to-br",
                  k.tint,
                  active ? "ring-4 ring-white/60 scale-[0.98]" : "",
                )}
              >
                <div className="pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full bg-white/25 blur-2xl" />
                <div className="relative">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/25 backdrop-blur">
                    <k.Icon className="h-4 w-4" />
                  </div>
                  <div className="font-display mt-3 text-sm font-bold leading-tight">{meta.title}</div>
                  <div className="text-[10px] opacity-90">{meta.sub}</div>
                  {active && (
                    <div className="absolute top-0 right-0 grid h-6 w-6 place-items-center rounded-full bg-white text-foreground">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Platform chips (compact native row) */}
      <div>
        <Label>Platform</Label>
        <div className="grid grid-cols-5 gap-2">
          {PLATFORMS.map(({ id, label, Icon }) => {
            const active = platform === id;
            return (
              <button
                key={id}
                onClick={() => setPlatform(id)}
                className={cn(
                  "tap flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-[10px] font-bold",
                  active
                    ? "bg-gradient-brand border-transparent text-white shadow-pop"
                    : "bg-card text-foreground",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={2.2} />
                <span className="truncate">{label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Language */}
      <div>
        <Label>Language</Label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: "english", label: "English", flag: "🇬🇧" },
            { id: "hindi", label: "हिंदी", flag: "🇮🇳" },
            { id: "gujarati", label: "ગુજરાતી", flag: "🇮🇳" },
          ] as const).map((l) => {
            const active = language === l.id;
            return (
              <button
                key={l.id}
                onClick={() => setLanguage(l.id)}
                className={cn(
                  "tap flex items-center justify-center gap-1.5 rounded-2xl border py-2.5 text-sm font-bold",
                  active
                    ? "bg-gradient-brand border-transparent text-white shadow-pop"
                    : "bg-card text-foreground",
                )}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tone — horizontal scroll rail */}
      <div>
        <Label>Tone</Label>
        <div className="scroll-rail -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {TONES.map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={cn(
                "tap shrink-0 rounded-full border px-4 py-2 text-sm font-semibold",
                tone === t
                  ? "bg-foreground text-background border-transparent shadow-pop"
                  : "bg-card",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Emoji toggle */}
      {kind !== "hashtag" && (
        <div>
          <Label>Style</Label>
          <ToggleChip
            active={useEmoji}
            onClick={() => setUseEmoji((v) => !v)}
            Icon={Smile}
            label="Emojis"
          />
        </div>
      )}


      {/* Topic input */}
      <div>
        <Label>
          {kind === "bio"
            ? "About you / brand"
            : kind === "hashtag"
              ? "What's the post about?"
              : kind === "hook"
                ? "Video / post idea"
                : "What's the post about?"}
        </Label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={placeholder}
          rows={5}
          maxLength={1000}
          className="bg-card focus:border-primary focus:ring-primary/20 w-full resize-none rounded-2xl border px-4 py-3.5 text-[15px] outline-none transition focus:ring-4"
        />
        <div className="text-muted-foreground mt-1 text-right text-[11px]">{topic.length}/1000</div>
      </div>

      {/* Generate button + C Coin gating */}
      {(() => {
        const insufficient = coins < coinCost;
        return (
          <div className="space-y-2">
            <button
              onClick={onGenerate}
              disabled={loading || insufficient}
              className="tap bg-gradient-brand shadow-glow inline-flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[16px] font-bold text-white disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Cooking magic…
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" /> Generate{" "}
                  {kind === "hook"
                    ? "Viral Hooks"
                    : kind === "hashtag"
                      ? "Hashtags"
                      : kind === "bio"
                        ? "Bios"
                        : "Captions"}
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-extrabold backdrop-blur">
                    <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-white/90 text-[8px] font-black text-orange-600">C</span>
                    −{coinCost}
                  </span>
                </>
              )}
            </button>

            {insufficient && (
              <div className="rounded-2xl border border-amber-300/60 bg-gradient-to-br from-amber-50 to-orange-50 p-3 text-center dark:from-amber-950/40 dark:to-orange-950/40">
                <div className="text-[13px] font-bold text-amber-700 dark:text-amber-200">
                  Not enough C Coins. Watch an ad to earn more.
                </div>
                <button
                  onClick={onUnlockPremium}
                  disabled={rewardLoading}
                  className="tap mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 py-3 text-sm font-bold text-white shadow-pop disabled:opacity-60"
                >
                  <Crown className="h-4 w-4" />
                  {rewardLoading ? "Showing ad…" : "Watch Ad & Earn 10 C Coins"}
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Results */}
      <div ref={resultsRef} className="space-y-3 pt-2">
        {result && (
          <>
            <h2 className="text-foreground/80 px-1 text-xs font-bold tracking-widest uppercase">
              ✨ Fresh from the oven
            </h2>
            {(premiumUnlocked ? result.items : result.items.slice(0, 2)).map((item, i) => (
              <ResultCard
                key={i}
                rank={i + 1}
                viralScore={item.viralScore}
                viralReason={item.viralReason}
                text={item.text}
                hashtags={item.hashtags}
                onCopy={() => onCopy(item.text, item.hashtags)}
                onSave={() => onSave(item.text, item.hashtags)}
              />
            ))}

            {/* Rewarded unlock — only when more items are gated */}
            {!premiumUnlocked && result.items.length > 2 && (
              <button
                onClick={onUnlockPremium}
                disabled={rewardLoading}
                className="tap relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 p-4 text-left text-white shadow-glow disabled:opacity-60"
              >
                <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/25 blur-2xl" />
                <div className="relative flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/25 backdrop-blur">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[15px] font-bold leading-tight">
                      {rewardLoading ? "Showing ad…" : "Watch Ad & Unlock Premium Results"}
                    </div>
                    <div className="text-[11px] opacity-90">
                      {`Watch a short ad to reveal ${result.items.length - 2} more premium variants.`}
                    </div>

                  </div>
                  <ChevronRight className="h-5 w-5 opacity-90" />
                </div>
              </button>
            )}

            {/* Reserved sponsored slot below results — AdMob banner overlays here on the APK build */}
            <div
              aria-label="Sponsored"
              className="flex items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/40 px-3 py-3 text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
            >
              Sponsored
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SAVED SCREEN
   ============================================================ */
function SavedScreen({
  favorites,
  onCopy,
  onRemove,
  onClear,
  onGoGenerate,
}: {
  favorites: SavedItem[];
  onCopy: (text: string, tags: string[]) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onGoGenerate: () => void;
}) {
  return (
    <div className="screen-enter space-y-3 px-4 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-sun grid h-10 w-10 place-items-center rounded-2xl text-white shadow-pop">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          <div>
            <div className="font-display text-base font-bold">Favorites</div>
            <div className="text-muted-foreground text-[11px]">{favorites.length} saved</div>
          </div>
        </div>
        {favorites.length > 0 && (
          <button
            onClick={onClear}
            className="tap text-muted-foreground inline-flex items-center gap-1 text-xs font-bold"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-3xl glass-strong p-10 text-center">
          <div className="bg-gradient-brand mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <div className="font-display text-lg font-bold">No saves yet</div>
          <p className="text-muted-foreground mt-1 text-sm">
            Tap the heart on any result to save it here.
          </p>
          <button
            onClick={onGoGenerate}
            className="tap bg-gradient-brand mt-5 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-pop"
          >
            <Sparkles className="h-4 w-4" /> Generate now
          </button>
        </div>
      ) : (
        favorites.map((f) => (
          <div key={f.id} className="bg-card rounded-2xl border p-4 shadow-pop">
            <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-2 text-[10px] font-bold tracking-wide uppercase">
              <span className="bg-gradient-brand rounded-full px-2 py-0.5 text-white">{f.platform}</span>
              <span>{f.mode}</span>
              <span>• {f.tone}</span>
            </div>
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{f.text}</p>
            {f.hashtags.length > 0 && (
              <p className="text-primary mt-2 text-xs font-medium break-words">{f.hashtags.join(" ")}</p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onCopy(f.text, f.hashtags)}
                className="tap bg-muted inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold"
              >
                <Copy className="h-3 w-3" /> Copy
              </button>
              <button
                onClick={() => onRemove(f.id)}
                className="tap text-muted-foreground ml-auto inline-flex items-center gap-1 text-xs font-bold"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ============================================================
   SETTINGS SCREEN
   ============================================================ */
function SettingsScreen({
  streak,
  favoritesCount,
}: {
  streak: { count: number; generated: number };
  favoritesCount: number;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [theme, setTheme] = useTheme();

  const themeOptions: { id: ThemeMode; label: string; Icon: typeof Sun }[] = [
    { id: "light", label: "Light", Icon: Sun },
    { id: "dark", label: "Dark", Icon: Moon },
    { id: "system", label: "System", Icon: Monitor },
  ];

  const SUPPORT_EMAIL = "p695071@gmail.com";

  const sections: Array<{
    id: string;
    Icon: typeof Sparkles;
    label: string;
    summary: string;
    body: ReactNode;
  }> = [
    {
      id: "how",
      Icon: HelpCircle,
      label: "How it Works",
      summary: "Generate captions in 3 simple steps",
      body: (
        <div className="space-y-3 text-sm leading-relaxed text-foreground/85">
          <p>Create scroll-stopping content in seconds:</p>
          <ol className="space-y-2 pl-1">
            <li className="flex gap-3">
              <span className="bg-gradient-brand grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white">1</span>
              <span><strong>Enter your topic</strong> — describe what you want to post about.</span>
            </li>
            <li className="flex gap-3">
              <span className="bg-gradient-brand grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white">2</span>
              <span><strong>Generate AI content</strong> — pick a platform, tone and language, then hit Generate.</span>
            </li>
            <li className="flex gap-3">
              <span className="bg-gradient-brand grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white">3</span>
              <span><strong>Copy, Save or Share</strong> any result instantly.</span>
            </li>
          </ol>
        </div>
      ),
    },
    {
      id: "privacy",
      Icon: Shield,
      label: "Privacy Policy",
      summary: "How we handle your data",
      body: (
        <div className="space-y-2 text-sm leading-relaxed text-foreground/85">
          <p>Your privacy matters to us.</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>We <strong>do not sell</strong> personal data to anyone.</li>
            <li>User content is processed securely and used <strong>only to generate results</strong>.</li>
            <li>Saved items stay on your device — not on our servers.</li>
            <li>We do not share your topics or generated content with third parties for marketing.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "terms",
      Icon: FileText,
      label: "Terms of Use",
      summary: "Please use the app responsibly",
      body: (
        <div className="space-y-2 text-sm leading-relaxed text-foreground/85">
          <p>By using CaptionLab Pro, you agree to:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Use the app responsibly and lawfully.</li>
            <li><strong>Do not generate illegal, harmful, or misleading content.</strong></li>
            <li>Avoid hateful, abusive, or deceptive material.</li>
            <li>Take responsibility for content you publish — AI results may need review before posting.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "contact",
      Icon: Mail,
      label: "Contact Support",
      summary: "We're here to help",
      body: (
        <div className="space-y-3 text-sm leading-relaxed text-foreground/85">
          <p>Questions, feedback or issues? We'd love to hear from you.</p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="tap bg-gradient-brand inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-pop"
          >
            <Mail className="h-4 w-4" />
            {SUPPORT_EMAIL}
          </a>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(SUPPORT_EMAIL);
              toast.success("Email copied");
            }}
            className="tap bg-card hover:bg-muted/60 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold"
          >
            <Copy className="h-3.5 w-3.5" /> Copy email
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="screen-enter space-y-5 px-4 pt-6 pb-4">
      {/* Branding */}
      <div className="flex flex-col items-center rounded-[1.75rem] glass-strong p-6 text-center shadow-glow">
        <div className="relative h-24 w-24">
          <div className="bg-gradient-brand absolute -inset-3 rounded-[2.5rem] opacity-50 blur-2xl" />
          <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] shadow-glow ring-1 ring-white/30">
            <img src={logo} alt="CaptionLab Pro" className="h-full w-full object-cover" />
          </div>
        </div>
        <h4 className="font-display mt-4 text-lg font-bold">
          CaptionLab <span className="text-gradient">Pro</span>
        </h4>
        <p className="text-muted-foreground mt-1 text-xs">AI-powered content studio</p>
      </div>

      {/* Stats */}
      <div>
        <div className="text-muted-foreground mb-2 text-[11px] font-bold tracking-widest uppercase">Your Activity</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card rounded-2xl border p-3 text-center">
            <div className="bg-gradient-sun mx-auto mb-1.5 grid h-8 w-8 place-items-center rounded-lg text-white shadow-pop">
              <Flame className="h-4 w-4" />
            </div>
            <div className="font-display text-xl font-bold">{streak.count}</div>
            <div className="text-muted-foreground text-[10px] font-semibold">Day Streak</div>
          </div>
          <div className="bg-card rounded-2xl border p-3 text-center">
            <div className="bg-gradient-brand mx-auto mb-1.5 grid h-8 w-8 place-items-center rounded-lg text-white shadow-pop">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="font-display text-xl font-bold">{streak.generated}</div>
            <div className="text-muted-foreground text-[10px] font-semibold">Generated</div>
          </div>
          <div className="bg-card rounded-2xl border p-3 text-center">
            <div className="bg-gradient-brand mx-auto mb-1.5 grid h-8 w-8 place-items-center rounded-lg text-white shadow-pop">
              <Bookmark className="h-4 w-4" />
            </div>
            <div className="font-display text-xl font-bold">{favoritesCount}</div>
            <div className="text-muted-foreground text-[10px] font-semibold">Saved</div>
          </div>
        </div>
      </div>

      {/* Appearance / Theme */}
      <div>
        <div className="text-muted-foreground mb-2 text-[11px] font-bold tracking-widest uppercase">Appearance</div>
        <div className="bg-card rounded-2xl border p-3">
          <div className="mb-2 flex items-center gap-2 px-1">
            <div className="bg-gradient-brand grid h-8 w-8 place-items-center rounded-lg text-white shadow-pop">
              <Sun className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">Theme</div>
              <div className="text-muted-foreground text-xs">Choose light, dark or system</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map(({ id, label, Icon }) => {
              const active = theme === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setTheme(id);
                    toast.success(`${label} theme applied`);
                  }}
                  aria-pressed={active}
                  className={cn(
                    "tap flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-semibold transition",
                    active
                      ? "bg-gradient-brand border-transparent text-white shadow-pop"
                      : "bg-background hover:bg-muted/60 text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Support & Legal */}
      <div className="space-y-2">
        <div className="text-muted-foreground mb-1 text-[11px] font-bold tracking-widest uppercase">Support & Legal</div>
        {sections.map(({ id, Icon, label, summary, body }) => {
          const isOpen = open === id;
          return (
            <div key={id} className="bg-card overflow-hidden rounded-xl border">
              <button
                onClick={() => setOpen(isOpen ? null : id)}
                className="tap flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-muted/60"
                aria-expanded={isOpen}
              >
                <div className="bg-gradient-brand grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white shadow-pop">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{label}</div>
                  <div className="text-muted-foreground text-xs truncate">{summary}</div>
                </div>
                <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
              </button>
              {isOpen && (
                <div className="border-t bg-muted/30 px-4 py-4">
                  {body}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* About */}
      <div className="rounded-2xl bg-card border p-4">
        <div className="text-muted-foreground mb-2 text-[11px] font-bold tracking-wide uppercase">About</div>
        <p className="text-foreground/80 text-sm leading-relaxed">
          CaptionLab Pro uses AI to craft scroll-stopping captions, bios, hooks, and hashtags for Instagram, TikTok, LinkedIn, X, and YouTube. Built for creators who want professional copy in seconds.
        </p>
      </div>

      {/* Footer */}
      <div className="text-muted-foreground pb-6 text-center text-[11px]">
        <div className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="font-semibold">Version {APP_VERSION}</span>
        </div>
        <p className="mt-1 opacity-70">Made with AI magic</p>
      </div>
    </div>
  );
}

/* ============================================================
   Reusable UI bits
   ============================================================ */
function TabBtn({
  icon,
  label,
  active,
  onClick,
  badge,
  accent,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "tap relative flex flex-col items-center justify-center gap-0.5 rounded-2xl py-2",
        active && !accent && "bg-muted",
        active && accent && "bg-gradient-brand text-white shadow-pop",
      )}
      aria-current={active ? "page" : undefined}
    >
      <div
        className={cn(
          "grid h-8 w-8 place-items-center rounded-xl [&_svg]:h-5 [&_svg]:w-5",
          active && accent ? "text-white" : active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {icon}
      </div>
      <span
        className={cn(
          "text-[10px] font-bold",
          active && accent ? "text-white" : active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-1 right-3 grid h-4 min-w-4 place-items-center rounded-full bg-pink-500 px-1 text-[9px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

function SectionTitle({
  eyebrow,
  title,
  Icon,
}: {
  eyebrow: string;
  title: string;
  Icon?: typeof Sparkles;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      {Icon && (
        <div className="bg-gradient-sun grid h-7 w-7 place-items-center rounded-lg text-white shadow-pop">
          <Icon className="h-3.5 w-3.5" />
        </div>
      )}
      <div className="leading-tight">
        <div className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">{eyebrow}</div>
        <div className="font-display text-[17px] font-bold">{title}</div>
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  tint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tint: "brand" | "sun";
}) {
  return (
    <div className="glass relative overflow-hidden rounded-2xl border p-3.5">
      <div className={cn("absolute inset-x-0 top-0 h-0.5", tint === "sun" ? "bg-gradient-sun" : "bg-gradient-brand")} />
      <div className="flex items-center gap-2.5">
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl text-white shadow-pop", tint === "sun" ? "bg-gradient-sun" : "bg-gradient-brand")}>
          {icon}
        </div>
        <div className="min-w-0 leading-tight">
          <div className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">{label}</div>
          <div className="font-display text-2xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <div className="text-foreground/70 mb-2 text-[11px] font-bold tracking-widest uppercase">
      {children}
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof Smile;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "tap inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold",
        active
          ? "bg-gradient-sun border-transparent text-white shadow-pop"
          : "bg-card text-muted-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      <span className={cn("ml-1 text-[10px]", active ? "opacity-90" : "opacity-60")}>
        {active ? "ON" : "OFF"}
      </span>
    </button>
  );
}

function ResultCard({
  rank,
  viralScore,
  viralReason,
  text,
  hashtags,
  onCopy,
  onSave,
}: {
  rank: number;
  viralScore: number;
  viralReason?: string;
  text: string;
  hashtags: string[];
  onCopy: () => void;
  onSave: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const tier =
    viralScore >= 85
      ? { label: "🔥 Viral", cls: "bg-gradient-to-r from-orange-500 to-pink-600 text-white" }
      : viralScore >= 70
        ? { label: "⚡ Hot", cls: "bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white" }
        : viralScore >= 55
          ? { label: "✨ Strong", cls: "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white" }
          : { label: "Solid", cls: "bg-muted text-foreground" };

  const rankBadge =
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

  return (
    <div className="bg-card group relative overflow-hidden rounded-2xl border p-4 shadow-pop">
      <div className="bg-gradient-brand absolute top-0 left-0 h-full w-1" />
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-display text-base font-bold">{rankBadge}</span>
          <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", tier.cls)}>
            {tier.label}
          </span>
        </div>
        <span className="text-muted-foreground text-[11px] font-bold tabular-nums">
          {viralScore}<span className="opacity-60">/100</span>
        </span>
      </div>
      {/* Score bar */}
      <div className="bg-muted mb-3 h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="h-full bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-600 transition-all"
          style={{ width: `${viralScore}%` }}
        />
      </div>
      <p className="text-foreground text-[15px] leading-relaxed whitespace-pre-wrap">{text}</p>
      {hashtags.length > 0 && (
        <p className="text-primary mt-2 text-xs font-medium break-words">{hashtags.join(" ")}</p>
      )}
      {viralReason && (
        <p className="text-muted-foreground mt-2 text-[11px] italic">💡 {viralReason}</p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleCopy}
          className="tap bg-muted inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          onClick={handleSave}
          className={cn(
            "tap inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold",
            saved ? "bg-gradient-sun text-white" : "bg-muted",
          )}
        >
          <Heart className={cn("h-3.5 w-3.5", saved && "fill-current")} />
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="splash-screen fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#13072e] text-white">
      <div className="splash-mesh pointer-events-none absolute inset-0" />
      <div className="relative">
        <div className="splash-glow bg-gradient-brand absolute -inset-8 rounded-[3rem] opacity-70 blur-3xl" />
        <div className="relative h-32 w-32 overflow-hidden rounded-[2rem] shadow-glow ring-1 ring-white/30 sm:h-36 sm:w-36">
          <img src={logo} alt="CaptionLab Pro" className="h-full w-full object-cover" />
        </div>
      </div>
      <h1 className="font-display relative mt-8 px-6 text-center text-2xl font-bold tracking-tight">
        AI Caption & Bio{" "}
        <span className="bg-gradient-to-r from-[#22d3ee] via-[#a78bfa] to-[#f0abfc] bg-clip-text text-transparent">
          Generator Pro
        </span>
      </h1>
      <p className="relative mt-2 text-sm text-white/70">Create viral content in seconds</p>
    </div>
  );
}
