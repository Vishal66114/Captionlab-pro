/**
 * Ad wrapper — routes through Unity Ads.
 * Real Unity Ads run in native (AppCreator24) shell via a `window.UnityAdsBridge`.
 * In web preview a fallback modal enforces a 5s watch before granting rewards.
 */

import {
  initUnityAds,
  showUnityRewarded,
  showUnityInterstitial,
  showUnityBanner,
  hideUnityBanner,
  UNITY_CONFIG,
} from "./unity-ads";

export const ADMOB_IDS = { banner: "", interstitial: "", rewarded: "" };
export const AD_CONFIG = UNITY_CONFIG;

export async function initAds(): Promise<boolean> {
  return initUnityAds();
}

export async function showBanner(): Promise<boolean> {
  return showUnityBanner();
}

export async function hideBanner(): Promise<void> {
  return hideUnityBanner();
}

export async function resumeBanner(): Promise<boolean> {
  return showUnityBanner();
}

let interstitialCounter = 0;
export async function maybeShowInterstitial(): Promise<boolean> {
  interstitialCounter += 1;
  if (interstitialCounter % 5 !== 0) return false;
  return showUnityInterstitial();
}

export async function showRewarded(): Promise<boolean> {
  return showUnityRewarded();
}

export async function preloadRewarded(): Promise<void> {
  // Handled inside unity bridge init/load. No-op here.
}

export function isRewardedReady(): boolean {
  return true;
}

export function onRewardedReadyChange(cb: (ready: boolean) => void): () => void {
  try { cb(true); } catch {}
  return () => {};
}
