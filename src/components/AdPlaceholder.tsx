/**
 * Web preview placeholder shown wherever a real ad slot lives.
 * Real AdMob ads only render inside the Android/iOS APK build.
 */
export function AdPlaceholder({
  label = "Ad space",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <section
      aria-label="Ad placeholder"
      className={
        "rounded-2xl border border-dashed border-border/60 bg-muted/30 p-4 text-center " +
        className
      }
    >
      <div className="text-muted-foreground text-[9px] font-bold tracking-widest uppercase">
        Sponsored
      </div>
      <div className="mt-1 text-[12px] font-semibold text-foreground/80">
        {label}
      </div>
      <div className="text-muted-foreground mt-0.5 text-[10px]">
        Real ads appear only in the Android / iOS app.
      </div>
    </section>
  );
}

export default AdPlaceholder;
