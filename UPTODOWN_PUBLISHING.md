# Uptodown Publishing Guide — 100% Approval Checklist

Yeh guide step-by-step batata hai kaise APK banake Uptodown pe submit karein
taaki **reject na ho**. Uptodown ke top rejection reasons aur unke fix sab cover hain.

---

## 0. Top reasons Uptodown rejects APKs (aur humne kya kiya)

| Reject reason | Fix in this project |
|---|---|
| App launch hote hi crash | AdMob init failure ab silently disable hota hai (`src/lib/ads.ts`), App ID galat ho to bhi crash nahi hoga |
| AdMob App ID missing in AndroidManifest | Step 5 me add karna mandatory hai (warna real device pe crash) |
| Privacy Policy URL nahi diya | `public/privacy-policy.html` + `public/terms.html` ready hain — host karke link do |
| Unsigned / debug APK | Step 7: release keystore se sign karna mandatory |
| Misleading metadata / screenshots | Real screenshots use karo, copyrighted logos avoid karo |
| Permissions zyada maange | Sirf `INTERNET` permission hai (default) — kuch extra add mat karo |
| Target SDK purana | Capacitor 8 = targetSdk 35 (Android 15) — Uptodown 2026 OK |
| Adult / illegal content | Terms me clearly likha hai disallowed |

---

## 1. Local setup (ek baar)

```bash
# Android Studio + JDK 17 install karo, phir:
bun install
bun run build
bunx cap add android        # sirf pehli baar
```

## 2. Har code change ke baad

```bash
bun run build
bunx cap sync android
```

## 3. App icon & splash

`public/app-icon.png` already 512x512 hai. Better quality ke liye:

```bash
bunx @capacitor/assets generate --android \
  --iconBackgroundColor "#1A0B2E" \
  --splashBackgroundColor "#1A0B2E"
```
(`@capacitor/assets` ko `bun add -D @capacitor/assets` se install karo, aur
1024x1024 ka `assets/icon.png` aur `assets/splash.png` rakho.)

## 4. AdMob App ID set karo (CRITICAL)

1. AdMob console → Apps → tumhari app → **App ID** copy karo
   (format: `ca-app-pub-7140094116826772~XXXXXXXXXX`).
2. `capacitor.config.ts` me `plugins.AdMob.appId` replace karo.
3. `android/app/src/main/AndroidManifest.xml` open karo, `<application>` tag ke
   andar yeh add karo (warna real device pe **crash**):

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-7140094116826772~XXXXXXXXXX"/>
```

Agar App ID abhi ready nahi hai, App ID test wala dalo
(`ca-app-pub-3940256099942544~3347511713`) — phir bhi crash nahi hoga, ads
test mode me chalengi.

## 5. Version & app metadata

`android/app/build.gradle` me:

```gradle
defaultConfig {
    applicationId "com.captionlab.pro"
    versionCode 1            // har release pe +1
    versionName "1.0.0"
    minSdkVersion 23
    targetSdkVersion 35
}
```

## 6. Privacy Policy host karo (Uptodown mandatory)

`public/privacy-policy.html` aur `public/terms.html` ready hain. Web app
publish karne ke baad URLs aise honge:

- `https://YOUR-DOMAIN/privacy-policy.html`
- `https://YOUR-DOMAIN/terms.html`

Yeh URL Uptodown form me **Privacy Policy URL** field me dalna mandatory hai.

## 7. Release APK sign karo

```bash
# Keystore generate (ek baar):
keytool -genkey -v -keystore captionlab.keystore \
  -alias captionlab -keyalg RSA -keysize 2048 -validity 10000
```

`android/app/build.gradle` me:

```gradle
android {
  signingConfigs {
    release {
      storeFile file("../../captionlab.keystore")
      storePassword "YOUR_PASS"
      keyAlias "captionlab"
      keyPassword "YOUR_PASS"
    }
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
      minifyEnabled true
      shrinkResources true
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
  }
}
```

Phir Android Studio me: **Build → Generate Signed Bundle / APK → APK →
release**. Output: `android/app/build/outputs/apk/release/app-release.apk`.

## 8. APK test karo SUBMIT KARNE SE PEHLE

Yeh checks ek real Android phone pe karo — Uptodown reviewer bhi yeh dekhega:

- [ ] App install hoke open hota hai, crash nahi karta
- [ ] Splash ke baad Home screen aata hai
- [ ] Topic likhke "Generate" button kaam karta hai
- [ ] Result copy / save / share teeno chalti hain
- [ ] Settings → Privacy Policy / Terms / Contact open hote hain
- [ ] Banner ad bottom me dikhti hai (ya test ad if App ID test wala)
- [ ] 5 generations ke baad interstitial dikhti hai
- [ ] "Watch Ad & Unlock Premium" rewarded ad chalti hai
- [ ] Back button galat jagah app band nahi karta
- [ ] Internet off karke bhi UI crash nahi karta (graceful error)

## 9. Uptodown form fill karte waqt

| Field | Value |
|---|---|
| App name | Caption & Bio Generator Pro |
| Category | Tools / Productivity |
| Short description | AI captions & bios for Instagram, TikTok, LinkedIn, X |
| Full description | Use Settings page text — clear, no spam keywords |
| Privacy Policy URL | `https://YOUR-DOMAIN/privacy-policy.html` |
| Contact email | p695071@gmail.com |
| Screenshots | Real phone screenshots, minimum 2 (Home + Result) |
| Content rating | Everyone (no adult content) |
| Ads disclosure | **Contains ads** = YES |

## 10. Common rejection ke quick fixes

- **"App crashes on launch"** → AdMob meta-data missing in AndroidManifest (Step 4)
- **"APK not signed"** → Step 7 follow karo, debug APK upload mat karo
- **"Privacy policy invalid"** → URL public hona chahiye, 404 nahi
- **"Misleading content"** → Description me "best", "#1", "guaranteed viral" jaise claims hatao
- **"Copyrighted material"** → Instagram/TikTok logo screenshots me mat dikhao, sirf text mention OK
- **"Duplicate app"** → Package name unique rakho (`com.captionlab.pro` already unique hai)

Yeh sab steps follow karoge to approval almost guaranteed hai. Best of luck!
