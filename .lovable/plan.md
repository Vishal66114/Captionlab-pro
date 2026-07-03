## Goal

Web app me Adsterra Native Banner (Home pe ek card) chalega, aur ise Capacitor se Android APK me wrap karke AdMob Banner / Interstitial / Rewarded ads native plugin se chalayenge. UI clean, mobile-friendly, non-intrusive.

## Architecture

```text
Web (browser & APK WebView)
  └─ Adsterra Native Banner   → Home screen me ek card
  └─ Ad slot components       → Home bottom, below results, rewarded button

Capacitor Android shell (APK only)
  └─ @capacitor-community/admob
       ├─ Banner       → Home bottom + below results (native overlay)
       ├─ Interstitial → har 5 generations ke baad
       └─ Rewarded     → "Watch Ad & Unlock Premium Results" button
```

Browser preview me AdMob calls **no-op** rahenge (Capacitor.isNativePlatform() check). Sirf APK build me real ads dikhenge. Adsterra dono jagah (web + APK WebView) me chalega.

## What I'll build

**1. Capacitor setup**
- Install: `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor-community/admob`
- `capacitor.config.ts` with appId `com.lovable.viralcaption` (placeholder — user can rename), webDir `dist`, AdMob plugin config with provided App ID
- Add `android` platform folder generation instructions in README (user runs `bunx cap add android` locally — sandbox can't build APK)

**2. Ad service wrapper** — `src/lib/ads.ts`
- `initAds()` — calls AdMob.initialize() only on native
- `showBanner()` / `hideBanner()` — bottom banner control
- `maybeShowInterstitial()` — counter persisted in localStorage; fires every 5th generation
- `showRewarded()` — returns Promise<boolean> for unlock
- All methods are safe no-ops on web (so dev preview doesn't crash)
- AdMob unit IDs hardcoded from user's message

**3. Adsterra Native Banner component** — `src/components/AdsterraNative.tsx`
- Injects the provided `<script>` + `<div id="container-6d843a4432899d6e73cca3a3aeb47c33">` once
- Cleans up on unmount
- Renders ONE instance only on Home screen

**4. Home screen changes** — `src/routes/index.tsx`
- Insert `<AdsterraNative />` card in Home feed (single instance, styled to match cards)
- Add bottom banner spacer + call `showBanner()` on mount / `hideBanner()` on unmount of Home
- Below generated results: add a styled "Sponsored" slot (Adsterra placeholder div for web; AdMob banner sits as native overlay on APK so the spacer reserves height)
- Hook `maybeShowInterstitial()` into the generate success path
- Add "Watch Ad & Unlock Premium Results" button near results — calls `showRewarded()`, on success sets a `premiumUnlocked` flag for that session and re-renders results with extra variants/longer output

**5. Init**
- Call `initAds()` from `src/routes/__root.tsx` once on mount

## Files

- new: `capacitor.config.ts`
- new: `src/lib/ads.ts`
- new: `src/components/AdsterraNative.tsx`
- edit: `src/routes/__root.tsx` (init ads)
- edit: `src/routes/index.tsx` (banner slots, native card, interstitial trigger, rewarded button)
- new: `ANDROID_BUILD.md` (steps for user to run `bunx cap add android && bunx cap sync && open in Android Studio` locally — sandbox cannot produce APK)

## Constraints / honest notes

- Sandbox cannot build the Android APK. I'll set up all config + code; user runs `cap add android` + Android Studio build locally.
- AdMob ads will NOT appear in the Lovable web preview — that's expected. Only Adsterra is visible in browser.
- Interstitial cap: every 5 generations, with a 60s minimum gap to avoid spam (Google policy).
- Rewarded unlock state is per-session (not persisted) to avoid free-forever unlock.
